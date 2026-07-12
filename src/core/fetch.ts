import pLimit from 'p-limit';
import pRetry from 'p-retry';
import { getConfig, setToken } from './store';
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_TIMEOUT_MS,
  SESSION_EXPIRED_CODES,
  SUCCESS_CODES,
  buildApiUrl,
  appendQueryParams,
  type QueryParams,
} from './http';
import { EdApiError, EdAuthError, EdNetworkError } from './errors';
import { transform } from './transform';
import {
  buildHeaders,
  buildRequestBody,
  parseJsonResponse,
  sendRequest,
  type HttpMethod,
} from './http';
import { offlineQueue } from './queue';
import {
  resolveModule,
  getCacheTtl,
  buildCacheKey,
  getFromCache,
  setInCache,
} from './cache';
import type { DebugInfo, EdResponse } from '../types';

export interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: QueryParams;
  raw?: boolean;
  explain?: boolean;
  skipAuth?: boolean;
  useGtk?: string;
  twofaToken?: string;
  xToken?: string;
  isDownload?: boolean;
  skipQueue?: boolean;
  returnEnvelope?: boolean;
}

let refreshPromise: Promise<string | undefined> | null = null;

const MAX_REFRESH_ATTEMPTS = 1;

interface PreparedRequest {
  url: URL;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  options: FetchOptions;
}

const limiters = new Map<number, ReturnType<typeof pLimit>>();

function getLimiter(concurrency: number): ReturnType<typeof pLimit> {
  let limiter = limiters.get(concurrency);
  if (!limiter) {
    limiter = pLimit(concurrency);
    limiters.set(concurrency, limiter);
  }
  return limiter;
}

export async function edFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const config = getConfig();
  const limiter = getLimiter(config.concurrency ?? DEFAULT_CONCURRENCY);

  const runRequest = async (refreshAttempts = 0): Promise<T> => {
    const cacheModule = resolveModule(endpoint);
    const cacheKey = cacheModule
      ? buildCacheKey(endpoint, options.body)
      : undefined;
    const ttl = cacheModule ? getCacheTtl(cacheModule) : 0;
    const isCacheable =
      ttl > 0 && !options.raw && !options.isDownload && !options.returnEnvelope;

    if (isCacheable && cacheKey) {
      const cached = getFromCache<unknown>(cacheKey);
      if (cached !== undefined) {
        return cached as T;
      }
    }

    const request = prepareRequest(endpoint, options);
    let response: Response;

    try {
      response = await sendRequest({
        url: request.url.toString(),
        method: request.method,
        headers: request.headers,
        body: request.body,
        timeoutMs: config.timeout ?? DEFAULT_TIMEOUT_MS,
      });
    } catch (error) {
      if (
        config.offlineQueue &&
        !options.skipQueue &&
        !options.skipAuth &&
        options.method !== 'GET'
      ) {
        offlineQueue.push(endpoint, options as Record<string, unknown>);
      }

      throw error;
    }

    if (options.isDownload) {
      return response as T;
    }

    const headerToken = response.headers.get('x-token');

    const data = await parseJsonResponse(response);

    if (headerToken) {
      setToken(headerToken);
      data.token = headerToken;
    }

    if (isSessionExpired(data)) {
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        throw new EdAuthError(
          data.message || 'Session expired after refresh attempt',
          String(data.code),
          response.status,
          data,
        );
      }

      if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;

      if (!refreshed) {
        throw new EdAuthError(
          data.message || 'Session expired',
          String(data.code),
          response.status,
          data,
        );
      }

      return runRequest(refreshAttempts + 1);
    }

    throwIfApiError(data, response);

    const result = prepareResponseData<T>(data, request, options);

    if (isCacheable && cacheKey) {
      setInCache(cacheKey, result, ttl);
    }

    return result;
  };

  return limiter(() =>
    pRetry(runRequest, {
      retries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      minTimeout: config.retryDelay ?? DEFAULT_RETRY_DELAY_MS,
      factor: 2,
      onFailedAttempt: async ({ error }) => {
        if (config.onError) {
          await config.onError(error, async (retryOpts) => {
            await new Promise((r) => setTimeout(r, retryOpts?.delay ?? 1000));
          });
        }
      },
      shouldRetry: async ({ error }) => {
        return !isNonRetryable(error);
      },
    }),
  );
}

function prepareRequest(
  endpoint: string,
  options: FetchOptions,
): PreparedRequest {
  const url = buildApiUrl(endpoint);
  appendQueryParams(url, options.params);

  return {
    url,
    method: options.method ?? 'POST',
    headers: buildHeaders({
      skipAuth: options.skipAuth,
      useGtk: options.useGtk,
      twofaToken: options.twofaToken,
      xToken: options.xToken,
    }),
    body: buildRequestBody(endpoint, options.body),
    options,
  };
}

function isSessionExpired(data: EdResponse<unknown>): boolean {
  return SESSION_EXPIRED_CODES.has(data.code);
}

function throwIfApiError(data: EdResponse<unknown>, response: Response): void {
  if (!SUCCESS_CODES.has(data.code)) {
    throw new EdApiError(
      data.message || 'API error',
      String(data.code),
      response.status,
      data,
    );
  }
}

function prepareResponseData<T>(
  data: EdResponse<T>,
  request: PreparedRequest,
  options: FetchOptions,
): T {
  if (data.token) {
    setToken(data.token);
  }

  if (options.returnEnvelope) {
    return data as unknown as T;
  }

  const result = options.raw ? data.data : transform(data.data);

  if (options.explain) {
    return addDebugInfo(result, data, request) as T;
  }

  return result;
}

function addDebugInfo<T>(
  result: T,
  rawResponse: EdResponse<T>,
  request: PreparedRequest,
): T & { _debug: DebugInfo } {
  return {
    ...result,
    _debug: {
      rawResponse,
      transformLog: [],
      requestDump: {
        url: request.url.toString(),
        headers: request.headers,
        body: request.options.body,
      },
      cacheHit: false,
      retries: 0,
    },
  };
}

function isNonRetryable(error: unknown): boolean {
  return error instanceof EdAuthError || error instanceof EdApiError;
}

async function refreshSession(): Promise<string | undefined> {
  try {
    const { refreshToken } = await import('../auth');
    const token = await refreshToken();

    setToken(token);
    return token;
  } catch {
    return undefined;
  }
}

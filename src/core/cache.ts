import { getConfig } from './store';
import type { CacheConfig } from '../types';

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const DEFAULT_MAX_CACHE_ENTRIES = 256;
const CLEANUP_INTERVAL_MS = 60_000;

const cache = new Map<string, CacheEntry>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) cache.delete(key);
  }
}

function evictOldest(count: number): void {
  let deleted = 0;
  for (const key of cache.keys()) {
    if (deleted >= count) break;
    cache.delete(key);
    deleted++;
  }
}

function ensureSizeLimit(): void {
  const maxEntries = getConfig().cacheMaxEntries ?? DEFAULT_MAX_CACHE_ENTRIES;
  if (cache.size > maxEntries) {
    evictExpired();
  }
  if (cache.size > maxEntries) {
    evictOldest(cache.size - maxEntries);
  }
}

function startCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(evictExpired, CLEANUP_INTERVAL_MS);
}

export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

const ENDPOINT_TO_MODULE: Array<{
  pattern: RegExp;
  module: keyof CacheConfig;
}> = [
  { pattern: /\/notes\.awp/, module: 'grades' },
  { pattern: /\/emploidutemps\.awp/, module: 'timetable' },
  { pattern: /\/messages\.awp/, module: 'messages' },
  { pattern: /\/cahierdetexte\.awp/, module: 'homework' },
  { pattern: /\/elevesDocuments\.awp/, module: 'documents' },
  { pattern: /\/cloud\//, module: 'cloud' },
  { pattern: /\/viescolaire\.awp/, module: 'attendance' },
  { pattern: /\/timeline\.awp/, module: 'timeline' },
];

export function resolveModule(endpoint: string): keyof CacheConfig | undefined {
  for (const { pattern, module } of ENDPOINT_TO_MODULE) {
    if (pattern.test(endpoint)) return module;
  }
  return undefined;
}

export function parseDuration(str: string | false | undefined): number {
  if (!str) return 0;
  const match = str.match(/^(\d+)([smh])$/);
  if (!match) return 0;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return val * 1000;
    case 'm':
      return val * 60_000;
    case 'h':
      return val * 3_600_000;
    default:
      return 0;
  }
}

export function getCacheTtl(module: keyof CacheConfig): number {
  const config = getConfig().cache;
  if (!config) return 0;
  return parseDuration(config[module]);
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(',')}}`;
}

export function buildCacheKey(endpoint: string, body?: unknown): string {
  const bodyHash = body ? stableStringify(body) : '';
  return `${endpoint}::${bodyHash}`;
}

export function getFromCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function setInCache(key: string, data: unknown, ttlMs: number): void {
  if (ttlMs <= 0) return;
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
  ensureSizeLimit();
  startCleanup();
}

export function clearCache(): void {
  cache.clear();
  stopCleanup();
}

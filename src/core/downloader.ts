import { edFetch } from './fetch';
import { getToken } from './store';

export type DownloadFormat = 'buffer' | 'blob' | 'stream';

export interface DownloadOptions {
  as?: DownloadFormat;
  params?: Record<string, unknown>;
}

export async function download(
  url: string,
  options: DownloadOptions = {},
): Promise<ArrayBuffer | Blob | ReadableStream> {
  const token = getToken();

  const response = await edFetch<Response>(url, {
    method: 'POST',
    body: {
      ...options.params,
      token,
    },
    skipAuth: true,
    isDownload: true,
  });

  return formatDownloadResponse(response, options.as ?? 'buffer');
}

function formatDownloadResponse(
  response: Response,
  format: DownloadFormat,
): Promise<ArrayBuffer | Blob | ReadableStream> {
  switch (format) {
    case 'blob':
      return response.blob();
    case 'stream':
      if (!response.body) {
        throw new Error('Response body is null — cannot stream');
      }
      return Promise.resolve(response.body);
    case 'buffer':
    default:
      return response.arrayBuffer();
  }
}

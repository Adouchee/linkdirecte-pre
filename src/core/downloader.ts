import { edFetch } from './fetch';
import { getToken } from './store';
import fs from 'node:fs/promises';

export type DownloadFormat = 'buffer' | 'blob' | 'stream';

export interface DownloadOptions {
  as?: DownloadFormat;
  filename?: string;
  params?: Record<string, unknown>;
}

export async function download(
  url: string,
  options: DownloadOptions = {},
): Promise<Buffer | Blob | ReadableStream> {
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

  if (options.filename) {
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    await fs.writeFile(options.filename, buffer);
  }

  return formatDownloadResponse(response, options.as ?? 'buffer');
}

function formatDownloadResponse(
  response: Response,
  format: DownloadFormat,
): Promise<Buffer | Blob | ReadableStream> {
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
      return response.arrayBuffer().then((buf) => Buffer.from(buf));
  }
}

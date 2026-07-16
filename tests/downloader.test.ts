import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { download, configure, clearSession } from '../src/index';
import { setToken } from '../src/core/store';

describe('Downloader Module', () => {
  let originalFetch: typeof globalThis.fetch;
  let lastRequest: { url: string; method: string; body: any } | null = null;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    lastRequest = null;
    setToken('test_token');
    configure({ maxRetries: 0 });
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    await clearSession();
  });

  it('downloads file in buffer format by default', async () => {
    const rawBuffer = new TextEncoder().encode('file_content').buffer;

    globalThis.fetch = async (input, init) => {
      const urlStr = input.toString();
      const method = init?.method || 'GET';
      let parsedBody: any = undefined;
      if (init?.body) {
        const bodyStr = init.body.toString();
        if (bodyStr.startsWith('data=')) {
          parsedBody = JSON.parse(decodeURIComponent(bodyStr.substring(5)));
        } else {
          parsedBody = bodyStr;
        }
      }
      lastRequest = { url: urlStr, method, body: parsedBody };

      return new Response(rawBuffer, {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    };

    const result = await download('telechargement.awp', {
      params: { fileId: 123 },
    });

    expect(lastRequest).toBeDefined();
    expect(lastRequest!.url).toContain('telechargement.awp');
    expect(lastRequest!.body).toEqual('fileId=123&token=test_token');
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result as ArrayBuffer)).toEqual(new Uint8Array(rawBuffer));
  });

  it('downloads file in blob format', async () => {
    globalThis.fetch = async (input, init) => {
      return new Response('some_content', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    };

    const result = await download('telechargement.awp', { as: 'blob' });

    expect(result).toBeInstanceOf(Blob);
    const text = await (result as Blob).text();
    expect(text).toBe('some_content');
  });

  it('downloads file in stream format', async () => {
    globalThis.fetch = async (input, init) => {
      return new Response('some_stream_content', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    };

    const result = await download('telechargement.awp', { as: 'stream' });

    expect(result).toBeInstanceOf(ReadableStream);
  });
});

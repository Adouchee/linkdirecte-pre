// © 2026 typeof (Scolup) | Licensed under AGPL 3.
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { offlineQueue } from '../src/core/queue';
import { configure, clearSession } from '../src/index';

describe('Offline Queue Module', () => {
  let originalFetch: typeof globalThis.fetch;
  let requests: string[] = [];

  const mockStorage = {
    store: new Map<string, string>(),
    get(key: string) {
      return this.store.get(key) || null;
    },
    set(key: string, val: string) {
      this.store.set(key, val);
    },
    delete(key: string) {
      this.store.delete(key);
    },
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    requests = [];
    mockStorage.store.clear();
    offlineQueue.getQueue().length = 0; 
    configure({
      storage: mockStorage,
      maxRetries: 0,
    });
    (offlineQueue as any).storage = mockStorage;
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    await clearSession();
  });

  it('pushes mutations to queue and persists them to storage', async () => {
    await offlineQueue.push('/some-endpoint.awp', { body: 'data' });

    const queue = offlineQueue.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].endpoint).toBe('/some-endpoint.awp');
    expect(queue[0].options).toEqual({ body: 'data' });

    
    const savedStr = mockStorage.get('ed_offline_queue');
    expect(savedStr).toBeDefined();
    expect(JSON.parse(savedStr!)[0].endpoint).toBe('/some-endpoint.awp');
  });

  it('flushes the queue successfully and deletes items upon successful request', async () => {
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      return new Response(JSON.stringify({ code: 200, message: '', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await offlineQueue.push('/mutation-1.awp', { method: 'POST', body: { x: 1 } });
    await offlineQueue.push('/mutation-2.awp', { method: 'POST', body: { x: 2 } });

    expect(offlineQueue.getQueue().length).toBe(2);

    await offlineQueue.flush();

    
    expect(requests.length).toBe(2);
    expect(requests[0]).toContain('/mutation-1.awp');
    expect(requests[1]).toContain('/mutation-2.awp');

    
    expect(offlineQueue.getQueue().length).toBe(0);
    const saved = JSON.parse(mockStorage.get('ed_offline_queue') || '[]');
    expect(saved.length).toBe(0);
  });
});
// © 2026 typeof (Scolup) | Licensed under AGPL 3.

// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
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

  it('prevents concurrent flushes from executing in parallel and duplicating calls', async () => {
    let callCount = 0;
    globalThis.fetch = async (input) => {
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
      return new Response(JSON.stringify({ code: 200, message: '', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await offlineQueue.push('/mutation-concurrent.awp', { method: 'POST', body: { x: 1 } });

    await Promise.all([offlineQueue.flush(), offlineQueue.flush()]);

    expect(callCount).toBe(1);
  });

  it('preserves mutations pushed before hydration resolves', async () => {
    let resolveGet: ((value: string | null) => void) | null = null;
    const deferredStorage = {
      store: new Map<string, string>(),
      get(key: string): Promise<string | null> {
        return new Promise((resolve) => {
          resolveGet = resolve;
        });
      },
      set(key: string, val: string) {
        this.store.set(key, val);
        return Promise.resolve();
      },
      delete(key: string) {
        this.store.delete(key);
        return Promise.resolve();
      },
    };

    deferredStorage.store.set('ed_offline_queue', JSON.stringify([{ id: '1', endpoint: '/old.awp', options: {}, timestamp: 1 }]));

    configure({ storage: deferredStorage, maxRetries: 0 });
    (offlineQueue as any).storage = deferredStorage;
    (offlineQueue as any).hydrationPromises.clear();

    const pushPromise = offlineQueue.push('/new.awp', { body: 'new' });

    await new Promise((r) => setTimeout(r, 5));

    resolveGet!(deferredStorage.store.get('ed_offline_queue') || null);

    await pushPromise;

    const queue = offlineQueue.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].endpoint).toBe('/old.awp');
    expect(queue[1].endpoint).toBe('/new.awp');

    const savedStr = deferredStorage.store.get('ed_offline_queue');
    const saved = JSON.parse(savedStr!);
    expect(saved.length).toBe(2);
    expect(saved[1].endpoint).toBe('/new.awp');
  });

  it('concurrent flush promises remain pending until delayed request completes', async () => {
    let resolveRequest: (() => void) | null = null;

    globalThis.fetch = async (input) => {
      await new Promise<void>((resolve) => {
        resolveRequest = resolve;
      });
      return new Response(JSON.stringify({ code: 200, message: '', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await offlineQueue.push('/delayed.awp', { method: 'POST' });

    const flush1 = offlineQueue.flush();
    const flush2 = offlineQueue.flush();

    let flush1Resolved = false;
    let flush2Resolved = false;

    flush1.then(() => { flush1Resolved = true; });
    flush2.then(() => { flush2Resolved = true; });

    await new Promise((r) => setTimeout(r, 10));

    expect(flush1Resolved).toBe(false);
    expect(flush2Resolved).toBe(false);

    resolveRequest!();

    await Promise.all([flush1, flush2]);

    expect(flush1Resolved).toBe(true);
    expect(flush2Resolved).toBe(true);
  });

  it('out-of-order StorageAdapter.set() calls preserve correct queue state', async () => {
    const setCallOrder: string[] = [];
    let pendingSets: Array<{ key: string; val: string; resolve: () => void }> = [];

    const asyncStorage = {
      store: new Map<string, string>(),
      get(key: string) {
        return Promise.resolve(this.store.get(key) || null);
      },
      set(key: string, val: string): Promise<void> {
        return new Promise((resolve) => {
          pendingSets.push({ key, val, resolve });
          setCallOrder.push(`enqueue:${val}`);
        });
      },
      delete(key: string) {
        this.store.delete(key);
        return Promise.resolve();
      },
    };

    configure({ storage: asyncStorage, maxRetries: 0 });
    (offlineQueue as any).storage = asyncStorage;
    (offlineQueue as any).hydrationPromises.clear();

    globalThis.fetch = async (input) => {
      return new Response(JSON.stringify({ code: 200, message: '', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const push1 = offlineQueue.push('/first.awp', {});
    const push2 = offlineQueue.push('/second.awp', {});

    await new Promise((r) => setTimeout(r, 5));

    expect(pendingSets.length).toBe(2);

    const secondSet = pendingSets.pop()!;
    asyncStorage.store.set(secondSet.key, secondSet.val);
    setCallOrder.push(`complete:second`);
    secondSet.resolve();

    const firstSet = pendingSets.shift()!;
    asyncStorage.store.set(firstSet.key, firstSet.val);
    setCallOrder.push(`complete:first`);
    firstSet.resolve();

    await Promise.all([push1, push2]);

    const savedStr = asyncStorage.store.get('ed_offline_queue');
    const saved = JSON.parse(savedStr!);
    expect(saved.length).toBe(2);
    expect(saved[0].endpoint).toBe('/first.awp');
    expect(saved[1].endpoint).toBe('/second.awp');

    pendingSets = [];
    await offlineQueue.flush();

    await new Promise((r) => setTimeout(r, 5));

    if (pendingSets.length > 0) {
      const flushSet = pendingSets.shift()!;
      asyncStorage.store.set(flushSet.key, flushSet.val);
      flushSet.resolve();
    }

    const finalStr = asyncStorage.store.get('ed_offline_queue');
    const final = JSON.parse(finalStr!);
    expect(final.length).toBe(0);
  });
});

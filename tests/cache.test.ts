import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  parseDuration,
  buildCacheKey,
  getFromCache,
  setInCache,
  clearCache,
  resolveModule,
} from '../src/core/cache';
import { setConfig } from '../src/core/store';

describe('Cache Core Module', () => {
  beforeEach(() => {
    clearCache();
    setConfig({ cacheMaxEntries: 3 }); // low limit to test eviction easily
  });

  afterEach(() => {
    clearCache();
  });

  it('correctly parses duration strings', () => {
    expect(parseDuration('10s')).toBe(10_000);
    expect(parseDuration('5m')).toBe(300_000);
    expect(parseDuration('2h')).toBe(7_200_000);
    expect(parseDuration(undefined)).toBe(0);
    expect(parseDuration('invalid')).toBe(0);
  });

  it('resolves modules correctly from endpoints', () => {
    expect(resolveModule('/eleves/9876/notes.awp')).toBe('grades');
    expect(resolveModule('/E/9876/emploidutemps.awp')).toBe('timetable');
    expect(resolveModule('/invalid-endpoint')).toBeUndefined();
  });

  it('handles standard cache set, get, hit and miss', () => {
    const key = buildCacheKey('/test-endpoint', { foo: 'bar', baz: 123 });
    const key2 = buildCacheKey('/test-endpoint', { baz: 123, foo: 'bar' });

    // Keys should be stable regardless of key order
    expect(key).toBe(key2);

    setInCache(key, { data: 'my_data' }, 10_000);

    const cached = getFromCache<any>(key);
    expect(cached).toBeDefined();
    expect(cached.data).toBe('my_data');

    // Miss on different key
    expect(getFromCache('another-key')).toBeUndefined();
  });

  it('expires entries properly', async () => {
    const key = 'expiring-key';
    setInCache(key, 'value', 2); // 2ms

    await new Promise((r) => setTimeout(r, 10));

    expect(getFromCache(key)).toBeUndefined();
  });

  it('evicts old entries when max size limit is exceeded', () => {
    // configured max entries is 3
    setInCache('k1', 'v1', 50_000);
    setInCache('k2', 'v2', 50_000);
    setInCache('k3', 'v3', 50_000);

    expect(getFromCache('k1')).toBe('v1');

    setInCache('k4', 'v4', 50_000); // triggers eviction of oldest

    expect(getFromCache('k1')).toBeUndefined(); // k1 was the oldest, should be evicted
    expect(getFromCache('k2')).toBe('v2');
    expect(getFromCache('k3')).toBe('v3');
    expect(getFromCache('k4')).toBe('v4');
  });
});

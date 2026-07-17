# Core Functionalities

This module covers the global configuration, storage management, file downloads, and offline capabilities of the SDK.

## Configuration & Stats

### `configure`

Sets the global configuration for the SDK.

```typescript
function configure(config: Partial<EdConfig>): void
```

#### `EdConfig` Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `userAgent` | `string` | *(Modern iOS ED UA)* | Custom User-Agent for requests. |
| `maxRetries` | `number` | `3` | Number of times to retry failed requests. |
| `retryDelay` | `number` | `500` | Initial delay between retries in ms. |
| `concurrency` | `number` | `3` | Max concurrent requests. |
| `timeout` | `number` | `15000` | Request timeout in ms. |
| `storage` | `StorageAdapter` | *auto-detected* | Session and data storage strategy. Auto-detects IndexedDB → localStorage → none. |
| `offlineQueue` | `boolean` | `false` | Enable/disable the offline mutation queue. |
| `prefetch` | `PrefetchConfig` | — | Background prefetching configuration. |
| `proxyUrl` | `string` | — | Custom API proxy base URL. |
| `onError` | `ErrorMiddleware` | — | Global error handling middleware. |
| `on2faRequired` | `(question: string, choices: string[]) => number \| Promise<number>` | — | Global 2FA callback. |
| `onCredentialsRequired` | `() => { identifiant, motdepasse } \| Promise<...>` | — | Callback to supply credentials on token refresh failure. |
| `cache` | `CacheConfig` | — | Per-module cache duration overrides. |

#### Example

```typescript
import { configure } from "linkdirecte";

configure({
  maxRetries: 5,
  // storage is auto-detected: IndexedDB > localStorage > none
});
```

---

### `getAccount`

Returns the currently active `Account` object, or `undefined` if not logged in.

```typescript
function getAccount(): Account | undefined
```

### `getLastTokenRefresh`

Returns the timestamp of the last token refresh.

```typescript
function getLastTokenRefresh(): Date | undefined
```

---

## Storage Adapters

When no `storage` option is provided, the SDK auto-detects the best available backend:

1. **IndexedDB** — if available (browsers, Cloudflare Workers, Deno)
2. **localStorage** — if available (browsers, Deno)
3. **Node/Bun File Storage** — if running in Node.js or Bun
4. **none** — in-memory only (all data lost on restart)

You can override this by passing an explicit adapter.

### `memoryStorage`

Default volatile storage. All data is lost when the process terminates.

### `indexedDBStorage`

Persistent storage backed by IndexedDB. Uses a dedicated `linkdirecte` database with a single `data` object store. Works in browsers, Cloudflare Workers, and Deno.

```typescript
import { configure, indexedDBStorage } from "linkdirecte";

configure({ storage: indexedDBStorage });
```

### `localStorageStorage`

Persistent storage backed by the Web `localStorage` API. Works in browsers and React Native.

```typescript
import { configure, localStorageStorage } from "linkdirecte";

configure({ storage: localStorageStorage });
```

### `nodeStorage`

Persistent storage backed by a JSON file on disk. Uses dynamic `import('node:fs/promises')` so it's safe to import in browser bundles — the import only fires when a method is called.

```typescript
import { configure, nodeStorage } from "linkdirecte";

// Default path: ./linkdirecte-session.json
configure({ storage: nodeStorage() });

// Or with a custom path
configure({ storage: nodeStorage("~/.linkdirecte/session.json") });
```

### `cloudflareKVStorage`

Persistent storage backed by a Cloudflare Workers KV namespace. Pass the KV binding from your worker's `env` object.

```typescript
import { configure, cloudflareKVStorage } from "linkdirecte";

export default {
  async fetch(request: Request, env: { SESSION_KV: KVNamespace }) {
    configure({ storage: cloudflareKVStorage(env.SESSION_KV) });
    // ...
  },
};
```

### `asyncStorage`

Factory that wraps any async key-value store into a `StorageAdapter`. Works in every runtime.

```typescript
function asyncStorage(backend: {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}): StorageAdapter
```

#### React Native example

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { configure, asyncStorage } from "linkdirecte";

configure({
  storage: asyncStorage({
    getItem: (k) => AsyncStorage.getItem(k),
    setItem: (k, v) => AsyncStorage.setItem(k, v),
    removeItem: (k) => AsyncStorage.removeItem(k),
  }),
});
```

---

## Downloads

### `download`

Downloads a file from EcoleDirecte (e.g., invoices, documents).

```typescript
function download(url: string, options?: DownloadOptions): Promise<ArrayBuffer | Blob | ReadableStream>
```

#### `DownloadOptions`

- `as`: Desired format (`"buffer"`, `"blob"`, or `"stream"`). Defaults to `"buffer"` (returns `ArrayBuffer`).
- `params`: Additional POST body parameters.

#### Example

```typescript
import { download } from "linkdirecte";

const data = await download("https://...");
// data is an ArrayBuffer — use it however your runtime needs
```

---

## Token Health

The SDK proactively monitors token validity using a lightweight health-check endpoint, rather than relying solely on detecting failures from regular API calls.

### How it works

1. **Proactive keepalive** — After login, 2FA completion, session restore, or token refresh, a 45-minute interval is started that checks token health via `POST /v3/rdt/sondages.awp`. If the token is expired (response code 521), it is automatically refreshed.
2. **Reactive fallback** — If a regular API call returns code 520, 521, or 525, `edFetch` triggers an automatic refresh and retries the request.

### `checkTokenHealth`

Checks whether the current session token is still valid by hitting a lightweight health-check endpoint.

```typescript
async function checkTokenHealth(): Promise<boolean>
```

Returns `true` if the token is valid (response code 200), `false` if expired (521) or on any error.

```typescript
import { checkTokenHealth } from "linkdirecte";

const valid = await checkTokenHealth();
if (!valid) {
  console.log("Token has expired");
}
```

### `startTokenKeepalive`

Starts a proactive keepalive loop that checks token health every 45 minutes and refreshes the token if expired.

```typescript
function startTokenKeepalive(): void
```

- Safe to call multiple times — subsequent calls reset the timer.
- Called automatically after `login()`, 2FA completion, `loadSession()`, and `refreshToken()`.
- If the refresh fails, keepalive stops and the reactive fallback in `edFetch` takes over.
- **No-ops silently** in environments without timer support (Cloudflare Workers, Vercel Edge). In these environments, the reactive fallback in `edFetch` handles session expiry automatically.

### `stopTokenKeepalive`

Stops the proactive token keepalive timer.

```typescript
function stopTokenKeepalive(): void
```

---

## Offline & Resilience

### `offlineQueue`

Manages mutations (like marking homework as done) that should be replayed when the network is available.

#### Methods

- `push(endpoint, options)`: Adds a request to the queue.
- `flush()`: Attempts to execute all queued requests.
- `getQueue()`: Returns the list of pending mutations.

---

## Prefetching

Prefetching allows you to warm up the cache by fetching data for multiple modules at once.

### `prefetchAll`

Fetches data for all or specific modules.

```typescript
function prefetchAll(config?: PrefetchConfig): Promise<void>
```

### `startAutoPrefetch`

Starts a background interval to regularly prefetch data.

```typescript
function startAutoPrefetch(): void
```

Requires `prefetch` to be enabled in global configuration:
```typescript
configure({
  prefetch: {
    enabled: true,
    interval: "15m", // Supports s, m, h
    modules: ["grades", "messages"]
  }
});

startAutoPrefetch();
```

### `stopAutoPrefetch`

Stops the background prefetch interval.

```typescript
function stopAutoPrefetch(): void
```

---

## Types

### `PrefetchConfig`
```typescript
interface PrefetchConfig {
  enabled?: boolean;
  interval?: string; // e.g. "30s", "5m", "1h"
  modules?: string[]; // e.g. ["grades", "messages", "homework", "timetable", "timeline"]
}
```

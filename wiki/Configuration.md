<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Configuration&amp;subtitle=Learn+how+to+configure+Linkdirecte.&amp;logo=lu%3ASettings2&amp;mode=light&amp;theme=blue&amp;align=left" /><img alt="Configuration | Learn how to configure Linkdirecte." src="https://shieldcn.dev/header/glow.svg?title=Configuration&amp;subtitle=Learn+how+to+configure+Linkdirecte.&amp;logo=lu%3ASettings2&amp;mode=dark&amp;theme=blue&amp;align=left" /></picture>
</p>

The Core module handles global SDK configurations, session state preservation via **Storage Adapters**, file downloads, proactive token health keepalives, background data prefetching, and transparent storage encryption.

---

## 🛠️ Global Configuration

You can customize how Linkdirecte behaves (such as request timeouts, retry behavior, caching, and offline queues) globally by calling the `configure` function.

### `configure`

```typescript
import { configure } from "linkdirecte";

configure({
  maxRetries: 5,
  retryDelay: 1000,
  timeout: 10000, // 10 seconds timeout
  offlineQueue: true, // Queue actions if offline!
});
```

### All Configuration Options (`EdConfig`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `userAgent` | `string` | *(Modern iOS mobile user agent)* | Custom User-Agent header for API requests. |
| `proxyUrl` | `string` | `undefined` | Base URL of a proxy server to relay all API requests through (e.g. to bypass CORS in browsers). See [Proxy](#-proxy) below. |
| `maxRetries` | `number` | `3` | Number of times to automatically retry failed requests (e.g. on HTTP 500 or timeout). |
| `retryDelay` | `number` | `500` | Initial delay between retries in milliseconds (uses exponential backoff). |
| `concurrency` | `number` | `3` | Maximum number of concurrent network requests allowed at once. |
| `timeout` | `number` | `15000` | Request timeout in milliseconds. |
| `storage` | `StorageAdapter` | *auto-detected* | Session and data storage adapter. |
| `passkey` | `string` | `undefined` | Key used to transparently encrypt everything saved in your storage adapter using AES-GCM. |
| `offlineQueue` | `boolean` | `false` | Enable or disable the offline mutation queue. |
| `prefetch` | `PrefetchConfig` | `undefined` | Background prefetching scheduler. |
| `cache` | `CacheConfig` | `undefined` | Custom per-module cache duration overrides. |
| `cacheMaxEntries` | `number` | `undefined` | Limit the number of entries stored in the cache. |
| `on2faRequired` | `Function` | `undefined` | Global callback to handle 2FA challenges. |
| `onCredentialsRequired` | `Function` | `undefined` | Callback to supply credentials on token refresh failure. |
| `onError` | `ErrorMiddleware` | `undefined` | Custom error interception middleware. |

---

## 🛣️ Proxy

Linkdirecte has built-in proxy support. When `proxyUrl` is set, all API requests and file downloads are routed through that URL instead of hitting EcoleDirecte directly. This is essential when running in browsers, where CORS blocks direct calls to the EcoleDirecte API.

The recommended proxy is [**Procsy**](https://github.com/Scolup/Procsy) — a lightweight Cloudflare Workers proxy purpose-built for this use case. It handles CORS headers, IP spoofing, and SSRF protection out of the box.

### Setup

1. **Deploy Procsy** — follow the [Procsy README](https://github.com/Scolup/Procsy#deployment) to deploy it on Cloudflare Workers.

2. **Point Linkdirecte at your Procsy instance:**

```typescript
import { configure } from "linkdirecte";

configure({
  proxyUrl: "https://myprocsyinstance.hithisismyname.workers.dev",
});
```

That's it. Every outgoing request will now be relayed through Procsy.

### How it works under the hood

When `proxyUrl` is configured, Linkdirecte rewrites all outgoing request URLs to point at the proxy base. It also attaches an `X-Procsy-Base-URL` header containing the original EcoleDirecte API base URL, so the proxy knows where to forward the request.

> **Note**: When `proxyUrl` is **not** set (the default), Linkdirecte talks directly to `https://api.ecoledirecte.com/v3`. This works fine in server-side environments where CORS is not a concern.

---

## 🗄️ Storage Adapters (Auto-Detected!)

By default, Linkdirecte automatically detects and selects the best storage option for your environment:

1. **IndexedDB** — used in IndexedDB-capable runtimes (browsers, CF Workers, Deno).
2. **localStorage** — used in standard Web Storage runtimes (browsers, React Native).
3. **Node/Bun File Storage** — used in Node.js or Bun environments.
4. **Memory Storage** — falls back to volatile in-memory storage if nothing else is available.

You can explicitly force an adapter or supply a custom one.

### `indexedDBStorage`
Backed by IndexedDB under a database named `linkdirecte`. Perfect for standard web browsers.
```typescript
import { configure, indexedDBStorage } from "linkdirecte";
configure({ storage: indexedDBStorage });
```

### `localStorageStorage`
Backed by the browser's `localStorage` API. Excellent for simple React Native, Capacitor, or Chrome extension usage.
```typescript
import { configure, localStorageStorage } from "linkdirecte";
configure({ storage: localStorageStorage });
```

### `nodeStorage`
Saves your session to a local JSON file. Excellent for command-line tools or servers running in Node.js or Bun.
```typescript
import { configure, nodeStorage } from "linkdirecte";

// Saves to './linkdirecte-session.json' by default
configure({ storage: nodeStorage() });

// Or specify a custom path:
configure({ storage: nodeStorage("/var/data/session.json") });
```

### `cloudflareKVStorage`
Wraps a Cloudflare KV namespace.
```typescript
import { configure, cloudflareKVStorage } from "linkdirecte";

export default {
  async fetch(request, env) {
    configure({ storage: cloudflareKVStorage(env.MY_SESSION_KV) });
    // ...
  }
};
```

### `asyncStorage` (Custom Wrappers)
Allows you to wrap any asynchronous key-valeur storage engine. Here's how to wrap React Native's `@react-native-async-storage/async-storage`:
```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { configure, asyncStorage } from "linkdirecte";

configure({
  storage: asyncStorage({
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, valeur) => AsyncStorage.setItem(key, valeur),
    removeItem: (key) => AsyncStorage.removeItem(key),
  }),
});
```

---

## 🔒 Transparent AES-GCM Encryption

Concerned about storing credentials on disk or in the browser? Simply provide a `passkey`!

When a `passkey` is specified, Linkdirecte will **automatically wrap** your active storage adapter with an encrypted wrapper. All session tokens, IDs, and account info will be encrypted using robust **AES-GCM** before writing, and decrypted on read.

```typescript
import { configure, nodeStorage } from "linkdirecte";

configure({
  storage: nodeStorage(),
  passkey: "super-secret-user-defined-password" // Transparent encryption enabled!
});
```

---

## 📥 File Downloads

### `download`

Retrieves documents, invoices, or resources from EcoleDirecte.

```typescript
function download(url: string, options?: DownloadOptions): Promise<ArrayBuffer | Blob | ReadableStream>
```

#### Options (`DownloadOptions`)
- `as` *("buffer" | "blob" | "stream")*: The format to return. Defaults to `"buffer"`.
- `params` *(Record<string, any>)*: Extra post body parameters.

#### Example (Writing a downloaded PDF to disk in Node/Bun):
```typescript
import { download } from "linkdirecte";
import { writeFile } from "node:fs/promises";

const fileArrayBuffer = await download("https://api.ecoledirecte.com/v3/file-endpoint.awp");

await writeFile("./report-card.pdf", Buffer.from(fileArrayBuffer));
console.log("PDF written to disk!");
```

### `downloadPhoto`

Retrieves the profile picture of the currently active account.

```typescript
function downloadPhoto(options?: { as?: "buffer" | "blob" | "stream" }): Promise<ArrayBuffer | Blob | ReadableStream | null>
```

---

## 🛟 Offline Mutation Queue

When the network is spotty, you don't want actions like marking homework as completed to be lost. By enabling `offlineQueue: true` in your configuration, any modifying requests (like `markAsDone`) will be recorded locally if the user is offline.

You can synchronize them once the connection is restored:

```typescript
import { offlineQueue } from "linkdirecte";

// Check the queue
const pendingCount = offlineQueue.getQueue().length;
console.log(`You have ${pendingCount} offline actions pending.`);

// Flush the queue to send them to EcoleDirecte
await offlineQueue.flush();
```

---

## 🧠 Background Prefetching

Prefetching warms up the SDK cache by loading module data in the background, making your app respond instantly!

```typescript
import { configure, startAutoPrefetch } from "linkdirecte";

configure({
  prefetch: {
    enabled: true,
    interval: "15m", // Prefetch every 15 minutes (supports 's', 'm', 'h')
    modules: ["grades", "messages", "homework"]
  }
});

// Start background syncing!
startAutoPrefetch();
```

---

## 🗂️ Type Definitions

### `EdConfig`

Defines global parameters passed to `configure()`.

```typescript
interface EdConfig {
  userAgent?: string;
  proxyUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  concurrency?: number;
  timeout?: number;
  storage?: StorageAdapter;
  passkey?: string;
  offlineQueue?: boolean;
  prefetch?: PrefetchConfig;
  onError?: ErrorMiddleware;
  on2faRequired?: (
    question: string,
    choices: string[]
  ) => number | string | Promise<number | string>;
  onCredentialsRequired?: () =>
    | { identifiant: string; motdepasse: string }
    | Promise<{ identifiant: string; motdepasse: string }>;
  cache?: CacheConfig;
  cacheMaxEntries?: number;
}
```

### `PrefetchConfig`

Configures the background cache prefetching daemon.

```typescript
interface PrefetchConfig {
  enabled?: boolean;
  interval?: string | false; // e.g., "30s", "5m", "1h", or false to disable
  modules?: string[];
}
```

### `CacheConfig`

Per-module cache durations. You can configure how long items should stay cached.

```typescript
interface CacheConfig {
  grades?: string | false;
  timetable?: string | false;
  messages?: string | false;
  homework?: string | false;
  documents?: string | false;
  cloud?: string | false;
  attendance?: string | false;
  timeline?: string | false;
}
```

### `StorageAdapter`

The standard interface for defining custom data storage persistence.

```typescript
interface StorageAdapter {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, valeur: string): void | Promise<void>;
  delete(key: string): void | Promise<void>;
}
```

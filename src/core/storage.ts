import type { StorageAdapter } from '../types';
import { getWebCrypto } from './env';

const ALGORITHM = 'AES-GCM';
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;
const KDF_ITERATIONS = 100_000;

async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const webCrypto = await getWebCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return webCrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LEN * 8 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const webCrypto = await getWebCrypto();
  const encoder = new TextEncoder();
  const salt = webCrypto.getRandomValues(new Uint8Array(SALT_LEN));
  const key = await deriveKey(secret, salt);
  const iv = webCrypto.getRandomValues(new Uint8Array(IV_LEN));

  const encrypted = await webCrypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext),
  );

  // Format: salt(16) + iv(12) + ciphertext (auth tag is appended by Web Crypto)
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);

  return uint8ArrayToBase64(result);
}

async function decrypt(data: string, secret: string): Promise<string> {
  const webCrypto = await getWebCrypto();
  const buf = base64ToUint8Array(data);
  if (buf.length < SALT_LEN + IV_LEN) throw new Error('Invalid encrypted data');

  const salt = buf.subarray(0, SALT_LEN);
  const iv = buf.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const ciphertext = buf.subarray(SALT_LEN + IV_LEN);

  const key = await deriveKey(secret, salt);

  const decrypted = await webCrypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── IndexedDB types ──────────────────────────────────────────────
// ponytail: minimal IDB types — avoids adding DOM to tsconfig lib
interface IDBObjectStore {
  get(key: string): IDBRequest;
  put(value: unknown, key?: string): IDBRequest;
  delete(key: string): IDBRequest;
}
interface IDBTransaction {
  objectStore(name: string): IDBObjectStore;
}
interface IDBDatabase {
  objectStoreNames: { contains(name: string): boolean };
  createObjectStore(name: string): IDBObjectStore;
  transaction(storeNames: string | string[], mode: string): IDBTransaction;
}
interface IDBRequest {
  result: any;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

// ── Storage adapters ──────────────────────────────────────────────

/**
 * Volatile in-memory storage. All data is lost when the process terminates.
 * Works in every runtime.
 */
export const memoryStorage: StorageAdapter = (() => {
  const data = new Map<string, string>();
  return {
    get: (key) => data.get(key) || null,
    set: (key, value) => {
      data.set(key, value);
    },
    delete: (key) => {
      data.delete(key);
    },
  };
})();

/**
 * Persistent storage backed by the Web `localStorage` API.
 * Works in browsers, browser extensions, Electron, and React Native (Hermes).
 * Throws at method call time if `localStorage` is not available.
 */
export const localStorageStorage: StorageAdapter = (() => {
  function requireLocalStorage(): Storage {
    if (typeof globalThis.localStorage === 'undefined') {
      throw new Error(
        'localStorage is not available in this environment. ' +
          'Use `memoryStorage` or `asyncStorage` instead.',
      );
    }
    return globalThis.localStorage;
  }
  return {
    get: (key) => requireLocalStorage().getItem(key),
    set: (key, value) => requireLocalStorage().setItem(key, value),
    delete: (key) => requireLocalStorage().removeItem(key),
  };
})();

// ponytail: shared IDB constants — avoids magic strings across the adapter
const IDB_DB_NAME = 'linkdirecte';
const IDB_STORE_NAME = 'data';
const IDB_VERSION = 1;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const dbReq = (globalThis as any).indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    dbReq.onupgradeneeded = () => {
      const db: IDBDatabase = dbReq.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    dbReq.onsuccess = () => resolve(dbReq.result);
    dbReq.onerror = () => reject(dbReq.error);
  });
}

/**
 * Persistent storage backed by IndexedDB.
 * Uses a dedicated `linkdirecte` database with a single `data` object store.
 * Works in browsers, Cloudflare Workers, and Deno.
 * Falls back gracefully to no-op if IndexedDB is unavailable.
 */
export const indexedDBStorage: StorageAdapter = (() => {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function getDB(): Promise<IDBDatabase> {
    if (!dbPromise) dbPromise = openIDB();
    return dbPromise;
  }

  return {
    get: async (key) => {
      try {
        const db = await getDB();
        return new Promise<string | null>((resolve) => {
          const tx = db.transaction(IDB_STORE_NAME, 'readonly');
          const req = tx.objectStore(IDB_STORE_NAME).get(key);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
        });
      } catch {
        return null;
      }
    },
    set: async (key, value) => {
      try {
        const db = await getDB();
        return new Promise<void>((resolve) => {
          const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
          const req = tx.objectStore(IDB_STORE_NAME).put(value, key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch {
        // swallow — storage unavailable
      }
    },
    delete: async (key) => {
      try {
        const db = await getDB();
        return new Promise<void>((resolve) => {
          const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
          const req = tx.objectStore(IDB_STORE_NAME).delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch {
        // swallow — storage unavailable
      }
    },
  };
})();

/**
 * Persistent storage backed by a JSON file on disk (Node.js / Bun).
 * Uses dynamic `import('node:fs/promises')` so it's safe to import
 * in browser bundles — the import only fires when a method is called.
 *
 * @param filePath - Path to the JSON file. Defaults to `./linkdirecte-session.json`.
 *
 * @example
 * ```ts
 * import { configure, nodeStorage } from 'linkdirecte';
 *
 * configure({ storage: nodeStorage() });
 * // or with a custom path:
 * configure({ storage: nodeStorage('~/.linkdirecte/session.json') });
 * ```
 */
export function nodeStorage(
  filePath = './linkdirecte-session.json',
): StorageAdapter {
  async function readAll(): Promise<Record<string, string>> {
    const { readFile } = await import('node:fs/promises');
    try {
      return JSON.parse(await readFile(filePath, 'utf-8'));
    } catch {
      return {};
    }
  }

  async function writeAll(data: Record<string, string>): Promise<void> {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2));
  }

  return asyncStorage({
    getItem: async (k) => {
      const data = await readAll();
      return data[k] ?? null;
    },
    setItem: async (k, v) => {
      const data = await readAll();
      data[k] = v;
      await writeAll(data);
    },
    removeItem: async (k) => {
      const data = await readAll();
      delete data[k];
      await writeAll(data);
    },
  });
}

// ponytail: minimal CF Workers KV shape — matches the real binding API
interface CloudflareKVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Persistent storage backed by a Cloudflare Workers KV namespace.
 * Pass the KV binding from your worker's `env` object.
 *
 * @param namespace - A CF Workers KV namespace binding.
 *
 * @example
 * ```ts
 * import { configure, cloudflareKVStorage } from 'linkdirecte';
 *
 * export default {
 *   async fetch(request: Request, env: { SESSION_KV: KVNamespace }) {
 *     configure({ storage: cloudflareKVStorage(env.SESSION_KV) });
 *     // ...
 *   },
 * };
 * ```
 */
export function cloudflareKVStorage(
  namespace: CloudflareKVNamespace,
): StorageAdapter {
  return asyncStorage({
    getItem: (k) => namespace.get(k),
    setItem: (k, v) => namespace.put(k, v),
    removeItem: (k) => namespace.delete(k),
  });
}

/**
 * Wraps any async key-value store into a `StorageAdapter`.
 * Works in every runtime.
 *
 * @example React Native with AsyncStorage
 * ```ts
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * import { configure, asyncStorage } from 'linkdirecte';
 *
 * configure({
 *   storage: asyncStorage({
 *     getItem: (k) => AsyncStorage.getItem(k),
 *     setItem: (k, v) => AsyncStorage.setItem(k, v),
 *     removeItem: (k) => AsyncStorage.removeItem(k),
 *   }),
 * });
 * ```
 */
export function asyncStorage(backend: {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}): StorageAdapter {
  return {
    get: (key) => backend.getItem(key),
    set: (key, value) => backend.setItem(key, value),
    delete: (key) => backend.removeItem(key),
  };
}

/**
 * Wraps any storage adapter to transparently encrypt and decrypt its values
 * using a user-provided passkey/secret (AES-GCM encryption).
 */
export function encryptedStorage(
  backend: StorageAdapter,
  secret: string,
): StorageAdapter {
  const adapter: StorageAdapter = {
    get: async (key) => {
      const val = await backend.get(key);
      if (!val) return null;
      try {
        return await decrypt(val, secret);
      } catch {
        return null;
      }
    },
    set: async (key, value) => {
      const encrypted = await encrypt(value, secret);
      await backend.set(key, encrypted);
    },
    delete: async (key) => {
      await backend.delete(key);
    },
  };

  Object.defineProperties(adapter, {
    __encryptedWithSecret: { value: secret, writable: true },
    __rawStorage: { value: backend, writable: true },
  });

  return adapter;
}

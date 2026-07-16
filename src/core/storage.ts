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
export const persistentStorage: StorageAdapter = (() => {
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
 *
 * @example Node.js with fs
 * ```ts
 * import { readFile, writeFile, mkdir } from 'node:fs/promises';
 * import { dirname } from 'node:path';
 * import { configure, asyncStorage } from 'linkdirecte';
 *
 * const path = './session.json';
 * configure({
 *   storage: asyncStorage({
 *     getItem: async (k) => {
 *       try { return (await readFile(path, 'utf-8')).then(JSON.parse)[k] ?? null; }
 *       catch { return null; }
 *     },
 *     setItem: async (k, v) => { },
 *     removeItem: async (k) => { },
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
 * @deprecated Renamed to `persistentStorage`. Will be removed in a future version.
 */
export const fileStorage = persistentStorage;

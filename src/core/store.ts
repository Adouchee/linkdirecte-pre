import { EdConfig, StorageAdapter, Account } from '../types';
import {
  indexedDBStorage,
  localStorageStorage,
  nodeStorage,
  memoryStorage,
  encryptedStorage,
} from './storage';

export const DEFAULT_USER_AGENT =
  'Linkdirecte/1.0 (iPhone; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 EDMOBILE v7.14.3';

export interface EdState {
  config: EdConfig;
  token?: string;
  twofaToken?: string;
  account?: Account;
  lastTokenRefresh?: Date;
  rawStorage?: StorageAdapter;
  hasDetectedStorage?: boolean;
}

const state: EdState = {
  config: {
    maxRetries: 3,
    retryDelay: 500,
    concurrency: 3,
    timeout: 15000,
    offlineQueue: false,
    userAgent: DEFAULT_USER_AGENT,
  },
};

export function getConfig(): EdConfig {
  if (!state.config.storage && !state.hasDetectedStorage) {
    setConfig({});
  }
  return state.config;
}

// ponytail: smart auto-detection of storage & transparent passkey wrapping
export function setConfig(config: Partial<EdConfig>): void {
  if ('storage' in config) {
    state.rawStorage = config.storage;
    state.hasDetectedStorage = config.storage !== undefined;
  } else if (
    !state.hasDetectedStorage &&
    !state.rawStorage &&
    !state.config.storage
  ) {
    state.hasDetectedStorage = true;
    if (typeof (globalThis as any).indexedDB !== 'undefined') {
      state.rawStorage = indexedDBStorage;
    } else if (typeof (globalThis as any).localStorage !== 'undefined') {
      state.rawStorage = localStorageStorage;
    } else if (
      typeof globalThis.process !== 'undefined' &&
      globalThis.process.versions != null &&
      (globalThis.process.versions.node != null ||
        globalThis.process.versions.bun != null)
    ) {
      state.rawStorage = nodeStorage();
    } else {
      state.rawStorage = memoryStorage;
    }
  }

  state.config = { ...state.config, ...config };

  const passkey = state.config.passkey;
  const baseStorage = state.rawStorage;
  if (baseStorage) {
    if (passkey) {
      state.config.storage = encryptedStorage(baseStorage, passkey);
    } else {
      state.config.storage = baseStorage;
    }
  } else {
    state.config.storage = undefined;
  }
}

export function getToken(): string | undefined {
  return state.token;
}

export function setToken(token: string): void {
  state.token = token;
  state.lastTokenRefresh = new Date();
}

export function getTwofaToken(): string | undefined {
  return state.twofaToken;
}

export function setTwofaToken(token: string): void {
  state.twofaToken = token;
}

export function getLastTokenRefresh(): Date | undefined {
  return state.lastTokenRefresh;
}

export function getAccount(): Account | undefined {
  return state.account;
}

export function setAccount(account: Account): void {
  state.account = account;
}

const STORAGE_KEYS = {
  token: 'ed_tk',
  twofaToken: 'ed_tft',
  account: 'ed_acc',
  lastRefresh: 'ed_lr',
} as const;

export async function persistSession(): Promise<void> {
  const storage = getConfig().storage;
  if (!storage) return;

  if (state.token) await storage.set(STORAGE_KEYS.token, state.token);
  if (state.twofaToken)
    await storage.set(STORAGE_KEYS.twofaToken, state.twofaToken);
  if (state.account)
    await storage.set(STORAGE_KEYS.account, JSON.stringify(state.account));
  if (state.lastTokenRefresh)
    await storage.set(
      STORAGE_KEYS.lastRefresh,
      state.lastTokenRefresh.toISOString(),
    );
}

export async function clearSession(): Promise<void> {
  state.token = undefined;
  state.twofaToken = undefined;
  state.account = undefined;
  state.lastTokenRefresh = undefined;

  const storage = getConfig().storage;
  if (!storage) return;

  await Promise.all([
    storage.delete(STORAGE_KEYS.token),
    storage.delete(STORAGE_KEYS.twofaToken),
    storage.delete(STORAGE_KEYS.account),
    storage.delete(STORAGE_KEYS.lastRefresh),
  ]);
}

export async function loadSession(): Promise<boolean> {
  const storage = getConfig().storage;
  if (!storage) return false;

  try {
    const [token, twofaToken, accountStr, lastRefreshStr] = await Promise.all([
      storage.get(STORAGE_KEYS.token),
      storage.get(STORAGE_KEYS.twofaToken),
      storage.get(STORAGE_KEYS.account),
      storage.get(STORAGE_KEYS.lastRefresh),
    ]);

    let loaded = false;
    if (token) {
      state.token = token;
      loaded = true;
    }
    if (twofaToken) state.twofaToken = twofaToken;
    if (accountStr) {
      try {
        state.account = JSON.parse(accountStr);
        loaded = true;
      } catch {}
    }
    if (lastRefreshStr) {
      const parsed = new Date(lastRefreshStr);
      if (!isNaN(parsed.getTime())) {
        state.lastTokenRefresh = parsed;
      }
    }

    if (loaded) {
      const { startTokenKeepalive } = await import('./health');
      startTokenKeepalive();
    }

    return loaded;
  } catch {
    return false;
  }
}

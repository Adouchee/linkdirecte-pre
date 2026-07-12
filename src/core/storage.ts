import { StorageAdapter } from '../types';
import {
  pbkdf2Sync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;
const TAG_LEN = 16;
const KDF_ITERATIONS = 100_000;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return pbkdf2Sync(secret, salt, KDF_ITERATIONS, KEY_LEN, 'sha256');
}

function encrypt(plaintext: string, secret: string): string {
  const salt = randomBytes(SALT_LEN);
  const key = deriveKey(secret, salt);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: salt(16) + iv(12) + tag(16) + ciphertext
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

function decrypt(data: string, secret: string): string {
  const buf = Buffer.from(data, 'base64');
  if (buf.length < SALT_LEN + IV_LEN + TAG_LEN)
    throw new Error('Invalid encrypted data');
  const salt = buf.subarray(0, SALT_LEN);
  const iv = buf.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = buf.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
  const encrypted = buf.subarray(SALT_LEN + IV_LEN + TAG_LEN);
  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

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

export const fileStorage = (
  filePath: string,
  secret?: string,
): StorageAdapter => {
  const INTERNAL_KEY = secret || process.env.ED_STORAGE_SECRET;

  if (!INTERNAL_KEY) {
    throw new Error(
      'fileStorage requires an encryption secret. ' +
        'Pass a `secret` parameter or set the ED_STORAGE_SECRET environment variable.',
    );
  }

  const read = async () => {
    const { default: fs } = await import('node:fs/promises');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(decrypt(content, INTERNAL_KEY));
    } catch {
      return {};
    }
  };

  const write = async (data: any) => {
    const { default: fs } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    const content = JSON.stringify(data);
    const encrypted = encrypt(content, INTERNAL_KEY);
    const dir = dirname(filePath);
    if (dir) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(filePath, encrypted, 'utf-8');
  };

  let cache: Record<string, string> | null = null;

  const load = async (): Promise<Record<string, string>> => {
    if (cache) return cache;
    const loaded = await read();
    cache = loaded;
    return loaded;
  };

  return {
    get: async (key) => {
      const data = await load();
      return data[key] || null;
    },
    set: async (key, value) => {
      const data = await load();
      data[key] = value;
      await write(data);
    },
    delete: async (key) => {
      const data = await load();
      delete data[key];
      await write(data);
    },
  };
};

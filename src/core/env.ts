/**
 * Portable runtime helpers that work across Node.js, Bun, Deno, browsers,
 * Cloudflare Workers, Vercel Edge, React Native (Hermes), and more.
 */

// ── Crypto ──────────────────────────────────────────────────────────

/**
 * Safe access to the Web Crypto API across all runtimes.
 * Falls back to `msrcrypto` (dynamic import) when native `crypto.subtle`
 * is unavailable (e.g. React Native / Hermes).
 */
let _polyfill: Crypto | null = null;

export async function getWebCrypto(): Promise<Crypto> {
  if (globalThis.crypto?.subtle) return globalThis.crypto;
  if (_polyfill) return _polyfill;
  // ponytail: dynamic import — only loaded when native Web Crypto is absent
  const mod = await import('msrcrypto');
  _polyfill = (mod.default ?? mod) as Crypto;
  return _polyfill;
}

/**
 * Portable `crypto.randomUUID()`.
 * Falls back to a lightweight UUID v4 generator for environments
 * that lack native support (e.g. older React Native / Hermes).
 */
export function randomUUID(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (c?.randomUUID) return c.randomUUID();
  // ponytail: minimal uuid v4 — good enough for unique IDs
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── AbortSignal.timeout ─────────────────────────────────────────────

/**
 * Portable `AbortSignal.timeout(ms)`.
 * Falls back to AbortController + setTimeout for runtimes that lack
 * native support (React Native Hermes, some edge runtimes).
 */
export function signalWithTimeout(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  // ponytail: polyfill via AbortController + setTimeout
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// ── Timers ──────────────────────────────────────────────────────────

/**
 * Safe `setInterval` that silently no-ops in environments
 * where timers are not available (e.g. Cloudflare Workers,
 * Vercel Edge Runtime, short-lived edge functions).
 *
 * Returns a handle that can be passed to `safeClearInterval`.
 */
export function safeSetInterval(
  fn: () => void | Promise<void>,
  ms: number,
): ReturnType<typeof setInterval> | undefined {
  try {
    return setInterval(fn, ms);
  } catch {
    // ponytail: timers unavailable — feature is disabled, not broken
    return undefined;
  }
}

/**
 * Safe `clearInterval` that tolerates `undefined` handles.
 */
export function safeClearInterval(
  handle: ReturnType<typeof setInterval> | undefined,
): void {
  if (handle != null) {
    try {
      clearInterval(handle);
    } catch {
      // swallow – environment may not support clearInterval
    }
  }
}

// ── FormData ────────────────────────────────────────────────────────

/**
 * Safe `instanceof FormData` check that doesn't throw
 * ReferenceError in environments where FormData is not defined.
 */
export function isFormData(value: unknown): value is FormData {
  try {
    return typeof FormData !== 'undefined' && value instanceof FormData;
  } catch {
    return false;
  }
}

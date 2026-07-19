// © 2026 typeof (Scolup) | Licensed under AGPL 3.
export class EdError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public raw?: unknown,
  ) {
    const codePrefix = code ? `[${code}] ` : '';
    const statusSuffix = statusCode ? ` (HTTP ${statusCode})` : '';
    super(`${codePrefix}${message}${statusSuffix}`);
    this.name = 'EdError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EdAuthError extends EdError {
  name = 'EdAuthError';
}

export class EdNetworkError extends EdError {
  name = 'EdNetworkError';
}

export class EdRateLimitError extends EdError {
  name = 'EdRateLimitError';
}

export class EdApiError extends EdError {
  name = 'EdApiError';
}

export class EdTransformError extends EdError {
  name = 'EdTransformError';
}
// © 2026 typeof (Scolup) | Licensed under AGPL 3.

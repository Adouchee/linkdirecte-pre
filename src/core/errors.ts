export class EdError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public raw?: unknown,
  ) {
    super(message);
    this.name = 'EdError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EdAuthError extends EdError {
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    raw?: unknown,
  ) {
    super(message, code, statusCode, raw);
    this.name = 'EdAuthError';
    const codePrefix = code ? `[${code}] ` : '';
    const statusSuffix = statusCode ? ` (HTTP ${statusCode})` : '';
    this.message = `${codePrefix}${message}${statusSuffix}`;
  }
}

export class EdNetworkError extends EdError {
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    raw?: unknown,
  ) {
    super(message, code, statusCode, raw);
    this.name = 'EdNetworkError';
    const codePrefix = code ? `[${code}] ` : '';
    const statusSuffix = statusCode ? ` (HTTP ${statusCode})` : '';
    this.message = `${codePrefix}${message}${statusSuffix}`;
  }
}

export class EdRateLimitError extends EdError {
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    raw?: unknown,
  ) {
    super(message, code, statusCode, raw);
    this.name = 'EdRateLimitError';
    const codePrefix = code ? `[${code}] ` : '';
    const statusSuffix = statusCode ? ` (HTTP ${statusCode})` : '';
    this.message = `${codePrefix}${message}${statusSuffix}`;
  }
}

export class EdApiError extends EdError {
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    raw?: unknown,
  ) {
    super(message, code, statusCode, raw);
    this.name = 'EdApiError';
    const codePrefix = code ? `[${code}] ` : '';
    const statusSuffix = statusCode ? ` (HTTP ${statusCode})` : '';
    this.message = `${codePrefix}${message}${statusSuffix}`;
  }
}

export class EdTransformError extends EdError {
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    raw?: unknown,
  ) {
    super(message, code, statusCode, raw);
    this.name = 'EdTransformError';
    const codePrefix = code ? `[${code}] ` : '';
    const statusSuffix = statusCode ? ` (HTTP ${statusCode})` : '';
    this.message = `${codePrefix}${message}${statusSuffix}`;
  }
}

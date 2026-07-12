export class EdError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public raw?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EdAuthError extends EdError {}
export class EdNetworkError extends EdError {}
export class EdRateLimitError extends EdError {}
export class EdApiError extends EdError {}
export class EdTransformError extends EdError {}

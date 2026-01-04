/**
 * Base error class for Changelogs SDK errors
 */
export class ChangelogsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChangelogsError';
    Object.setPrototypeOf(this, ChangelogsError.prototype);
  }
}

/**
 * Error thrown when API authentication fails
 */
export class AuthenticationError extends ChangelogsError {
  constructor(message = 'Invalid API key') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when the API request fails
 */
export class ApiError extends ChangelogsError {
  public readonly statusCode: number;
  public readonly response?: unknown;

  constructor(message: string, statusCode: number, response?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error thrown when a changelog is not found
 */
export class NotFoundError extends ChangelogsError {
  public readonly version: string;

  constructor(version: string, message?: string) {
    super(message ?? `Changelog not found for version: ${version}`);
    this.name = 'NotFoundError';
    this.version = version;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends ChangelogsError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when a request times out
 */
export class TimeoutError extends ChangelogsError {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}







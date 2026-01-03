/**
 * Base error class for Kitbase SDK errors
 */
export class KitbaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KitbaseError';
    Object.setPrototypeOf(this, KitbaseError.prototype);
  }
}

/**
 * Error thrown when API authentication fails
 */
export class AuthenticationError extends KitbaseError {
  constructor(message = 'Invalid API key') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when the API request fails
 */
export class ApiError extends KitbaseError {
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
 * Error thrown when request validation fails
 */
export class ValidationError extends KitbaseError {
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
export class TimeoutError extends KitbaseError {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}





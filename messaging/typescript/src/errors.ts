/**
 * Base error class for Messaging SDK errors
 */
export class MessagingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessagingError';
    Object.setPrototypeOf(this, MessagingError.prototype);
  }
}

/**
 * Error thrown when API authentication fails
 */
export class AuthenticationError extends MessagingError {
  constructor(message = 'Invalid API key') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when the API request fails
 */
export class ApiError extends MessagingError {
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
export class ValidationError extends MessagingError {
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
export class TimeoutError extends MessagingError {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

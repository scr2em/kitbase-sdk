/**
 * Base error class for Kitbase Flags SDK errors
 */
export class FlagsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlagsError';
    Object.setPrototypeOf(this, FlagsError.prototype);
  }
}

/**
 * Error thrown when API authentication fails
 */
export class AuthenticationError extends FlagsError {
  constructor(message = 'Invalid API key') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when the API request fails
 */
export class ApiError extends FlagsError {
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
export class ValidationError extends FlagsError {
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
export class TimeoutError extends FlagsError {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when a feature flag is not found
 * OpenFeature error code: FLAG_NOT_FOUND
 */
export class FlagNotFoundError extends FlagsError {
  public readonly flagKey: string;

  constructor(flagKey: string) {
    super(`Flag '${flagKey}' not found`);
    this.name = 'FlagNotFoundError';
    this.flagKey = flagKey;
    Object.setPrototypeOf(this, FlagNotFoundError.prototype);
  }
}

/**
 * Error thrown when the requested type doesn't match the flag's value type
 * OpenFeature error code: TYPE_MISMATCH
 */
export class TypeMismatchError extends FlagsError {
  public readonly flagKey: string;
  public readonly expectedType: string;
  public readonly actualType: string;

  constructor(flagKey: string, expectedType: string, actualType: string) {
    super(
      `Type mismatch for flag '${flagKey}': expected ${expectedType}, got ${actualType}`,
    );
    this.name = 'TypeMismatchError';
    this.flagKey = flagKey;
    this.expectedType = expectedType;
    this.actualType = actualType;
    Object.setPrototypeOf(this, TypeMismatchError.prototype);
  }
}

/**
 * Error thrown when evaluation context is invalid
 * OpenFeature error code: INVALID_CONTEXT
 */
export class InvalidContextError extends FlagsError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidContextError';
    Object.setPrototypeOf(this, InvalidContextError.prototype);
  }
}

/**
 * Error thrown when parsing flag configuration fails
 * OpenFeature error code: PARSE_ERROR
 */
export class ParseError extends FlagsError {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Base error class for Kitbase Ionic CLI errors
 */
export class KitbaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KitbaseError';
  }
}

/**
 * Error thrown when API authentication fails
 */
export class AuthenticationError extends KitbaseError {
  constructor(message = 'Invalid API key. Please check your KITBASE_API_KEY environment variable.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when API request fails
 */
export class ApiError extends KitbaseError {
  public readonly statusCode: number;
  public readonly response?: unknown;

  constructor(message: string, statusCode: number, response?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends KitbaseError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Error thrown when build process fails
 */
export class BuildError extends KitbaseError {
  public readonly exitCode?: number;

  constructor(message: string, exitCode?: number) {
    super(message);
    this.name = 'BuildError';
    this.exitCode = exitCode;
  }
}

/**
 * Error thrown when git operations fail
 */
export class GitError extends KitbaseError {
  constructor(message: string) {
    super(message);
    this.name = 'GitError';
  }
}

/**
 * Error thrown when required configuration is missing
 */
export class ConfigurationError extends KitbaseError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}








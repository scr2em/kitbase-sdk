export class KitbaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KitbaseError';
  }
}

export class AuthenticationError extends KitbaseError {
  constructor(message = 'API key was rejected by the server.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

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

export class ValidationError extends KitbaseError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class BuildError extends KitbaseError {
  public readonly exitCode?: number;

  constructor(message: string, exitCode?: number) {
    super(message);
    this.name = 'BuildError';
    this.exitCode = exitCode;
  }
}

export class GitError extends KitbaseError {
  constructor(message: string) {
    super(message);
    this.name = 'GitError';
  }
}

export class ConfigurationError extends KitbaseError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

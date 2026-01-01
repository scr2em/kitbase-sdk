/// Base exception for Changelogs SDK errors.
class ChangelogsException implements Exception {
  final String message;

  const ChangelogsException(this.message);

  @override
  String toString() => 'ChangelogsException: $message';
}

/// Exception thrown when API authentication fails.
class AuthenticationException extends ChangelogsException {
  const AuthenticationException([String message = 'Invalid API key'])
      : super(message);

  @override
  String toString() => 'AuthenticationException: $message';
}

/// Exception thrown when the API request fails.
class ApiException extends ChangelogsException {
  final int statusCode;
  final dynamic response;

  const ApiException(
    super.message, {
    required this.statusCode,
    this.response,
  });

  @override
  String toString() => 'ApiException ($statusCode): $message';
}

/// Exception thrown when a changelog is not found.
class NotFoundException extends ChangelogsException {
  final String version;

  NotFoundException(this.version, [String? message])
      : super(message ?? 'Changelog not found for version: $version');

  @override
  String toString() => 'NotFoundException: $message';
}

/// Exception thrown when request validation fails.
class ValidationException extends ChangelogsException {
  final String? field;

  const ValidationException(super.message, {this.field});

  @override
  String toString() =>
      'ValidationException${field != null ? ' ($field)' : ''}: $message';
}

/// Exception thrown when a request times out.
class TimeoutException extends ChangelogsException {
  const TimeoutException([String message = 'Request timed out'])
      : super(message);

  @override
  String toString() => 'TimeoutException: $message';
}


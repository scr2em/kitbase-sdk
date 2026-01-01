/// Base exception for Kitbase SDK errors.
class KitbaseException implements Exception {
  final String message;

  const KitbaseException(this.message);

  @override
  String toString() => 'KitbaseException: $message';
}

/// Exception thrown when API authentication fails.
class AuthenticationException extends KitbaseException {
  const AuthenticationException([String message = 'Invalid API key'])
      : super(message);

  @override
  String toString() => 'AuthenticationException: $message';
}

/// Exception thrown when the API request fails.
class ApiException extends KitbaseException {
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

/// Exception thrown when request validation fails.
class ValidationException extends KitbaseException {
  final String? field;

  const ValidationException(super.message, {this.field});

  @override
  String toString() =>
      'ValidationException${field != null ? ' ($field)' : ''}: $message';
}

/// Exception thrown when a request times out.
class TimeoutException extends KitbaseException {
  const TimeoutException([String message = 'Request timed out']) : super(message);

  @override
  String toString() => 'TimeoutException: $message';
}


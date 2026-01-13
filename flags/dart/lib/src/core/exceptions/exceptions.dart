/// Base exception for Kitbase SDK network errors.
class KitbaseException implements Exception {
  final String message;

  const KitbaseException(this.message);

  @override
  String toString() => 'KitbaseException: $message';
}

/// Exception thrown when API authentication fails.
class KitbaseAuthenticationException extends KitbaseException {
  const KitbaseAuthenticationException([super.message = 'Invalid API key']);

  @override
  String toString() => 'KitbaseAuthenticationException: $message';
}

/// Exception thrown when the API request fails.
class KitbaseApiException extends KitbaseException {
  final int statusCode;
  final dynamic response;

  const KitbaseApiException(
    super.message, {
    required this.statusCode,
    this.response,
  });

  @override
  String toString() => 'KitbaseApiException ($statusCode): $message';
}

/// Exception thrown when request validation fails.
class KitbaseValidationException extends KitbaseException {
  final String? field;

  const KitbaseValidationException(super.message, {this.field});

  @override
  String toString() =>
      'KitbaseValidationException${field != null ? ' ($field)' : ''}: $message';
}

/// Exception thrown when a request times out.
class KitbaseTimeoutException extends KitbaseException {
  const KitbaseTimeoutException([super.message = 'Request timed out']);

  @override
  String toString() => 'KitbaseTimeoutException: $message';
}

/// Exception thrown when there is a connection error.
class KitbaseConnectionException extends KitbaseException {
  const KitbaseConnectionException([super.message = 'Connection error']);

  @override
  String toString() => 'KitbaseConnectionException: $message';
}

/// Exception thrown when a feature is not configured.
class KitbaseNotConfiguredException extends KitbaseException {
  final String feature;

  const KitbaseNotConfiguredException({
    required this.feature,
    required String message,
  }) : super(message);

  @override
  String toString() => 'KitbaseNotConfiguredException ($feature): $message';
}

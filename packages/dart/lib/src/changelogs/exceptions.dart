/// Base exception for KitbaseChangelogs SDK errors.
class KitbaseChangelogsException implements Exception {
  final String message;

  const KitbaseChangelogsException(this.message);

  @override
  String toString() => 'KitbaseChangelogsException: $message';
}

/// Exception thrown when API authentication fails.
class ChangelogsAuthenticationException extends KitbaseChangelogsException {
  const ChangelogsAuthenticationException([String message = 'Invalid API key'])
      : super(message);

  @override
  String toString() => 'ChangelogsAuthenticationException: $message';
}

/// Exception thrown when the API request fails.
class ChangelogsApiException extends KitbaseChangelogsException {
  final int statusCode;
  final dynamic response;

  const ChangelogsApiException(
    super.message, {
    required this.statusCode,
    this.response,
  });

  @override
  String toString() => 'ChangelogsApiException ($statusCode): $message';
}

/// Exception thrown when a changelog is not found.
class ChangelogsNotFoundException extends KitbaseChangelogsException {
  final String version;

  ChangelogsNotFoundException(this.version, [String? message])
      : super(message ?? 'Changelog not found for version: $version');

  @override
  String toString() => 'ChangelogsNotFoundException: $message';
}

/// Exception thrown when request validation fails.
class ChangelogsValidationException extends KitbaseChangelogsException {
  final String? field;

  const ChangelogsValidationException(super.message, {this.field});

  @override
  String toString() =>
      'ChangelogsValidationException${field != null ? ' ($field)' : ''}: $message';
}

/// Exception thrown when a request times out.
class ChangelogsTimeoutException extends KitbaseChangelogsException {
  const ChangelogsTimeoutException([String message = 'Request timed out'])
      : super(message);

  @override
  String toString() => 'ChangelogsTimeoutException: $message';
}








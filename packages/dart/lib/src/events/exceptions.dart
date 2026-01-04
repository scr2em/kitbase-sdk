/// Base exception for KitbaseEvents SDK errors.
class KitbaseEventsException implements Exception {
  final String message;

  const KitbaseEventsException(this.message);

  @override
  String toString() => 'KitbaseEventsException: $message';
}

/// Exception thrown when API authentication fails.
class EventsAuthenticationException extends KitbaseEventsException {
  const EventsAuthenticationException([String message = 'Invalid API key'])
      : super(message);

  @override
  String toString() => 'EventsAuthenticationException: $message';
}

/// Exception thrown when the API request fails.
class EventsApiException extends KitbaseEventsException {
  final int statusCode;
  final dynamic response;

  const EventsApiException(
    super.message, {
    required this.statusCode,
    this.response,
  });

  @override
  String toString() => 'EventsApiException ($statusCode): $message';
}

/// Exception thrown when request validation fails.
class EventsValidationException extends KitbaseEventsException {
  final String? field;

  const EventsValidationException(super.message, {this.field});

  @override
  String toString() =>
      'EventsValidationException${field != null ? ' ($field)' : ''}: $message';
}

/// Exception thrown when a request times out.
class EventsTimeoutException extends KitbaseEventsException {
  const EventsTimeoutException([String message = 'Request timed out'])
      : super(message);

  @override
  String toString() => 'EventsTimeoutException: $message';
}







/// Base exception for KitbaseFlags SDK errors.
class KitbaseFlagsException implements Exception {
  final String message;

  const KitbaseFlagsException(this.message);

  @override
  String toString() => 'KitbaseFlagsException: $message';
}

/// Exception thrown when API authentication fails.
class FlagsAuthenticationException extends KitbaseFlagsException {
  const FlagsAuthenticationException([String message = 'Invalid API key'])
      : super(message);

  @override
  String toString() => 'FlagsAuthenticationException: $message';
}

/// Exception thrown when the API request fails.
class FlagsApiException extends KitbaseFlagsException {
  final int statusCode;
  final dynamic response;

  const FlagsApiException(
    super.message, {
    required this.statusCode,
    this.response,
  });

  @override
  String toString() => 'FlagsApiException ($statusCode): $message';
}

/// Exception thrown when request validation fails.
class FlagsValidationException extends KitbaseFlagsException {
  final String? field;

  const FlagsValidationException(super.message, {this.field});

  @override
  String toString() =>
      'FlagsValidationException${field != null ? ' ($field)' : ''}: $message';
}

/// Exception thrown when a request times out.
class FlagsTimeoutException extends KitbaseFlagsException {
  const FlagsTimeoutException([String message = 'Request timed out'])
      : super(message);

  @override
  String toString() => 'FlagsTimeoutException: $message';
}

/// Exception thrown when a feature flag is not found.
/// OpenFeature error code: FLAG_NOT_FOUND
class FlagNotFoundException extends KitbaseFlagsException {
  final String flagKey;

  FlagNotFoundException(this.flagKey) : super("Flag '$flagKey' not found");

  @override
  String toString() => 'FlagNotFoundException: $message';
}

/// Exception thrown when the requested type doesn't match the flag's value type.
/// OpenFeature error code: TYPE_MISMATCH
class TypeMismatchException extends KitbaseFlagsException {
  final String flagKey;
  final String expectedType;
  final String actualType;

  TypeMismatchException(this.flagKey, this.expectedType, this.actualType)
      : super(
            "Type mismatch for flag '$flagKey': expected $expectedType, got $actualType");

  @override
  String toString() => 'TypeMismatchException: $message';
}

/// Exception thrown when evaluation context is invalid.
/// OpenFeature error code: INVALID_CONTEXT
class InvalidContextException extends KitbaseFlagsException {
  const InvalidContextException(super.message);

  @override
  String toString() => 'InvalidContextException: $message';
}

/// Exception thrown when parsing flag configuration fails.
/// OpenFeature error code: PARSE_ERROR
class ParseException extends KitbaseFlagsException {
  const ParseException(super.message);

  @override
  String toString() => 'ParseException: $message';
}


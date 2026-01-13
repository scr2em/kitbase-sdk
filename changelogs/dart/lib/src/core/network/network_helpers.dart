import 'kitbase_http_response.dart';

/// HTTP status code helpers and constants.
abstract class StatusCodes {
  static const int ok = 200;
  static const int created = 201;
  static const int noContent = 204;
  static const int badRequest = 400;
  static const int unauthorized = 401;
  static const int forbidden = 403;
  static const int notFound = 404;
  static const int internalServerError = 500;

  /// Returns true if the status code indicates success (2xx).
  static bool isSuccess(int? statusCode) =>
      statusCode != null && statusCode >= 200 && statusCode < 300;

  /// Returns true if the status code indicates unauthorized (401).
  static bool isUnauthorized(int? statusCode) => statusCode == unauthorized;

  /// Returns true if the status code indicates forbidden (403).
  static bool isForbidden(int? statusCode) => statusCode == forbidden;

  /// Returns true if the status code indicates not found (404).
  static bool isNotFound(int? statusCode) => statusCode == notFound;
}

/// Default messages for network errors.
abstract class NetworkErrorMessages {
  static const String unknownError = 'An unknown error occurred';
  static const String connectionError = 'Connection error';
  static const String timeoutError = 'Request timed out';
  static const String authenticationError = 'Invalid API key';
}

/// Utility for extracting error messages from API responses.
abstract class ResponseErrorExtractor {
  /// Extracts an error message from the response data.
  /// Returns [NetworkErrorMessages.unknownError] if no message can be extracted.
  static String extractMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data.containsKey('message')) {
        return data['message']?.toString() ?? NetworkErrorMessages.unknownError;
      }
      if (data.containsKey('error')) {
        return data['error']?.toString() ?? NetworkErrorMessages.unknownError;
      }
    }
    return NetworkErrorMessages.unknownError;
  }

  /// Extracts an error message from a [KitbaseHttpResponse].
  static String extractFromResponse(KitbaseHttpResponse response) {
    return extractMessage(response.data);
  }
}

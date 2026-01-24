/// Generic HTTP response wrapper for Kitbase SDK.
class KitbaseHttpResponse<T> {
  /// The response data.
  final T? data;

  /// HTTP status code.
  final int? statusCode;

  /// Whether there was a connection error.
  final bool isConnectionError;

  const KitbaseHttpResponse({
    this.data,
    this.statusCode,
    this.isConnectionError = false,
  });

  /// Whether the response indicates an error.
  bool get isError => !isSuccess;

  /// Whether the response indicates success (2xx).
  bool get isSuccess =>
      statusCode != null && statusCode! >= 200 && statusCode! < 300;

  /// Helper to get error message from data if available
  String? get errorMessage {
    if (data is Map<String, dynamic>) {
      final map = data as Map<String, dynamic>;
      final msg = map['message'] ?? map['error'];
      if (msg != null) return msg.toString();
      return 'Unknown error';
    }
    return data?.toString();
  }
}

/// Headers configuration for HTTP requests.
class KitbaseHttpRequestHeaders {
  /// Whether to add the Authorization header.
  final bool addAuthorizationHeader;

  /// Custom headers to add to the request.
  final Map<String, String>? customHeaders;

  const KitbaseHttpRequestHeaders({
    this.addAuthorizationHeader = true,
    this.customHeaders,
  });
}

import 'dart:async';

import 'package:http/http.dart' as http;

/// Basic utility for detecting network connectivity errors across platforms.

abstract class NetworkErrorDetector {
  /// Returns true if the error indicates a connection/network issue.
  static bool isConnectionError(Object error) {
    if (error is http.ClientException) {
      return _isClientExceptionConnectionError(error);
    }

    if (error is TimeoutException) {
      return true;
    }

    return _isConnectionErrorByString(error.toString());
  }

  static bool _isClientExceptionConnectionError(http.ClientException error) {
    final msg = error.message.toLowerCase();

    const connectionIndicators = [
      // Web: XMLHttpRequest errors
      'xmlhttprequest',
      // Mobile: DNS failures
      'failed host lookup',
      // Mobile: Connection refused
      'connection refused',
      // Network unreachable
      'network unreachable',
      // Connection closed
      'connection closed',
      // Connection reset
      'connection reset',
    ];

    return connectionIndicators.any((indicator) => msg.contains(indicator));
  }

  static bool _isConnectionErrorByString(String errorString) {
    final lowerError = errorString.toLowerCase();

    const connectionIndicators = [
      // SocketException (mobile)
      'socketexception',
      // Network unreachable
      'network unreachable',
      // Connection reset/interrupted
      'connection reset',
      'broken pipe',
      // DNS issues
      'no address associated with hostname',
      'nodename nor servname provided',
      // Connection refused
      'connection refused',
      // Host unreachable
      'host unreachable',
      // No route to host
      'no route to host',
    ];

    return connectionIndicators
        .any((indicator) => lowerError.contains(indicator));
  }
}

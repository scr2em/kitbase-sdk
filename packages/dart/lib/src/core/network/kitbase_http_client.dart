import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../constants.dart';
import '../exceptions/exceptions.dart';
import 'kitbase_http_response.dart';
import 'network_error_detector.dart';

/// Singleton HTTP client for Kitbase SDK.
///
/// Must be initialized with [init] before use.
class KitbaseHttpClient {
  KitbaseHttpClient._();

  static final KitbaseHttpClient _instance = KitbaseHttpClient._();

  /// Returns the singleton instance.
  static KitbaseHttpClient get instance => _instance;

  http.Client? _client;
  String? _token;
  String? _baseUrl;
  bool _isInitialized = false;

  /// Whether the client has been initialized.
  bool get isInitialized => _isInitialized;

  /// Initializes the client with the given token.
  ///
  /// [token] is your Kitbase API key.
  /// [baseUrl] is an optional base URL to override the default.
  /// [client] is an optional HTTP client for testing.
  ///
  /// If already initialized, this method does nothing.
  void init({
    required String token,
    String? baseUrl,
    http.Client? client,
  }) {
    if (_isInitialized) return;

    if (token.isEmpty) {
      throw const KitbaseValidationException(
        'API token is required',
        field: 'token',
      );
    }

    _token = token;
    _baseUrl = baseUrl;
    _client = client ?? http.Client();
    _isInitialized = true;
  }

  /// Performs a POST request.
  Future<KitbaseHttpResponse> post({
    required String path,
    Map<String, dynamic>? queryParameters,
    dynamic data,
    KitbaseHttpRequestHeaders headers = const KitbaseHttpRequestHeaders(),
  }) async {
    _ensureInitialized();

    final uri = _buildUri(path, queryParameters);
    return _executeRequest(
      () => _client!.post(
        uri,
        headers: _buildHeaders(headers),
        body: data != null ? jsonEncode(data) : null,
      ),
    );
  }

  void _ensureInitialized() {
    if (!_isInitialized) {
      throw const KitbaseValidationException(
        'KitbaseHttpClient must be initialized before use. Call KitbaseHttpClient.instance.init() first.',
      );
    }
  }

  Uri _buildUri(String path, Map<String, dynamic>? queryParameters) {
    final baseUrl = _baseUrl ?? KitbaseConstants.baseUrl;
    final uri = Uri.parse('$baseUrl$path');
    if (queryParameters != null && queryParameters.isNotEmpty) {
      return uri.replace(
        queryParameters: queryParameters.map(
          (key, value) => MapEntry(key, value.toString()),
        ),
      );
    }
    return uri;
  }

  Map<String, String> _buildHeaders(KitbaseHttpRequestHeaders headers) {
    final Map<String, String> result = {
      'Content-Type': 'application/json',
    };

    if (headers.addAuthorizationHeader) {
      result['Authorization'] = 'Bearer $_token';
    }

    if (headers.customHeaders != null) {
      result.addAll(headers.customHeaders!);
    }

    return result;
  }

  Future<KitbaseHttpResponse> _executeRequest(
    Future<http.Response> Function() request,
  ) async {
    try {
      final response = await request().timeout(KitbaseConstants.timeout);
      return KitbaseHttpResponse(
        data: _tryParseJson(response.body),
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (NetworkErrorDetector.isConnectionError(e)) {
        return const KitbaseHttpResponse(isConnectionError: true);
      }
      rethrow;
    }
  }

  dynamic _tryParseJson(String body) {
    if (body.isEmpty) return null;
    try {
      return jsonDecode(body);
    } catch (_) {
      return body;
    }
  }
}

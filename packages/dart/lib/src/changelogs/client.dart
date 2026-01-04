import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'exceptions.dart';
import 'types.dart';

const _baseUrl = 'https://api.kitbase.dev';
const _timeout = Duration(seconds: 30);

/// Kitbase Changelogs client for fetching version changelogs.
///
/// ```dart
/// final changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');
///
/// final changelog = await changelogs.get('1.0.0');
/// print(changelog.version);
/// print(changelog.markdown);
/// ```
class KitbaseChangelogs {
  final String _token;
  final http.Client _client;

  /// Creates a new KitbaseChangelogs client.
  ///
  /// [token] is your Kitbase API key.
  /// [client] is an optional HTTP client for testing.
  KitbaseChangelogs({
    required String token,
    http.Client? client,
  })  : _token = token,
        _client = client ?? http.Client() {
    if (token.isEmpty) {
      throw const ChangelogsValidationException('API token is required',
          field: 'token');
    }
  }

  /// Get a published changelog by version.
  ///
  /// [version] is the version string (e.g., "1.0.0", "2.3.1").
  ///
  /// Returns a [ChangelogResponse] with the changelog details.
  ///
  /// Throws [ChangelogsValidationException] when version is missing.
  /// Throws [ChangelogsAuthenticationException] when the API key is invalid.
  /// Throws [ChangelogsNotFoundException] when the changelog is not found.
  /// Throws [ChangelogsApiException] when the API returns an error.
  /// Throws [ChangelogsTimeoutException] when the request times out.
  Future<ChangelogResponse> get(String version) async {
    if (version.isEmpty) {
      throw const ChangelogsValidationException('Version is required',
          field: 'version');
    }

    return _request('/v1/changelogs/${Uri.encodeComponent(version)}');
  }

  Future<ChangelogResponse> _request(String endpoint) async {
    final uri = Uri.parse('$_baseUrl$endpoint');

    try {
      final response = await _client
          .get(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $_token',
            },
          )
          .timeout(_timeout);

      if (response.statusCode == 401) {
        throw const ChangelogsAuthenticationException();
      }

      if (response.statusCode == 404) {
        final version = endpoint.split('/').last;
        throw ChangelogsNotFoundException(Uri.decodeComponent(version));
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final errorBody = _tryParseJson(response.body);
        final message = _extractErrorMessage(errorBody) ??
            response.reasonPhrase ??
            'Unknown error';
        throw ChangelogsApiException(
          message,
          statusCode: response.statusCode,
          response: errorBody,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return ChangelogResponse.fromJson(json);
    } on TimeoutException {
      throw const ChangelogsTimeoutException();
    }
  }

  dynamic _tryParseJson(String body) {
    try {
      return jsonDecode(body);
    } catch (_) {
      return null;
    }
  }

  String? _extractErrorMessage(dynamic body) {
    if (body is Map<String, dynamic>) {
      if (body.containsKey('message')) {
        return body['message']?.toString();
      }
      if (body.containsKey('error')) {
        return body['error']?.toString();
      }
    }
    return null;
  }

  /// Closes the HTTP client.
  void close() {
    _client.close();
  }
}








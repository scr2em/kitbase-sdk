import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'exceptions.dart';
import 'types.dart';

const _baseUrl = 'https://api.kitbase.dev';
const _timeout = Duration(seconds: 30);

/// Kitbase client for tracking events.
///
/// ```dart
/// final kitbase = Kitbase(token: '<YOUR_API_KEY>');
///
/// await kitbase.track(
///   channel: 'payments',
///   event: 'New Subscription',
///   userId: 'user-123',
///   icon: '💰',
///   notify: true,
///   tags: {'plan': 'premium', 'cycle': 'monthly'},
/// );
/// ```
class Kitbase {
  final String _token;
  final http.Client _client;

  /// Creates a new Kitbase client.
  ///
  /// [token] is your Kitbase API key.
  /// [client] is an optional HTTP client for testing.
  Kitbase({
    required String token,
    http.Client? client,
  })  : _token = token,
        _client = client ?? http.Client() {
    if (token.isEmpty) {
      throw const ValidationException('API token is required', field: 'token');
    }
  }

  /// Track an event.
  ///
  /// [channel] is the channel/category for the event (required).
  /// [event] is the name of the event (required).
  /// [userId] is an optional user identifier.
  /// [icon] is an optional icon (emoji or icon name).
  /// [notify] determines whether to send a notification.
  /// [description] is an optional event description.
  /// [tags] are optional additional metadata tags.
  ///
  /// Returns a [TrackResponse] with the event ID and timestamp.
  ///
  /// Throws [ValidationException] when required fields are missing.
  /// Throws [AuthenticationException] when the API key is invalid.
  /// Throws [ApiException] when the API returns an error.
  /// Throws [TimeoutException] when the request times out.
  Future<TrackResponse> track({
    required String channel,
    required String event,
    String? userId,
    String? icon,
    bool? notify,
    String? description,
    Map<String, dynamic>? tags,
  }) async {
    if (channel.isEmpty) {
      throw const ValidationException('Channel is required', field: 'channel');
    }
    if (event.isEmpty) {
      throw const ValidationException('Event is required', field: 'event');
    }

    final options = TrackOptions(
      channel: channel,
      event: event,
      userId: userId,
      icon: icon,
      notify: notify,
      description: description,
      tags: tags,
    );

    return _request('/v1/logs', options.toJson());
  }

  Future<TrackResponse> _request(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    final uri = Uri.parse('$_baseUrl$endpoint');

    try {
      final response = await _client
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $_token',
            },
            body: jsonEncode(body),
          )
          .timeout(_timeout);

      if (response.statusCode == 401) {
        throw const AuthenticationException();
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final errorBody = _tryParseJson(response.body);
        final message = _extractErrorMessage(errorBody) ?? response.reasonPhrase ?? 'Unknown error';
        throw ApiException(
          message,
          statusCode: response.statusCode,
          response: errorBody,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return TrackResponse.fromJson(json);
    } on TimeoutException {
      throw const TimeoutException();
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
  ///
  /// Call this when you're done using the Kitbase client
  /// to free up resources.
  void close() {
    _client.close();
  }
}



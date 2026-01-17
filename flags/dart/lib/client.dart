import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'exceptions.dart';
import 'types.dart';

const _baseUrl = 'https://api.kitbase.dev';
const _timeout = Duration(seconds: 30);

/// Kitbase Feature Flags client for evaluating feature flags.
///
/// ```dart
/// final flags = KitbaseFlags(token: '<YOUR_API_KEY>');
///
/// // Simple boolean check
/// final isEnabled = await flags.getBooleanValue(
///   'dark-mode',
///   false,
///   context: EvaluationContext(
///     targetingKey: 'user-123',
///     attributes: {'plan': 'premium'},
///   ),
/// );
///
/// // Get full resolution details
/// final result = await flags.evaluateFlag(
///   'feature-x',
///   context: EvaluationContext(
///     targetingKey: 'user-123',
///     attributes: {'country': 'US'},
///   ),
/// );
/// print('${result.value}, ${result.reason}');
/// ```
class KitbaseFlags {
  final String _token;
  final http.Client _client;

  /// Creates a new KitbaseFlags client.
  ///
  /// [token] is your Kitbase API key.
  /// [client] is an optional HTTP client for testing.
  KitbaseFlags({
    required String token,
    http.Client? client,
  })  : _token = token,
        _client = client ?? http.Client() {
    if (token.isEmpty) {
      throw const FlagsValidationException('API token is required',
          field: 'token');
    }
  }

  /// Get a snapshot of all evaluated feature flags.
  ///
  /// [options] contains evaluation options including context.
  ///
  /// Returns a [FlagSnapshot] with all evaluated flags.
  ///
  /// Throws [FlagsAuthenticationException] when the API key is invalid.
  /// Throws [FlagsApiException] when the API returns an error.
  /// Throws [FlagsTimeoutException] when the request times out.
  Future<FlagSnapshot> getSnapshot({EvaluateOptions? options}) async {
    final payload = _buildSnapshotPayload(options?.context);
    final response =
        await _request<Map<String, dynamic>>('/sdk/v1/feature-flags/snapshot', payload);
    return FlagSnapshot.fromJson(response);
  }

  /// Evaluate a single feature flag with full resolution details.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [context] is the optional evaluation context for targeting.
  /// [defaultValue] is the default value to return if flag cannot be evaluated.
  ///
  /// Returns an [EvaluatedFlag] with resolution details.
  ///
  /// Throws [FlagsValidationException] when flagKey is missing.
  /// Throws [FlagsAuthenticationException] when the API key is invalid.
  /// Throws [FlagsApiException] when the API returns an error.
  /// Throws [FlagsTimeoutException] when the request times out.
  Future<EvaluatedFlag> evaluateFlag(
    String flagKey, {
    EvaluationContext? context,
    dynamic defaultValue,
  }) async {
    if (flagKey.isEmpty) {
      throw const FlagsValidationException('Flag key is required',
          field: 'flagKey');
    }

    final payload = _buildEvaluateFlagPayload(flagKey, context, defaultValue);
    final response =
        await _request<Map<String, dynamic>>('/sdk/v1/feature-flags/evaluate', payload);
    return EvaluatedFlag.fromJson(response);
  }

  /// Get a boolean flag value.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [defaultValue] is the default value if flag cannot be evaluated.
  /// [context] is the optional evaluation context.
  ///
  /// Returns the boolean value.
  ///
  /// Throws [TypeMismatchException] when the flag is not a boolean type.
  Future<bool> getBooleanValue(
    String flagKey,
    bool defaultValue, {
    EvaluationContext? context,
  }) async {
    final result = await getBooleanDetails(flagKey, defaultValue, context: context);
    return result.value;
  }

  /// Get a boolean flag value with full resolution details.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [defaultValue] is the default value if flag cannot be evaluated.
  /// [context] is the optional evaluation context.
  ///
  /// Returns [ResolutionDetails] with boolean value.
  Future<ResolutionDetails<bool>> getBooleanDetails(
    String flagKey,
    bool defaultValue, {
    EvaluationContext? context,
  }) async {
    final flag = await evaluateFlag(
      flagKey,
      context: context,
      defaultValue: defaultValue,
    );

    return _toResolutionDetails<bool>(flag, defaultValue, FlagValueType.boolean);
  }

  /// Get a string flag value.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [defaultValue] is the default value if flag cannot be evaluated.
  /// [context] is the optional evaluation context.
  ///
  /// Returns the string value.
  ///
  /// Throws [TypeMismatchException] when the flag is not a string type.
  Future<String> getStringValue(
    String flagKey,
    String defaultValue, {
    EvaluationContext? context,
  }) async {
    final result = await getStringDetails(flagKey, defaultValue, context: context);
    return result.value;
  }

  /// Get a string flag value with full resolution details.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [defaultValue] is the default value if flag cannot be evaluated.
  /// [context] is the optional evaluation context.
  ///
  /// Returns [ResolutionDetails] with string value.
  Future<ResolutionDetails<String>> getStringDetails(
    String flagKey,
    String defaultValue, {
    EvaluationContext? context,
  }) async {
    final flag = await evaluateFlag(
      flagKey,
      context: context,
      defaultValue: defaultValue,
    );

    return _toResolutionDetails<String>(flag, defaultValue, FlagValueType.string);
  }

  /// Get a number flag value.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [defaultValue] is the default value if flag cannot be evaluated.
  /// [context] is the optional evaluation context.
  ///
  /// Returns the number value.
  ///
  /// Throws [TypeMismatchException] when the flag is not a number type.
  Future<num> getNumberValue(
    String flagKey,
    num defaultValue, {
    EvaluationContext? context,
  }) async {
    final result = await getNumberDetails(flagKey, defaultValue, context: context);
    return result.value;
  }

  /// Get a number flag value with full resolution details.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [defaultValue] is the default value if flag cannot be evaluated.
  /// [context] is the optional evaluation context.
  ///
  /// Returns [ResolutionDetails] with number value.
  Future<ResolutionDetails<num>> getNumberDetails(
    String flagKey,
    num defaultValue, {
    EvaluationContext? context,
  }) async {
    final flag = await evaluateFlag(
      flagKey,
      context: context,
      defaultValue: defaultValue,
    );

    return _toResolutionDetails<num>(flag, defaultValue, FlagValueType.number);
  }

  /// Get a JSON object flag value.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [defaultValue] is the default value if flag cannot be evaluated.
  /// [context] is the optional evaluation context.
  ///
  /// Returns the JSON value as a Map or List.
  ///
  /// Throws [TypeMismatchException] when the flag is not a json type.
  Future<T> getJsonValue<T>(
    String flagKey,
    T defaultValue, {
    EvaluationContext? context,
  }) async {
    final result = await getJsonDetails<T>(flagKey, defaultValue, context: context);
    return result.value;
  }

  /// Get a JSON object flag value with full resolution details.
  ///
  /// [flagKey] is the key of the flag to evaluate.
  /// [defaultValue] is the default value if flag cannot be evaluated.
  /// [context] is the optional evaluation context.
  ///
  /// Returns [ResolutionDetails] with JSON value.
  Future<ResolutionDetails<T>> getJsonDetails<T>(
    String flagKey,
    T defaultValue, {
    EvaluationContext? context,
  }) async {
    final flag = await evaluateFlag(
      flagKey,
      context: context,
      defaultValue: defaultValue,
    );

    return _toResolutionDetails<T>(flag, defaultValue, FlagValueType.json);
  }

  /// Convert API response to typed resolution details.
  ResolutionDetails<T> _toResolutionDetails<T>(
    EvaluatedFlag flag,
    T defaultValue,
    FlagValueType expectedType,
  ) {
    // Check for errors from the API
    if (flag.errorCode == ErrorCode.flagNotFound) {
      return ResolutionDetails<T>(
        value: defaultValue,
        reason: ResolutionReason.error,
        errorCode: ErrorCode.flagNotFound,
        errorMessage: flag.errorMessage,
        flagMetadata: flag.flagMetadata,
      );
    }

    // Type validation
    if (flag.valueType != expectedType) {
      throw TypeMismatchException(
        flag.flagKey,
        flagValueTypeToString(expectedType),
        flagValueTypeToString(flag.valueType),
      );
    }

    // Handle disabled flags
    if (!flag.enabled || flag.value == null) {
      return ResolutionDetails<T>(
        value: defaultValue,
        variant: flag.variant,
        reason: flag.reason,
        errorCode: flag.errorCode,
        errorMessage: flag.errorMessage,
        flagMetadata: flag.flagMetadata,
      );
    }

    return ResolutionDetails<T>(
      value: flag.value as T,
      variant: flag.variant,
      reason: flag.reason,
      errorCode: flag.errorCode,
      errorMessage: flag.errorMessage,
      flagMetadata: flag.flagMetadata,
    );
  }

  /// Build snapshot request payload from evaluation context.
  Map<String, dynamic>? _buildSnapshotPayload(EvaluationContext? context) {
    if (context == null) {
      return null;
    }

    final payload = <String, dynamic>{};

    if (context.targetingKey != null) {
      payload['identityId'] = context.targetingKey;
    }

    if (context.attributes.isNotEmpty) {
      payload['context'] = context.attributes;
    }

    return payload.isEmpty ? null : payload;
  }

  /// Build evaluate flag request payload.
  Map<String, dynamic> _buildEvaluateFlagPayload(
    String flagKey,
    EvaluationContext? context,
    dynamic defaultValue,
  ) {
    final payload = <String, dynamic>{
      'flagKey': flagKey,
    };

    if (context?.targetingKey != null) {
      payload['identityId'] = context!.targetingKey;
    }

    if (context != null && context.attributes.isNotEmpty) {
      payload['context'] = context.attributes;
    }

    if (defaultValue != null) {
      payload['defaultValue'] = defaultValue;
    }

    return payload;
  }

  Future<T> _request<T>(String endpoint, Map<String, dynamic>? body) async {
    final uri = Uri.parse('$_baseUrl$endpoint');

    try {
      final response = await _client
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'x-sdk-key': '$_token',
            },
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(_timeout);

      if (response.statusCode == 401) {
        throw const FlagsAuthenticationException();
      }

      if (response.statusCode == 404) {
        final errorBody = _tryParseJson(response.body);
        final flagKey = _extractFlagKey(errorBody);
        if (flagKey != null) {
          throw FlagNotFoundException(flagKey);
        }
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final errorBody = _tryParseJson(response.body);
        final message = _extractErrorMessage(errorBody) ??
            response.reasonPhrase ??
            'Unknown error';
        throw FlagsApiException(
          message,
          statusCode: response.statusCode,
          response: errorBody,
        );
      }

      return jsonDecode(response.body) as T;
    } on TimeoutException {
      throw const FlagsTimeoutException();
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

  String? _extractFlagKey(dynamic body) {
    if (body is Map<String, dynamic> && body.containsKey('flagKey')) {
      return body['flagKey']?.toString();
    }
    return null;
  }

  /// Closes the HTTP client.
  void close() {
    _client.close();
  }
}

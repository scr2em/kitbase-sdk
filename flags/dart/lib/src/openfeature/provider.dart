import 'dart:async';

import 'package:kitbase_flags/client.dart';
import 'package:kitbase_flags/types.dart' as kitbase_types;
import 'package:openfeature_dart_server_sdk/feature_provider.dart';

/// Configuration options for KitbaseProvider
class KitbaseProviderOptions {
  /// Your Kitbase API key
  final String token;

  /// Enable flag caching (default: true)
  final bool cache;

  /// Cache TTL in milliseconds (default: 60000 = 1 minute)
  final int cacheTtl;

  const KitbaseProviderOptions({
    required this.token,
    this.cache = true,
    this.cacheTtl = 60000,
  });
}

class _CacheEntry {
  final dynamic value;
  final String? variant;
  final String reason;
  final String? errorCode;
  final String? errorMessage;
  final Map<String, dynamic>? flagMetadata;
  final String valueType;
  final DateTime timestamp;

  _CacheEntry({
    required this.value,
    this.variant,
    required this.reason,
    this.errorCode,
    this.errorMessage,
    this.flagMetadata,
    required this.valueType,
    required this.timestamp,
  });
}

/// Kitbase OpenFeature Provider for server-side applications.
///
/// Implements the official OpenFeature Provider interface from
/// `openfeature_dart_server_sdk` for seamless integration with
/// the OpenFeature ecosystem.
///
/// ```dart
/// import 'package:openfeature_dart_server_sdk/open_feature_api.dart';
/// import 'package:openfeature_dart_server_sdk/client.dart';
/// import 'package:openfeature_dart_server_sdk/hooks.dart';
/// import 'package:openfeature_dart_server_sdk/evaluation_context.dart';
/// import 'package:kitbase/flags/openfeature.dart';
///
/// void main() async {
///   // Register the Kitbase provider
///   final api = OpenFeatureAPI();
///   api.setProvider(KitbaseProvider(
///     options: KitbaseProviderOptions(token: 'YOUR_API_KEY'),
///   ));
///
///   // Create a client
///   final client = FeatureClient(
///     metadata: ClientMetadata(name: 'my-app'),
///     hookManager: HookManager(),
///     defaultContext: EvaluationContext(attributes: {}),
///   );
///
///   // Evaluate flags
///   final isEnabled = await client.getBooleanFlag(
///     'dark-mode',
///     defaultValue: false,
///     context: EvaluationContext(attributes: {
///       'targetingKey': 'user-123',
///       'plan': 'premium',
///     }),
///   );
///
///   print('Dark mode enabled: $isEnabled');
/// }
/// ```
class KitbaseProvider implements FeatureProvider {
  @override
  String get name => 'kitbase';

  @override
  ProviderMetadata get metadata => ProviderMetadata(name: name);

  @override
  ProviderState get state => _state;
  ProviderState _state = ProviderState.NOT_READY;

  @override
  ProviderConfig get config => const ProviderConfig();

  final KitbaseFlags _client;
  final bool _cacheEnabled;
  final int _cacheTtl;
  final Map<String, _CacheEntry> _cache = {};

  /// Creates a new KitbaseProvider.
  ///
  /// [options] contains the configuration including your API token.
  KitbaseProvider({required KitbaseProviderOptions options})
      : _client = KitbaseFlags(token: options.token),
        _cacheEnabled = options.cache,
        _cacheTtl = options.cacheTtl;

  @override
  Future<void> initialize([Map<String, dynamic>? config]) async {
    _state = ProviderState.READY;
  }

  @override
  Future<void> connect() async {
    // No persistent connection needed
  }

  @override
  Future<void> shutdown() async {
    _cache.clear();
    _client.close();
    _state = ProviderState.NOT_READY;
  }

  @override
  Future<FlagEvaluationResult<bool>> getBooleanFlag(
    String flagKey,
    bool defaultValue, {
    Map<String, dynamic>? context,
  }) async {
    return _evaluateFlag<bool>(flagKey, defaultValue, context, 'boolean');
  }

  @override
  Future<FlagEvaluationResult<String>> getStringFlag(
    String flagKey,
    String defaultValue, {
    Map<String, dynamic>? context,
  }) async {
    return _evaluateFlag<String>(flagKey, defaultValue, context, 'string');
  }

  @override
  Future<FlagEvaluationResult<int>> getIntegerFlag(
    String flagKey,
    int defaultValue, {
    Map<String, dynamic>? context,
  }) async {
    final result =
        await _evaluateFlag<num>(flagKey, defaultValue, context, 'number');
    return FlagEvaluationResult<int>(
      flagKey: result.flagKey,
      value: result.value.toInt(),
      evaluatedAt: result.evaluatedAt,
      evaluatorId: result.evaluatorId,
      variant: result.variant,
      reason: result.reason,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    );
  }

  @override
  Future<FlagEvaluationResult<double>> getDoubleFlag(
    String flagKey,
    double defaultValue, {
    Map<String, dynamic>? context,
  }) async {
    final result =
        await _evaluateFlag<num>(flagKey, defaultValue, context, 'number');
    return FlagEvaluationResult<double>(
      flagKey: result.flagKey,
      value: result.value.toDouble(),
      evaluatedAt: result.evaluatedAt,
      evaluatorId: result.evaluatorId,
      variant: result.variant,
      reason: result.reason,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    );
  }

  @override
  Future<FlagEvaluationResult<Map<String, dynamic>>> getObjectFlag(
    String flagKey,
    Map<String, dynamic> defaultValue, {
    Map<String, dynamic>? context,
  }) async {
    return _evaluateFlag<Map<String, dynamic>>(
        flagKey, defaultValue, context, 'json');
  }

  /// Prefetch all flags for a context (useful for caching).
  Future<void> prefetchFlags({Map<String, dynamic>? context}) async {
    final kitbaseContext = _toKitbaseContext(context);
    final snapshot = await _client.getSnapshot(
        options: kitbase_types.EvaluateOptions(context: kitbaseContext));

    for (final flag in snapshot.flags) {
      final cacheKey = _getCacheKey(flag.flagKey, context);
      _cache[cacheKey] = _CacheEntry(
        value: flag.value,
        variant: flag.variant,
        reason: _reasonToString(flag.reason),
        errorCode: flag.errorCode != null
            ? _kitbaseErrorCodeToString(flag.errorCode!)
            : null,
        errorMessage: flag.errorMessage,
        flagMetadata: flag.flagMetadata,
        valueType: kitbase_types.flagValueTypeToString(flag.valueType),
        timestamp: DateTime.now(),
      );
    }
  }

  /// Clear the flag cache.
  void clearCache() {
    _cache.clear();
  }

  Future<FlagEvaluationResult<T>> _evaluateFlag<T>(
    String flagKey,
    T defaultValue,
    Map<String, dynamic>? context,
    String expectedType,
  ) async {
    // Check cache first
    if (_cacheEnabled) {
      final cached = _getCachedValue<T>(flagKey, context, expectedType);
      if (cached != null) {
        return cached;
      }
    }

    try {
      final kitbaseContext = _toKitbaseContext(context);
      final flag = await _client.evaluateFlag(
        flagKey,
        context: kitbaseContext,
        defaultValue: defaultValue,
      );

      // Check for type mismatch
      if (kitbase_types.flagValueTypeToString(flag.valueType) != expectedType) {
        return FlagEvaluationResult<T>(
          flagKey: flagKey,
          value: defaultValue,
          evaluatedAt: DateTime.now(),
          evaluatorId: name,
          reason: 'ERROR',
          errorCode: ErrorCode.TYPE_MISMATCH,
          errorMessage:
              'Expected $expectedType, got ${kitbase_types.flagValueTypeToString(flag.valueType)}',
        );
      }

      // Cache the result
      if (_cacheEnabled) {
        _setCachedValue(flagKey, context, flag, expectedType);
      }

      // Handle disabled flags or errors
      if (flag.errorCode == kitbase_types.ErrorCode.flagNotFound ||
          !flag.enabled ||
          flag.value == null) {
        return FlagEvaluationResult<T>(
          flagKey: flagKey,
          value: defaultValue,
          evaluatedAt: DateTime.now(),
          evaluatorId: name,
          variant: flag.variant,
          reason: _reasonToString(flag.reason),
          errorCode: flag.errorCode != null
              ? _kitbaseErrorCodeToOpenFeatureErrorCode(flag.errorCode!)
              : null,
          errorMessage: flag.errorMessage,
        );
      }

      return FlagEvaluationResult<T>(
        flagKey: flagKey,
        value: flag.value as T,
        evaluatedAt: DateTime.now(),
        evaluatorId: name,
        variant: flag.variant,
        reason: _reasonToString(flag.reason),
        errorCode: flag.errorCode != null
            ? _kitbaseErrorCodeToOpenFeatureErrorCode(flag.errorCode!)
            : null,
        errorMessage: flag.errorMessage,
      );
    } catch (error) {
      return FlagEvaluationResult<T>(
        flagKey: flagKey,
        value: defaultValue,
        evaluatedAt: DateTime.now(),
        evaluatorId: name,
        reason: 'ERROR',
        errorCode: ErrorCode.GENERAL,
        errorMessage: error.toString(),
      );
    }
  }

  kitbase_types.EvaluationContext? _toKitbaseContext(
      Map<String, dynamic>? context) {
    if (context == null || context.isEmpty) {
      return null;
    }

    final targetingKey = context['targetingKey'] as String?;
    final attributes = Map<String, dynamic>.from(context)
      ..remove('targetingKey');

    return kitbase_types.EvaluationContext(
      targetingKey: targetingKey,
      attributes: attributes,
    );
  }

  String _getCacheKey(String flagKey, Map<String, dynamic>? context) {
    final contextKey = context?['targetingKey'] ?? 'anonymous';
    return '$flagKey:$contextKey';
  }

  FlagEvaluationResult<T>? _getCachedValue<T>(
    String flagKey,
    Map<String, dynamic>? context,
    String expectedType,
  ) {
    final cacheKey = _getCacheKey(flagKey, context);
    final cached = _cache[cacheKey];

    if (cached == null) {
      return null;
    }

    // Check if cache is expired
    if (DateTime.now().difference(cached.timestamp).inMilliseconds >
        _cacheTtl) {
      _cache.remove(cacheKey);
      return null;
    }

    // Check type match
    if (cached.valueType != expectedType) {
      return null;
    }

    return FlagEvaluationResult<T>(
      flagKey: flagKey,
      value: cached.value as T,
      evaluatedAt: cached.timestamp,
      evaluatorId: name,
      variant: cached.variant,
      reason: 'CACHED',
      errorCode: cached.errorCode != null
          ? _stringToOpenFeatureErrorCode(cached.errorCode!)
          : null,
      errorMessage: cached.errorMessage,
    );
  }

  void _setCachedValue(
    String flagKey,
    Map<String, dynamic>? context,
    kitbase_types.EvaluatedFlag flag,
    String valueType,
  ) {
    final cacheKey = _getCacheKey(flagKey, context);
    _cache[cacheKey] = _CacheEntry(
      value: flag.value,
      variant: flag.variant,
      reason: _reasonToString(flag.reason),
      errorCode: flag.errorCode != null
          ? _kitbaseErrorCodeToString(flag.errorCode!)
          : null,
      errorMessage: flag.errorMessage,
      flagMetadata: flag.flagMetadata,
      valueType: valueType,
      timestamp: DateTime.now(),
    );
  }

  String _reasonToString(kitbase_types.ResolutionReason reason) {
    switch (reason) {
      case kitbase_types.ResolutionReason.static_:
        return 'STATIC';
      case kitbase_types.ResolutionReason.default_:
        return 'DEFAULT';
      case kitbase_types.ResolutionReason.targetingMatch:
        return 'TARGETING_MATCH';
      case kitbase_types.ResolutionReason.split:
        return 'SPLIT';
      case kitbase_types.ResolutionReason.cached:
        return 'CACHED';
      case kitbase_types.ResolutionReason.disabled:
        return 'DISABLED';
      case kitbase_types.ResolutionReason.unknown:
        return 'UNKNOWN';
      case kitbase_types.ResolutionReason.stale:
        return 'STALE';
      case kitbase_types.ResolutionReason.error:
        return 'ERROR';
    }
  }

  String _kitbaseErrorCodeToString(kitbase_types.ErrorCode code) {
    switch (code) {
      case kitbase_types.ErrorCode.providerNotReady:
        return 'PROVIDER_NOT_READY';
      case kitbase_types.ErrorCode.flagNotFound:
        return 'FLAG_NOT_FOUND';
      case kitbase_types.ErrorCode.parseError:
        return 'PARSE_ERROR';
      case kitbase_types.ErrorCode.typeMismatch:
        return 'TYPE_MISMATCH';
      case kitbase_types.ErrorCode.targetingKeyMissing:
        return 'TARGETING_KEY_MISSING';
      case kitbase_types.ErrorCode.invalidContext:
        return 'INVALID_CONTEXT';
      case kitbase_types.ErrorCode.general:
        return 'GENERAL';
    }
  }

  /// Convert Kitbase ErrorCode to OpenFeature ErrorCode enum.
  ErrorCode _kitbaseErrorCodeToOpenFeatureErrorCode(
      kitbase_types.ErrorCode code) {
    switch (code) {
      case kitbase_types.ErrorCode.providerNotReady:
        return ErrorCode.PROVIDER_NOT_READY;
      case kitbase_types.ErrorCode.flagNotFound:
        return ErrorCode.FLAG_NOT_FOUND;
      case kitbase_types.ErrorCode.parseError:
        return ErrorCode.PARSE_ERROR;
      case kitbase_types.ErrorCode.typeMismatch:
        return ErrorCode.TYPE_MISMATCH;
      case kitbase_types.ErrorCode.targetingKeyMissing:
        return ErrorCode.TARGETING_KEY_MISSING;
      case kitbase_types.ErrorCode.invalidContext:
        return ErrorCode.INVALID_CONTEXT;
      case kitbase_types.ErrorCode.general:
        return ErrorCode.GENERAL;
    }
  }

  ErrorCode _stringToOpenFeatureErrorCode(String code) {
    switch (code) {
      case 'PROVIDER_NOT_READY':
        return ErrorCode.PROVIDER_NOT_READY;
      case 'FLAG_NOT_FOUND':
        return ErrorCode.FLAG_NOT_FOUND;
      case 'PARSE_ERROR':
        return ErrorCode.PARSE_ERROR;
      case 'TYPE_MISMATCH':
        return ErrorCode.TYPE_MISMATCH;
      case 'TARGETING_KEY_MISSING':
        return ErrorCode.TARGETING_KEY_MISSING;
      case 'INVALID_CONTEXT':
        return ErrorCode.INVALID_CONTEXT;
      case 'GENERAL':
        return ErrorCode.GENERAL;
      default:
        return ErrorCode.GENERAL;
    }
  }
}

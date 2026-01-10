/// Flag value types supported by Kitbase.
enum FlagValueType {
  boolean,
  number,
  string,
  json,
}

/// OpenFeature-compatible resolution reasons.
///
/// See https://openfeature.dev/specification/types#resolution-details
enum ResolutionReason {
  static_,
  default_,
  targetingMatch,
  split,
  cached,
  disabled,
  unknown,
  stale,
  error,
}

/// OpenFeature-compatible error codes.
///
/// See https://openfeature.dev/specification/types#error-code
enum ErrorCode {
  providerNotReady,
  flagNotFound,
  parseError,
  typeMismatch,
  targetingKeyMissing,
  invalidContext,
  general,
}

/// Evaluation context for targeting and percentage rollouts.
/// Compatible with OpenFeature EvaluationContext.
///
/// See https://openfeature.dev/specification/types#evaluation-context
class EvaluationContext {
  /// Unique identifier for the user/device (used for percentage rollouts).
  /// Maps to OpenFeature's targetingKey.
  final String? targetingKey;

  /// Additional context attributes for targeting rules.
  final Map<String, dynamic> attributes;

  const EvaluationContext({
    this.targetingKey,
    this.attributes = const {},
  });
}

/// OpenFeature-compatible resolution details.
///
/// See https://openfeature.dev/specification/types#resolution-details
class ResolutionDetails<T> {
  /// The resolved flag value.
  final T value;

  /// OpenFeature variant identifier (e.g., "control", "treatment-a").
  final String? variant;

  /// Reason for the resolved value.
  final ResolutionReason reason;

  /// Error code if evaluation failed.
  final ErrorCode? errorCode;

  /// Human-readable error message.
  final String? errorMessage;

  /// Optional metadata about the flag.
  final Map<String, dynamic>? flagMetadata;

  const ResolutionDetails({
    required this.value,
    this.variant,
    required this.reason,
    this.errorCode,
    this.errorMessage,
    this.flagMetadata,
  });
}

/// A single evaluated feature flag from the API.
class EvaluatedFlag {
  /// Unique key for the flag.
  final String flagKey;

  /// Whether the flag is enabled for this identity.
  final bool enabled;

  /// The type of value this flag returns.
  final FlagValueType valueType;

  /// The evaluated value (type depends on valueType, null if disabled).
  final dynamic value;

  /// OpenFeature variant identifier.
  final String? variant;

  /// Reason for the resolved value.
  final ResolutionReason reason;

  /// Error code if evaluation failed.
  final ErrorCode? errorCode;

  /// Human-readable error message.
  final String? errorMessage;

  /// Optional metadata about the flag.
  final Map<String, dynamic>? flagMetadata;

  const EvaluatedFlag({
    required this.flagKey,
    required this.enabled,
    required this.valueType,
    this.value,
    this.variant,
    required this.reason,
    this.errorCode,
    this.errorMessage,
    this.flagMetadata,
  });

  factory EvaluatedFlag.fromJson(Map<String, dynamic> json) {
    return EvaluatedFlag(
      flagKey: json['flagKey'] as String,
      enabled: json['enabled'] as bool,
      valueType: _parseValueType(json['valueType'] as String),
      value: json['value'],
      variant: json['variant'] as String?,
      reason: _parseReason(json['reason'] as String),
      errorCode: json['errorCode'] != null
          ? _parseErrorCode(json['errorCode'] as String)
          : null,
      errorMessage: json['errorMessage'] as String?,
      flagMetadata: json['flagMetadata'] != null
          ? Map<String, dynamic>.from(json['flagMetadata'] as Map)
          : null,
    );
  }
}

/// Response from the snapshot API containing all evaluated flags.
class FlagSnapshot {
  /// Project ID the flags belong to.
  final String projectId;

  /// Environment ID the flags were evaluated for.
  final String environmentId;

  /// Timestamp when the evaluation was performed.
  final String evaluatedAt;

  /// List of evaluated feature flags.
  final List<EvaluatedFlag> flags;

  const FlagSnapshot({
    required this.projectId,
    required this.environmentId,
    required this.evaluatedAt,
    required this.flags,
  });

  factory FlagSnapshot.fromJson(Map<String, dynamic> json) {
    return FlagSnapshot(
      projectId: json['projectId'] as String,
      environmentId: json['environmentId'] as String,
      evaluatedAt: json['evaluatedAt'] as String,
      flags: (json['flags'] as List<dynamic>)
          .map((e) => EvaluatedFlag.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Options for evaluating flags.
class EvaluateOptions {
  /// Evaluation context for targeting.
  final EvaluationContext? context;

  const EvaluateOptions({this.context});
}

/// Options for evaluating a single flag.
class EvaluateFlagOptions extends EvaluateOptions {
  /// Default value to return if flag cannot be evaluated.
  final dynamic defaultValue;

  const EvaluateFlagOptions({
    super.context,
    this.defaultValue,
  });
}

// Helper functions for parsing enums

FlagValueType _parseValueType(String value) {
  switch (value) {
    case 'boolean':
      return FlagValueType.boolean;
    case 'number':
      return FlagValueType.number;
    case 'string':
      return FlagValueType.string;
    case 'json':
      return FlagValueType.json;
    default:
      throw ArgumentError('Unknown flag value type: $value');
  }
}

ResolutionReason _parseReason(String value) {
  switch (value) {
    case 'STATIC':
      return ResolutionReason.static_;
    case 'DEFAULT':
      return ResolutionReason.default_;
    case 'TARGETING_MATCH':
      return ResolutionReason.targetingMatch;
    case 'SPLIT':
      return ResolutionReason.split;
    case 'CACHED':
      return ResolutionReason.cached;
    case 'DISABLED':
      return ResolutionReason.disabled;
    case 'UNKNOWN':
      return ResolutionReason.unknown;
    case 'STALE':
      return ResolutionReason.stale;
    case 'ERROR':
      return ResolutionReason.error;
    default:
      return ResolutionReason.unknown;
  }
}

ErrorCode _parseErrorCode(String value) {
  switch (value) {
    case 'PROVIDER_NOT_READY':
      return ErrorCode.providerNotReady;
    case 'FLAG_NOT_FOUND':
      return ErrorCode.flagNotFound;
    case 'PARSE_ERROR':
      return ErrorCode.parseError;
    case 'TYPE_MISMATCH':
      return ErrorCode.typeMismatch;
    case 'TARGETING_KEY_MISSING':
      return ErrorCode.targetingKeyMissing;
    case 'INVALID_CONTEXT':
      return ErrorCode.invalidContext;
    case 'GENERAL':
      return ErrorCode.general;
    default:
      return ErrorCode.general;
  }
}

/// Convert FlagValueType to string for API comparison.
String flagValueTypeToString(FlagValueType type) {
  switch (type) {
    case FlagValueType.boolean:
      return 'boolean';
    case FlagValueType.number:
      return 'number';
    case FlagValueType.string:
      return 'string';
    case FlagValueType.json:
      return 'json';
  }
}





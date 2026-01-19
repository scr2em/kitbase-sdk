// Main client
export { FlagsClient } from './client.js';
export type { FlagsClientEvent, FlagsClientListener } from './client.js';

// Local evaluation engine (for advanced use cases)
export { FlagEvaluator, evaluateFlag } from './evaluator.js';
export type { LocalEvaluationResult } from './evaluator.js';

// Types
export type {
  FlagsConfig,
  FlagValueType,
  ResolutionReason,
  ErrorCode,
  EvaluationContext,
  ResolutionDetails,
  EvaluatedFlag,
  FlagSnapshot,
  EvaluateOptions,
  EvaluateFlagOptions,
  JsonValue,
  ChangedFlags,
  FlagChangeCallback,
  FlagChangeSubscription,
} from './types.js';

// Configuration types (for local evaluation)
export type {
  FlagConfiguration,
  FlagDefinition,
  FlagRuleDefinition,
  SegmentDefinition,
  SegmentRuleDefinition,
  SegmentOperator,
} from './config-types.js';

// Errors
export {
  FlagsError,
  ApiError,
  AuthenticationError,
  ValidationError,
  TimeoutError,
  FlagNotFoundError,
  TypeMismatchError,
  InvalidContextError,
  ParseError,
} from './errors.js';

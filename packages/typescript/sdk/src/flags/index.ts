// Main client (server-side evaluation)
export { FlagsClient } from './client.js';

// Local evaluation client
export { LocalFlagsClient } from './local-client.js';
export type { LocalFlagsEvent, LocalFlagsListener } from './local-client.js';

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
} from './types.js';

// Configuration types (for local evaluation)
export type {
  FlagConfiguration,
  FlagDefinition,
  FlagRuleDefinition,
  SegmentDefinition,
  SegmentRuleDefinition,
  SegmentOperator,
  LocalFlagsConfig,
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

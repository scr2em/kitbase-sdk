// Main client
export { FlagsClient } from './client.js';

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

// Provider
export { FlagsProvider } from './provider.js';
export type { FlagsProviderProps } from './provider.js';

// Context hook (for advanced usage)
export { useFlagsContext } from './context.js';

// Flag hooks
export {
  useBooleanFlag,
  useStringFlag,
  useNumberFlag,
  useJsonFlag,
} from './use-flag.js';

export { useFlagSnapshot } from './use-snapshot.js';

// Types
export type { UseFlagOptions, UseFlagResult } from './types.js';

// Re-export types from the SDK for convenience
export type {
  EvaluationContext,
  ResolutionDetails,
  FlagSnapshot,
  EvaluatedFlag,
  JsonValue,
  ResolutionReason,
  ErrorCode,
} from '@kitbase/flags';

import { InjectionToken } from '@angular/core';
import type { FlagsConfig, EvaluationContext, JsonValue } from '@kitbase/flags';

/**
 * Injection token for the Kitbase Flags configuration
 */
export const FLAGS_CONFIG = new InjectionToken<FlagsConfig>('FLAGS_CONFIG');

/**
 * Options for flag signal methods
 */
export interface FlagSignalOptions {
  /**
   * Evaluation context for targeting rules
   */
  context?: EvaluationContext;
}

/**
 * Result type for flag signals with loading and error state
 */
export interface FlagSignalResult<T> {
  /**
   * The flag value (undefined while loading)
   */
  value: T | undefined;

  /**
   * Whether the flag is currently loading
   */
  isLoading: boolean;

  /**
   * Error if flag evaluation failed
   */
  error: Error | null;
}

/**
 * Re-export types from the SDK for convenience
 */
export type {
  FlagsConfig,
  EvaluationContext,
  JsonValue,
  ResolutionDetails,
  FlagSnapshot,
  EvaluatedFlag,
  ResolutionReason,
  ErrorCode,
} from '@kitbase/flags';

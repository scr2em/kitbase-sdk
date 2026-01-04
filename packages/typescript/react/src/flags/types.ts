import type { EvaluationContext } from '@kitbase/sdk/flags';

/**
 * Options for the flag hooks
 */
export interface UseFlagOptions {
  /**
   * Evaluation context for feature flag targeting
   */
  context?: EvaluationContext;

  /**
   * Whether to refetch when the context changes
   * @default true
   */
  refetchOnContextChange?: boolean;
}

/**
 * Result returned by flag hooks
 */
export interface UseFlagResult<T> {
  /**
   * The data returned from the operation
   */
  data: T | undefined;

  /**
   * Whether the operation is currently loading
   */
  isLoading: boolean;

  /**
   * Any error that occurred during the operation
   */
  error: Error | null;

  /**
   * Refetch the flag value
   */
  refetch: () => Promise<void>;
}




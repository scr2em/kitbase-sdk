/**
 * Options for the useChangelog hook
 */
export interface UseChangelogOptions {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  enabled?: boolean;
}

/**
 * State for async operations
 */
export interface AsyncState<T> {
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
}




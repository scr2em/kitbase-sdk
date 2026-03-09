import type { GetMessagesOptions } from '@kitbase/messaging';

/**
 * Options for the useMessages hook
 */
export interface UseMessagesOptions extends GetMessagesOptions {
  /**
   * Whether to fetch on mount.
   * @default true
   */
  enabled?: boolean;

  /**
   * Polling interval in milliseconds.
   * Set to 0 or omit to disable polling.
   */
  pollInterval?: number;
}

/**
 * State for async operations
 */
export interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
}

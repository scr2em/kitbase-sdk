import { useState, useCallback } from 'react';
import type { TrackOptions, TrackResponse } from '@kitbase/sdk/events';
import { useEventsContext } from './context.js';

export interface UseTrackResult {
  /**
   * Track an event
   */
  track: (options: TrackOptions) => Promise<TrackResponse | undefined>;

  /**
   * Whether a tracking request is in progress
   */
  isLoading: boolean;

  /**
   * Any error that occurred during the last track call
   */
  error: Error | null;

  /**
   * The response from the last successful track call
   */
  data: TrackResponse | undefined;

  /**
   * Reset the state (clear data and error)
   */
  reset: () => void;
}

/**
 * Hook for tracking events
 *
 * @returns A function to track events and the state
 *
 * @example
 * ```tsx
 * function CheckoutButton() {
 *   const { track, isLoading, error } = useTrack();
 *
 *   const handleCheckout = async () => {
 *     await track({
 *       channel: 'payments',
 *       event: 'Checkout Started',
 *       user_id: userId,
 *       icon: '🛒',
 *       tags: {
 *         cart_value: 99.99,
 *         items_count: 3,
 *       },
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleCheckout} disabled={isLoading}>
 *       Checkout
 *     </button>
 *   );
 * }
 * ```
 */
export function useTrack(): UseTrackResult {
  const events = useEventsContext();
  const [data, setData] = useState<TrackResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const track = useCallback(
    async (options: TrackOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await events.track(options);
        setData(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [events],
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
  }, []);

  return {
    track,
    isLoading,
    error,
    data,
    reset,
  };
}

/**
 * Hook to get a pre-configured track function for a specific channel
 *
 * @param channel - The channel to track events to
 * @returns A function to track events to the channel
 *
 * @example
 * ```tsx
 * function PaymentsPage() {
 *   const { trackChannel, isLoading } = useTrackChannel('payments');
 *
 *   const handlePayment = async () => {
 *     await trackChannel({
 *       event: 'Payment Completed',
 *       user_id: userId,
 *       icon: '💰',
 *       tags: { amount: 99.99 },
 *     });
 *   };
 *
 *   return <button onClick={handlePayment}>Pay</button>;
 * }
 * ```
 */
export function useTrackChannel(channel: string): {
  trackChannel: (
    options: Omit<TrackOptions, 'channel'>,
  ) => Promise<TrackResponse | undefined>;
  isLoading: boolean;
  error: Error | null;
  data: TrackResponse | undefined;
  reset: () => void;
} {
  const { track, isLoading, error, data, reset } = useTrack();

  const trackChannel = useCallback(
    async (options: Omit<TrackOptions, 'channel'>) => {
      return track({ ...options, channel });
    },
    [track, channel],
  );

  return {
    trackChannel,
    isLoading,
    error,
    data,
    reset,
  };
}

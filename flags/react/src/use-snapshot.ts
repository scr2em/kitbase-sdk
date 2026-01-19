import { useState, useEffect, useCallback, useRef } from 'react';
import type { EvaluationContext, FlagSnapshot } from '@kitbase/flags';
import { useFlagsContext } from './context.js';
import type { UseFlagOptions, UseFlagResult } from './types.js';

/**
 * Deep equality check for context objects
 */
function contextEqual(
  a: EvaluationContext | undefined,
  b: EvaluationContext | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Hook to get a snapshot of all feature flags
 *
 * @param options - Options for evaluation context and behavior
 * @returns The flag snapshot and state
 *
 * @example
 * ```tsx
 * function FlagsDebugger() {
 *   const { data: snapshot, isLoading, error } = useFlagSnapshot({
 *     context: { targetingKey: userId }
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <ul>
 *       {snapshot?.flags.map(flag => (
 *         <li key={flag.flagKey}>
 *           {flag.flagKey}: {String(flag.value)}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useFlagSnapshot(
  options?: UseFlagOptions,
): UseFlagResult<FlagSnapshot> {
  const flags = useFlagsContext();
  const [data, setData] = useState<FlagSnapshot | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contextRef = useRef(options?.context);
  const refetchOnContextChange = options?.refetchOnContextChange ?? true;

  const fetchSnapshot = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await flags.getSnapshot({
        context: options?.context,
      });
      setData(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [flags, options?.context]);

  useEffect(() => {
    // Check if context changed
    if (
      refetchOnContextChange &&
      !contextEqual(contextRef.current, options?.context)
    ) {
      contextRef.current = options?.context;
      fetchSnapshot();
    }
  }, [options?.context, refetchOnContextChange, fetchSnapshot]);

  useEffect(() => {
    // If client is already ready, fetch immediately
    if (flags.isReady()) {
      fetchSnapshot();
    }

    // Listen for configuration changes (when polling updates config) and ready event (initial load)
    const unsubscribe = flags.on((event) => {
      if (event.type === 'configurationChanged' || event.type === 'ready') {
        fetchSnapshot();
      }
    });

    return unsubscribe;
  }, [flags, fetchSnapshot]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSnapshot,
  };
}

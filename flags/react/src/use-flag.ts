import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  EvaluationContext,
  JsonValue,
} from '@kitbase/flags';
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
 * Hook to get a boolean feature flag value
 *
 * @param flagKey - The key of the feature flag
 * @param options - Options for evaluation context and behavior
 * @returns The flag value and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: isDarkMode, isLoading } = useBooleanFlag('dark-mode', {
 *     context: { targetingKey: userId, plan: 'premium' }
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   return <App theme={isDarkMode ? 'dark' : 'light'} />;
 * }
 * ```
 */
export function useBooleanFlag(
  flagKey: string,
  options?: UseFlagOptions,
): UseFlagResult<boolean> {
  return useTypedFlag(flagKey, 'boolean', options);
}

/**
 * Hook to get a string feature flag value
 *
 * @param flagKey - The key of the feature flag
 * @param options - Options for evaluation context and behavior
 * @returns The flag value and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: variant } = useStringFlag('checkout-variant', {
 *     context: { targetingKey: userId }
 *   });
 *
 *   return <Checkout variant={variant} />;
 * }
 * ```
 */
export function useStringFlag(
  flagKey: string,
  options?: UseFlagOptions,
): UseFlagResult<string> {
  return useTypedFlag(flagKey, 'string', options);
}

/**
 * Hook to get a number feature flag value
 *
 * @param flagKey - The key of the feature flag
 * @param options - Options for evaluation context and behavior
 * @returns The flag value and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: maxItems } = useNumberFlag('max-cart-items', {
 *     context: { targetingKey: userId }
 *   });
 *
 *   return <Cart maxItems={maxItems} />;
 * }
 * ```
 */
export function useNumberFlag(
  flagKey: string,
  options?: UseFlagOptions,
): UseFlagResult<number> {
  return useTypedFlag(flagKey, 'number', options);
}

/**
 * Hook to get a JSON feature flag value
 *
 * @param flagKey - The key of the feature flag
 * @param options - Options for evaluation context and behavior
 * @returns The flag value and state
 *
 * @example
 * ```tsx
 * interface FeatureConfig {
 *   enabled: boolean;
 *   theme: string;
 *   maxItems: number;
 * }
 *
 * function MyComponent() {
 *   const { data: config } = useJsonFlag<FeatureConfig>(
 *     'feature-config',
 *     { context: { targetingKey: userId } }
 *   );
 *
 *   return <Feature config={config} />;
 * }
 * ```
 */
export function useJsonFlag<T extends JsonValue = JsonValue>(
  flagKey: string,
  options?: UseFlagOptions,
): UseFlagResult<T> {
  return useTypedFlag(flagKey, 'json', options);
}

/**
 * Internal hook for typed flag values
 */
function useTypedFlag<T extends boolean | string | number | JsonValue>(
  flagKey: string,
  type: 'boolean' | 'string' | 'number' | 'json',
  options?: UseFlagOptions,
): UseFlagResult<T> {
  const flags = useFlagsContext();
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contextRef = useRef(options?.context);
  const refetchOnContextChange = options?.refetchOnContextChange ?? true;

  const fetchFlag = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let value: T;

      switch (type) {
        case 'boolean':
          value = (await flags.getBooleanValue(
            flagKey,
            options?.context,
          )) as T;
          break;
        case 'string':
          value = (await flags.getStringValue(
            flagKey,
            options?.context,
          )) as T;
          break;
        case 'number':
          value = (await flags.getNumberValue(
            flagKey,
            options?.context,
          )) as T;
          break;
        case 'json':
          value = (await flags.getJsonValue(
            flagKey,
            options?.context,
          )) as T;
          break;
      }

      setData(value);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [flags, flagKey, type, options?.context]);

  useEffect(() => {
    // Check if context changed
    if (
      refetchOnContextChange &&
      !contextEqual(contextRef.current, options?.context)
    ) {
      contextRef.current = options?.context;
      fetchFlag();
    }
  }, [options?.context, refetchOnContextChange, fetchFlag]);



  useEffect(() => {
    // If client is already ready, fetch immediately
    if (flags.isReady()) {
      fetchFlag();
    }

    // Listen for ready event (initial load)
    const unsubscribeReady = flags.on((event) => {
      if (event.type === 'ready') {
        fetchFlag();
      }
    });

    // Listen for flag changes - only refetch when this specific flag changes
    const { unsubscribe: unsubscribeFlagChange } = flags.onFlagChange((changedFlags) => {
      if (flagKey in changedFlags) {
        fetchFlag();
      }
    });

    return () => {
      unsubscribeReady();
      unsubscribeFlagChange();
    };
  }, [flags, flagKey, fetchFlag]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchFlag,
  };
}

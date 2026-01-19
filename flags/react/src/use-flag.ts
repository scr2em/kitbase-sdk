import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  EvaluationContext,
  ResolutionDetails,
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
 * Hook to get full resolution details for a boolean feature flag
 *
 * @param flagKey - The key of the feature flag
 * @param options - Options for evaluation context and behavior
 * @returns The full resolution details and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: details } = useBooleanFlagDetails('feature-x', {
 *     context: { targetingKey: userId }
 *   });
 *
 *   console.log(details?.reason, details?.variant);
 *   return <Feature enabled={details?.value ?? false} />;
 * }
 * ```
 */
export function useBooleanFlagDetails(
  flagKey: string,
  options?: UseFlagOptions,
): UseFlagResult<ResolutionDetails<boolean>> {
  return useFlagDetailsInternal(
    flagKey,
    (flags, key, ctx) => flags.getBooleanDetails(key, ctx),
    options,
  );
}

/**
 * Hook to get full resolution details for a string feature flag
 *
 * @param flagKey - The key of the feature flag
 * @param options - Options for evaluation context and behavior
 * @returns The full resolution details and state
 */
export function useStringFlagDetails(
  flagKey: string,
  options?: UseFlagOptions,
): UseFlagResult<ResolutionDetails<string>> {
  return useFlagDetailsInternal(
    flagKey,
    (flags, key, ctx) => flags.getStringDetails(key, ctx),
    options,
  );
}

/**
 * Hook to get full resolution details for a number feature flag
 *
 * @param flagKey - The key of the feature flag
 * @param options - Options for evaluation context and behavior
 * @returns The full resolution details and state
 */
export function useNumberFlagDetails(
  flagKey: string,
  options?: UseFlagOptions,
): UseFlagResult<ResolutionDetails<number>> {
  return useFlagDetailsInternal(
    flagKey,
    (flags, key, ctx) => flags.getNumberDetails(key, ctx),
    options,
  );
}

/**
 * Hook to get full resolution details for a JSON feature flag
 *
 * @param flagKey - The key of the feature flag
 * @param options - Options for evaluation context and behavior
 * @returns The full resolution details and state
 */
export function useJsonFlagDetails<T extends JsonValue = JsonValue>(
  flagKey: string,
  options?: UseFlagOptions,
): UseFlagResult<ResolutionDetails<T>> {
  return useFlagDetailsInternal(
    flagKey,
    (flags, key, ctx) => flags.getJsonDetails(key, ctx) as Promise<ResolutionDetails<T>>,
    options,
  );
}

/**
 * Internal hook for flag details
 */
function useFlagDetailsInternal<T>(
  flagKey: string,
  fetcher: (flags: ReturnType<typeof useFlagsContext>, key: string, context?: EvaluationContext) => Promise<ResolutionDetails<T>>,
  options?: UseFlagOptions,
): UseFlagResult<ResolutionDetails<T>> {
  const flags = useFlagsContext();
  const [data, setData] = useState<ResolutionDetails<T> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contextRef = useRef(options?.context);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const refetchOnContextChange = options?.refetchOnContextChange ?? true;

  const fetchFlag = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current(flags, flagKey, options?.context);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [flags, flagKey, options?.context]);

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
    fetchFlag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagKey]);

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

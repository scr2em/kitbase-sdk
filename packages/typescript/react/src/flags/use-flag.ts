import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  EvaluationContext,
  ResolutionDetails,
  JsonValue,
} from '@kitbase/sdk/flags';
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
 * @param defaultValue - Default value to return while loading or on error
 * @param options - Options for evaluation context and behavior
 * @returns The flag value and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: isDarkMode, isLoading } = useBooleanFlag('dark-mode', false, {
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
  defaultValue: boolean,
  options?: UseFlagOptions,
): UseFlagResult<boolean> {
  return useTypedFlag(
    flagKey,
    defaultValue,
    'boolean',
    options,
  );
}

/**
 * Hook to get a string feature flag value
 *
 * @param flagKey - The key of the feature flag
 * @param defaultValue - Default value to return while loading or on error
 * @param options - Options for evaluation context and behavior
 * @returns The flag value and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: variant } = useStringFlag('checkout-variant', 'control', {
 *     context: { targetingKey: userId }
 *   });
 *
 *   return <Checkout variant={variant} />;
 * }
 * ```
 */
export function useStringFlag(
  flagKey: string,
  defaultValue: string,
  options?: UseFlagOptions,
): UseFlagResult<string> {
  return useTypedFlag(flagKey, defaultValue, 'string', options);
}

/**
 * Hook to get a number feature flag value
 *
 * @param flagKey - The key of the feature flag
 * @param defaultValue - Default value to return while loading or on error
 * @param options - Options for evaluation context and behavior
 * @returns The flag value and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: maxItems } = useNumberFlag('max-cart-items', 10, {
 *     context: { targetingKey: userId }
 *   });
 *
 *   return <Cart maxItems={maxItems} />;
 * }
 * ```
 */
export function useNumberFlag(
  flagKey: string,
  defaultValue: number,
  options?: UseFlagOptions,
): UseFlagResult<number> {
  return useTypedFlag(flagKey, defaultValue, 'number', options);
}

/**
 * Hook to get a JSON feature flag value
 *
 * @param flagKey - The key of the feature flag
 * @param defaultValue - Default value to return while loading or on error
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
 *     { enabled: false, theme: 'light', maxItems: 5 },
 *     { context: { targetingKey: userId } }
 *   );
 *
 *   return <Feature config={config} />;
 * }
 * ```
 */
export function useJsonFlag<T extends JsonValue = JsonValue>(
  flagKey: string,
  defaultValue: T,
  options?: UseFlagOptions,
): UseFlagResult<T> {
  return useTypedFlag(flagKey, defaultValue, 'json', options);
}

/**
 * Hook to get full resolution details for a feature flag
 *
 * @param flagKey - The key of the feature flag
 * @param defaultValue - Default value to return while loading or on error
 * @param options - Options for evaluation context and behavior
 * @returns The full resolution details and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: details } = useFlagDetails('feature-x', false, {
 *     context: { targetingKey: userId }
 *   });
 *
 *   console.log(details?.reason, details?.variant);
 *   return <Feature enabled={details?.value ?? false} />;
 * }
 * ```
 */
export function useFlagDetails<T extends boolean | string | number | JsonValue>(
  flagKey: string,
  defaultValue: T,
  options?: UseFlagOptions,
): UseFlagResult<ResolutionDetails<T>> {
  const flags = useFlagsContext();
  const [data, setData] = useState<ResolutionDetails<T> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contextRef = useRef(options?.context);
  const refetchOnContextChange = options?.refetchOnContextChange ?? true;

  const fetchFlag = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const type = typeof defaultValue;
      let result: ResolutionDetails<T>;

      if (type === 'boolean') {
        result = (await flags.getBooleanDetails(
          flagKey,
          defaultValue as boolean,
          options?.context,
        )) as ResolutionDetails<T>;
      } else if (type === 'string') {
        result = (await flags.getStringDetails(
          flagKey,
          defaultValue as string,
          options?.context,
        )) as ResolutionDetails<T>;
      } else if (type === 'number') {
        result = (await flags.getNumberDetails(
          flagKey,
          defaultValue as number,
          options?.context,
        )) as ResolutionDetails<T>;
      } else {
        result = (await flags.getJsonDetails(
          flagKey,
          defaultValue as JsonValue,
          options?.context,
        )) as ResolutionDetails<T>;
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [flags, flagKey, defaultValue, options?.context]);

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
  defaultValue: T,
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
            defaultValue as boolean,
            options?.context,
          )) as T;
          break;
        case 'string':
          value = (await flags.getStringValue(
            flagKey,
            defaultValue as string,
            options?.context,
          )) as T;
          break;
        case 'number':
          value = (await flags.getNumberValue(
            flagKey,
            defaultValue as number,
            options?.context,
          )) as T;
          break;
        case 'json':
          value = (await flags.getJsonValue(
            flagKey,
            defaultValue as JsonValue,
            options?.context,
          )) as T;
          break;
      }

      setData(value);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [flags, flagKey, defaultValue, type, options?.context]);

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

  return {
    data,
    isLoading,
    error,
    refetch: fetchFlag,
  };
}

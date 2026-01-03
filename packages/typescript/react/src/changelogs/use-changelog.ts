import { useState, useEffect, useCallback } from 'react';
import type { ChangelogResponse } from '@kitbase/sdk/changelogs';
import { useChangelogsContext } from './context.js';
import type { AsyncState, UseChangelogOptions } from './types.js';

export interface UseChangelogResult extends AsyncState<ChangelogResponse> {
  /**
   * Refetch the changelog
   */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a changelog by version
 *
 * @param version - The version string to fetch (e.g., "1.0.0")
 * @param options - Options for the hook behavior
 * @returns The changelog data and state
 *
 * @example
 * ```tsx
 * function ChangelogPage() {
 *   const { data: changelog, isLoading, error } = useChangelog('2.0.0');
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   if (!changelog) return null;
 *
 *   return (
 *     <div>
 *       <h1>Version {changelog.version}</h1>
 *       <ReactMarkdown>{changelog.markdown}</ReactMarkdown>
 *     </div>
 *   );
 * }
 * ```
 */
export function useChangelog(
  version: string,
  options?: UseChangelogOptions,
): UseChangelogResult {
  const changelogs = useChangelogsContext();
  const [data, setData] = useState<ChangelogResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const enabled = options?.enabled ?? true;

  const fetchChangelog = useCallback(async () => {
    if (!version) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const changelog = await changelogs.get(version);
      setData(changelog);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [changelogs, version]);

  useEffect(() => {
    if (enabled) {
      fetchChangelog();
    }
  }, [enabled, fetchChangelog]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchChangelog,
  };
}

/**
 * Hook to lazily fetch a changelog by version
 *
 * @returns A function to fetch the changelog and the state
 *
 * @example
 * ```tsx
 * function ChangelogButton() {
 *   const { fetch, data, isLoading, error } = useLazyChangelog();
 *
 *   return (
 *     <div>
 *       <button onClick={() => fetch('2.0.0')} disabled={isLoading}>
 *         Load Changelog
 *       </button>
 *       {data && <ReactMarkdown>{data.markdown}</ReactMarkdown>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLazyChangelog(): {
  fetch: (version: string) => Promise<ChangelogResponse | undefined>;
  data: ChangelogResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
} {
  const changelogs = useChangelogsContext();
  const [data, setData] = useState<ChangelogResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchChangelog = useCallback(
    async (version: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const changelog = await changelogs.get(version);
        setData(changelog);
        return changelog;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [changelogs],
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
  }, []);

  return {
    fetch: fetchChangelog,
    data,
    isLoading,
    error,
    reset,
  };
}

import { useMemo, type ReactNode } from 'react';
import { FlagsClient } from '@kitbase/sdk/flags';
import { FlagsContext } from './context.js';

export interface FlagsProviderProps {
  /**
   * Your Kitbase API token
   */
  token: string;
  children: ReactNode;
}

/**
 * Provider for feature flags functionality.
 *
 * @example
 * ```tsx
 * import { FlagsProvider } from '@kitbase/react/flags';
 *
 * function App() {
 *   return (
 *     <FlagsProvider token="your-api-token">
 *       <YourApp />
 *     </FlagsProvider>
 *   );
 * }
 * ```
 */
export function FlagsProvider({ token, children }: FlagsProviderProps) {
  const client = useMemo(() => new FlagsClient({ token }), [token]);

  return (
    <FlagsContext.Provider value={client}>{children}</FlagsContext.Provider>
  );
}

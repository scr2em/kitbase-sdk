import { useMemo, type ReactNode } from 'react';
import { Changelogs } from '@kitbase/sdk/changelogs';
import { ChangelogsContext } from './context.js';

export interface ChangelogsProviderProps {
  /**
   * Your Kitbase API token
   */
  token: string;
  children: ReactNode;
}

/**
 * Provider for changelogs functionality.
 *
 * @example
 * ```tsx
 * import { ChangelogsProvider } from '@kitbase/react/changelogs';
 *
 * function App() {
 *   return (
 *     <ChangelogsProvider token="your-api-token">
 *       <YourApp />
 *     </ChangelogsProvider>
 *   );
 * }
 * ```
 */
export function ChangelogsProvider({ token, children }: ChangelogsProviderProps) {
  const client = useMemo(() => new Changelogs({ token }), [token]);

  return (
    <ChangelogsContext.Provider value={client}>
      {children}
    </ChangelogsContext.Provider>
  );
}




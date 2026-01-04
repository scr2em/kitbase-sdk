import { useMemo, type ReactNode } from 'react';
import { Kitbase } from '@kitbase/sdk/events';
import { EventsContext } from './context.js';

export interface EventsProviderProps {
  /**
   * Your Kitbase API token
   */
  token: string;
  children: ReactNode;
}

/**
 * Provider for event tracking functionality.
 *
 * @example
 * ```tsx
 * import { EventsProvider } from '@kitbase/react/events';
 *
 * function App() {
 *   return (
 *     <EventsProvider token="your-api-token">
 *       <YourApp />
 *     </EventsProvider>
 *   );
 * }
 * ```
 */
export function EventsProvider({ token, children }: EventsProviderProps) {
  const client = useMemo(() => new Kitbase({ token }), [token]);

  return (
    <EventsContext.Provider value={client}>{children}</EventsContext.Provider>
  );
}




import { useMemo, type ReactNode } from 'react';
import { FlagsClient, FlagsConfig} from '@kitbase/sdk/flags';
import { FlagsContext } from './context.js';

export type  FlagsProviderProps =  {  
  children: ReactNode;
  config: FlagsConfig
} ;

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
export function FlagsProvider({  children, config }: FlagsProviderProps) {
  const client = useMemo(() => new FlagsClient(config), [config]);

  return (
    <FlagsContext.Provider value={client}>{children}</FlagsContext.Provider>
  );
}

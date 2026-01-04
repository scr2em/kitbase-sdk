import { createContext, useContext } from 'react';
import type { FlagsClient } from '@kitbase/sdk/flags';

export const FlagsContext = createContext<FlagsClient | null>(null);

export function useFlagsContext(): FlagsClient {
  const context = useContext(FlagsContext);

  if (!context) {
    throw new Error(
      'useFlagsContext must be used within a FlagsProvider. ' +
        'Wrap your component with <FlagsProvider token="your-token">',
    );
  }

  return context;
}



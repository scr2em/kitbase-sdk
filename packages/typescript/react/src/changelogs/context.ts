import { createContext, useContext } from 'react';
import type { Changelogs } from '@kitbase/sdk/changelogs';

export const ChangelogsContext = createContext<Changelogs | null>(null);

export function useChangelogsContext(): Changelogs {
  const context = useContext(ChangelogsContext);

  if (!context) {
    throw new Error(
      'useChangelogsContext must be used within a ChangelogsProvider. ' +
        'Wrap your component with <ChangelogsProvider token="your-token">',
    );
  }

  return context;
}


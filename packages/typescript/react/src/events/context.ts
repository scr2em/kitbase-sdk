import { createContext, useContext } from 'react';
import type { Kitbase } from '@kitbase/sdk/events';

export const EventsContext = createContext<Kitbase | null>(null);

export function useEventsContext(): Kitbase {
  const context = useContext(EventsContext);

  if (!context) {
    throw new Error(
      'useEventsContext must be used within an EventsProvider. ' +
        'Wrap your component with <EventsProvider token="your-token">',
    );
  }

  return context;
}



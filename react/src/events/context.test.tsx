import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { EventsContext, useEventsContext } from './context';
import type { Kitbase } from '@kitbase/sdk/events';

describe('EventsContext', () => {
  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useEventsContext());
    }).toThrow(
      'useEventsContext must be used within an EventsProvider. Wrap your component with <EventsProvider token="your-token">'
    );
  });

  it('should return client when used within provider', () => {
    const mockClient = {
      track: vi.fn(),
      getAnonymousId: vi.fn().mockReturnValue('anon-123'),
    } as unknown as Kitbase;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EventsContext.Provider value={mockClient}>
        {children}
      </EventsContext.Provider>
    );

    const { result } = renderHook(() => useEventsContext(), { wrapper });
    expect(result.current).toBe(mockClient);
  });
});

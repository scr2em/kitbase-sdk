import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { FlagsContext, useFlagsContext } from './context';
import type { FlagsClient } from '@kitbase/flags';

describe('FlagsContext', () => {
  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useFlagsContext());
    }).toThrow(
      'useFlagsContext must be used within a FlagsProvider. Wrap your component with <FlagsProvider config={{ sdkKey: "your-sdk-key" }}>'
    );
  });

  it('should return client when used within provider', () => {
    const mockClient = {
      getBooleanValue: vi.fn(),
      isReady: vi.fn().mockReturnValue(true),
      on: vi.fn(),
    } as unknown as FlagsClient;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlagsContext.Provider value={mockClient}>
        {children}
      </FlagsContext.Provider>
    );

    const { result } = renderHook(() => useFlagsContext(), { wrapper });
    expect(result.current).toBe(mockClient);
  });
});

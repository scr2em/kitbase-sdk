import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { ChangelogsContext, useChangelogsContext } from './context';
import type { Changelogs } from '@kitbase/sdk/changelogs';

describe('ChangelogsContext', () => {
  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useChangelogsContext());
    }).toThrow(
      'useChangelogsContext must be used within a ChangelogsProvider. Wrap your component with <ChangelogsProvider token="your-token">'
    );
  });

  it('should return client when used within provider', () => {
    const mockClient = {
      get: vi.fn(),
    } as unknown as Changelogs;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChangelogsContext.Provider value={mockClient}>
        {children}
      </ChangelogsContext.Provider>
    );

    const { result } = renderHook(() => useChangelogsContext(), { wrapper });
    expect(result.current).toBe(mockClient);
  });
});

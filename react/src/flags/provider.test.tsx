import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FlagsProvider } from './provider';
import { useFlagsContext } from './context';

vi.mock('@kitbase/sdk/flags', () => ({
  FlagsClient: vi.fn().mockImplementation((config) => ({
    config,
    getBooleanValue: vi.fn(),
    isReady: vi.fn().mockReturnValue(true),
    on: vi.fn(),
  })),
}));

describe('FlagsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <FlagsProvider config={{ token: 'test-token' }}>
        <div data-testid="child">Child Component</div>
      </FlagsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('should provide FlagsClient to children', () => {
    const TestComponent = () => {
      const client = useFlagsContext();
      return <div data-testid="has-client">{client ? 'has-client' : 'no-client'}</div>;
    };

    render(
      <FlagsProvider config={{ token: 'test-token' }}>
        <TestComponent />
      </FlagsProvider>
    );

    expect(screen.getByText('has-client')).toBeInTheDocument();
  });

  it('should create FlagsClient with provided config', async () => {
    const { FlagsClient } = await import('@kitbase/sdk/flags');

    render(
      <FlagsProvider config={{ token: 'my-api-token', enableLocalEvaluation: true }}>
        <div>Child</div>
      </FlagsProvider>
    );

    expect(FlagsClient).toHaveBeenCalledWith({
      token: 'my-api-token',
      enableLocalEvaluation: true,
    });
  });

  it('should memoize client instance', () => {
    const TestComponent = () => {
      const client = useFlagsContext();
      return <div data-testid="client">{JSON.stringify(client.config)}</div>;
    };

    const { rerender } = render(
      <FlagsProvider config={{ token: 'test-token' }}>
        <TestComponent />
      </FlagsProvider>
    );

    const firstRender = screen.getByTestId('client').textContent;

    rerender(
      <FlagsProvider config={{ token: 'test-token' }}>
        <TestComponent />
      </FlagsProvider>
    );

    const secondRender = screen.getByTestId('client').textContent;
    expect(firstRender).toBe(secondRender);
  });
});

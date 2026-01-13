import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ChangelogsProvider } from './provider';
import { useChangelogsContext } from './context';

vi.mock('@kitbase/sdk/changelogs', () => ({
  Changelogs: vi.fn().mockImplementation((config) => ({
    config,
    get: vi.fn(),
  })),
}));

describe('ChangelogsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <ChangelogsProvider token="test-token">
        <div data-testid="child">Child Component</div>
      </ChangelogsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('should provide Changelogs client to children', () => {
    const TestComponent = () => {
      const client = useChangelogsContext();
      return <div data-testid="has-client">{client ? 'has-client' : 'no-client'}</div>;
    };

    render(
      <ChangelogsProvider token="test-token">
        <TestComponent />
      </ChangelogsProvider>
    );

    expect(screen.getByText('has-client')).toBeInTheDocument();
  });

  it('should create Changelogs client with provided token', async () => {
    const { Changelogs } = await import('@kitbase/sdk/changelogs');

    render(
      <ChangelogsProvider token="my-api-token">
        <div>Child</div>
      </ChangelogsProvider>
    );

    expect(Changelogs).toHaveBeenCalledWith({
      token: 'my-api-token',
    });
  });

  it('should memoize client instance', () => {
    const TestComponent = () => {
      const client = useChangelogsContext();
      return <div data-testid="client">{JSON.stringify(client.config)}</div>;
    };

    const { rerender } = render(
      <ChangelogsProvider token="test-token">
        <TestComponent />
      </ChangelogsProvider>
    );

    const firstRender = screen.getByTestId('client').textContent;

    rerender(
      <ChangelogsProvider token="test-token">
        <TestComponent />
      </ChangelogsProvider>
    );

    const secondRender = screen.getByTestId('client').textContent;
    expect(firstRender).toBe(secondRender);
  });
});

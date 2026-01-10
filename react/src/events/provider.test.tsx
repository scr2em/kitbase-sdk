import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { EventsProvider } from './provider';
import { useEventsContext } from './context';

vi.mock('@kitbase/sdk/events', () => ({
  Kitbase: vi.fn().mockImplementation((config) => ({
    config,
    track: vi.fn(),
    getAnonymousId: vi.fn().mockReturnValue('anon-123'),
  })),
}));

describe('EventsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <EventsProvider token="test-token">
        <div data-testid="child">Child Component</div>
      </EventsProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('should provide Kitbase client to children', () => {
    const TestComponent = () => {
      const client = useEventsContext();
      return <div data-testid="has-client">{client ? 'has-client' : 'no-client'}</div>;
    };

    render(
      <EventsProvider token="test-token">
        <TestComponent />
      </EventsProvider>
    );

    expect(screen.getByText('has-client')).toBeInTheDocument();
  });

  it('should create Kitbase client with provided token', async () => {
    const { Kitbase } = await import('@kitbase/sdk/events');

    render(
      <EventsProvider token="my-api-token">
        <div>Child</div>
      </EventsProvider>
    );

    expect(Kitbase).toHaveBeenCalledWith({
      token: 'my-api-token',
      baseUrl: undefined,
    });
  });

  it('should create Kitbase client with provided baseUrl', async () => {
    const { Kitbase } = await import('@kitbase/sdk/events');

    render(
      <EventsProvider token="my-api-token" baseUrl="https://custom.api.com">
        <div>Child</div>
      </EventsProvider>
    );

    expect(Kitbase).toHaveBeenCalledWith({
      token: 'my-api-token',
      baseUrl: 'https://custom.api.com',
    });
  });

  it('should memoize client instance', () => {
    const TestComponent = () => {
      const client = useEventsContext();
      return <div data-testid="client">{JSON.stringify(client.config)}</div>;
    };

    const { rerender } = render(
      <EventsProvider token="test-token">
        <TestComponent />
      </EventsProvider>
    );

    const firstRender = screen.getByTestId('client').textContent;

    rerender(
      <EventsProvider token="test-token">
        <TestComponent />
      </EventsProvider>
    );

    const secondRender = screen.getByTestId('client').textContent;
    expect(firstRender).toBe(secondRender);
  });
});

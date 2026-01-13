import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { EventsContext } from './context';
import { useTrack, useTrackChannel } from './use-track';
import type { Kitbase, TrackResponse } from '@kitbase/sdk/events';

const mockTrackResponse: TrackResponse = {
  success: true,
  id: 'log-123',
};

const createMockClient = (overrides: Partial<Kitbase> = {}) => ({
  track: vi.fn().mockResolvedValue(mockTrackResponse),
  getAnonymousId: vi.fn().mockReturnValue('anon-123'),
  ...overrides,
} as unknown as Kitbase);

const createWrapper = (client: Kitbase) => {
  return ({ children }: { children: React.ReactNode }) => (
    <EventsContext.Provider value={client}>
      {children}
    </EventsContext.Provider>
  );
};

describe('useTrack', () => {
  let mockClient: Kitbase;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(
      () => useTrack(),
      { wrapper: createWrapper(mockClient) }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.track).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should track events successfully', async () => {
    const { result } = renderHook(
      () => useTrack(),
      { wrapper: createWrapper(mockClient) }
    );

    const trackOptions = {
      channel: 'payments',
      event: 'Purchase Completed',
      user_id: 'user-123',
      icon: '💰',
      tags: { amount: 99.99 },
    };

    let response: TrackResponse | undefined;
    await act(async () => {
      response = await result.current.track(trackOptions);
    });

    expect(response).toEqual(mockTrackResponse);
    expect(result.current.data).toEqual(mockTrackResponse);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockClient.track).toHaveBeenCalledWith(trackOptions);
  });

  it('should set loading state during tracking', async () => {
    let resolveTrack: (value: TrackResponse) => void = () => {};
    mockClient = createMockClient({
      track: vi.fn().mockImplementation(() => new Promise((resolve) => {
        resolveTrack = resolve;
      })),
    });

    const { result } = renderHook(
      () => useTrack(),
      { wrapper: createWrapper(mockClient) }
    );

    act(() => {
      result.current.track({ channel: 'test', event: 'Test Event' });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveTrack(mockTrackResponse);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Network Error');
    mockClient = createMockClient({
      track: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useTrack(),
      { wrapper: createWrapper(mockClient) }
    );

    let response: TrackResponse | undefined;
    await act(async () => {
      response = await result.current.track({ channel: 'test', event: 'Test Event' });
    });

    expect(response).toBeUndefined();
    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    mockClient = createMockClient({
      track: vi.fn().mockRejectedValue('string error'),
    });

    const { result } = renderHook(
      () => useTrack(),
      { wrapper: createWrapper(mockClient) }
    );

    await act(async () => {
      await result.current.track({ channel: 'test', event: 'Test Event' });
    });

    expect(result.current.error?.message).toBe('string error');
  });

  it('should reset state', async () => {
    const { result } = renderHook(
      () => useTrack(),
      { wrapper: createWrapper(mockClient) }
    );

    // First, track an event to populate state
    await act(async () => {
      await result.current.track({ channel: 'test', event: 'Test Event' });
    });

    expect(result.current.data).toEqual(mockTrackResponse);

    // Reset state
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should reset error state', async () => {
    const error = new Error('Network Error');
    mockClient = createMockClient({
      track: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useTrack(),
      { wrapper: createWrapper(mockClient) }
    );

    await act(async () => {
      await result.current.track({ channel: 'test', event: 'Test Event' });
    });

    expect(result.current.error).toEqual(error);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });

  it('should clear error on new track call', async () => {
    const error = new Error('Network Error');
    let shouldError = true;
    mockClient = createMockClient({
      track: vi.fn().mockImplementation(() => {
        if (shouldError) {
          return Promise.reject(error);
        }
        return Promise.resolve(mockTrackResponse);
      }),
    });

    const { result } = renderHook(
      () => useTrack(),
      { wrapper: createWrapper(mockClient) }
    );

    // First call fails
    await act(async () => {
      await result.current.track({ channel: 'test', event: 'Test Event' });
    });

    expect(result.current.error).toEqual(error);

    // Second call succeeds
    shouldError = false;
    await act(async () => {
      await result.current.track({ channel: 'test', event: 'Test Event 2' });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(mockTrackResponse);
  });
});

describe('useTrackChannel', () => {
  let mockClient: Kitbase;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(
      () => useTrackChannel('payments'),
      { wrapper: createWrapper(mockClient) }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.trackChannel).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should track events with pre-configured channel', async () => {
    const { result } = renderHook(
      () => useTrackChannel('payments'),
      { wrapper: createWrapper(mockClient) }
    );

    const trackOptions = {
      event: 'Purchase Completed',
      user_id: 'user-123',
      icon: '💰',
      tags: { amount: 99.99 },
    };

    let response: TrackResponse | undefined;
    await act(async () => {
      response = await result.current.trackChannel(trackOptions);
    });

    expect(response).toEqual(mockTrackResponse);
    expect(result.current.data).toEqual(mockTrackResponse);
    expect(mockClient.track).toHaveBeenCalledWith({
      ...trackOptions,
      channel: 'payments',
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Network Error');
    mockClient = createMockClient({
      track: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useTrackChannel('payments'),
      { wrapper: createWrapper(mockClient) }
    );

    let response: TrackResponse | undefined;
    await act(async () => {
      response = await result.current.trackChannel({ event: 'Test Event' });
    });

    expect(response).toBeUndefined();
    expect(result.current.error).toEqual(error);
    expect(result.current.isLoading).toBe(false);
  });

  it('should reset state', async () => {
    const { result } = renderHook(
      () => useTrackChannel('payments'),
      { wrapper: createWrapper(mockClient) }
    );

    await act(async () => {
      await result.current.trackChannel({ event: 'Test Event' });
    });

    expect(result.current.data).toEqual(mockTrackResponse);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should use different channels for different hooks', async () => {
    const { result: result1 } = renderHook(
      () => useTrackChannel('payments'),
      { wrapper: createWrapper(mockClient) }
    );

    const { result: result2 } = renderHook(
      () => useTrackChannel('signups'),
      { wrapper: createWrapper(mockClient) }
    );

    await act(async () => {
      await result1.current.trackChannel({ event: 'Payment Made' });
    });

    await act(async () => {
      await result2.current.trackChannel({ event: 'User Signed Up' });
    });

    expect(mockClient.track).toHaveBeenCalledWith({
      event: 'Payment Made',
      channel: 'payments',
    });

    expect(mockClient.track).toHaveBeenCalledWith({
      event: 'User Signed Up',
      channel: 'signups',
    });
  });

  it('should update trackChannel function when channel changes', async () => {
    const { result, rerender } = renderHook(
      ({ channel }) => useTrackChannel(channel),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { channel: 'channel-1' },
      }
    );

    await act(async () => {
      await result.current.trackChannel({ event: 'Event 1' });
    });

    expect(mockClient.track).toHaveBeenCalledWith({
      event: 'Event 1',
      channel: 'channel-1',
    });

    vi.clearAllMocks();

    rerender({ channel: 'channel-2' });

    await act(async () => {
      await result.current.trackChannel({ event: 'Event 2' });
    });

    expect(mockClient.track).toHaveBeenCalledWith({
      event: 'Event 2',
      channel: 'channel-2',
    });
  });
});

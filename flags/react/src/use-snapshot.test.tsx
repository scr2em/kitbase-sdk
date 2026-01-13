import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { FlagsContext } from './context';
import { useFlagSnapshot } from './use-snapshot';
import type { FlagsClient, FlagSnapshot } from '@kitbase/sdk/flags';

const mockSnapshot: FlagSnapshot = {
  projectId: 'project-123',
  environmentId: 'env-123',
  evaluatedAt: '2024-01-01T00:00:00Z',
  flags: [
    {
      flagKey: 'test-flag',
      value: true,
      valueType: 'boolean',
      enabled: true,
      reason: 'STATIC',
      variant: 'on',
    },
  ],
};

const createMockClient = (overrides: Partial<FlagsClient> = {}) => ({
  getSnapshot: vi.fn().mockResolvedValue(mockSnapshot),
  isReady: vi.fn().mockReturnValue(true),
  on: vi.fn().mockReturnValue(() => {}),
  ...overrides,
} as unknown as FlagsClient);

const createWrapper = (client: FlagsClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <FlagsContext.Provider value={client}>
      {children}
    </FlagsContext.Provider>
  );
};

describe('useFlagSnapshot', () => {
  let mockClient: FlagsClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch snapshot on mount when ready', async () => {
    const { result } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSnapshot);
    expect(result.current.error).toBeNull();
    expect(mockClient.getSnapshot).toHaveBeenCalledWith({
      context: undefined,
    });
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123', plan: 'premium' };
    const { result } = renderHook(
      () => useFlagSnapshot({ context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getSnapshot).toHaveBeenCalledWith({
      context,
    });
  });

  it('should handle errors', async () => {
    const error = new Error('API Error');
    mockClient = createMockClient({
      getSnapshot: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle non-Error exceptions', async () => {
    mockClient = createMockClient({
      getSnapshot: vi.fn().mockRejectedValue('string error'),
    });

    const { result } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('string error');
  });

  it('should refetch when context changes (default behavior)', async () => {
    const { result, rerender } = renderHook(
      ({ context }) => useFlagSnapshot({ context }),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { context: { targetingKey: 'user-1' } },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.clearAllMocks();

    rerender({ context: { targetingKey: 'user-2' } });

    await waitFor(() => {
      expect(mockClient.getSnapshot).toHaveBeenCalledWith({
        context: { targetingKey: 'user-2' },
      });
    });
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    expect((mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should refetch on configurationChanged event', async () => {
    let eventCallback: (event: { type: string }) => void = () => {};
    mockClient = createMockClient({
      on: vi.fn().mockImplementation((cb) => {
        eventCallback = cb;
        return () => {};
      }),
    });

    const { result } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      eventCallback({ type: 'configurationChanged' });
    });

    await waitFor(() => {
      expect((mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should refetch on ready event', async () => {
    let eventCallback: (event: { type: string }) => void = () => {};
    mockClient = createMockClient({
      isReady: vi.fn().mockReturnValue(false),
      on: vi.fn().mockImplementation((cb) => {
        eventCallback = cb;
        return () => {};
      }),
    });

    const { result } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    const initialCallCount = (mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      eventCallback({ type: 'ready' });
    });

    await waitFor(() => {
      expect((mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should unsubscribe from events on unmount', async () => {
    const unsubscribe = vi.fn();
    mockClient = createMockClient({
      on: vi.fn().mockReturnValue(unsubscribe),
    });

    const { unmount } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(mockClient.on).toHaveBeenCalled();
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should ignore other event types', async () => {
    let eventCallback: (event: { type: string }) => void = () => {};
    mockClient = createMockClient({
      on: vi.fn().mockImplementation((cb) => {
        eventCallback = cb;
        return () => {};
      }),
    });

    const { result } = renderHook(
      () => useFlagSnapshot(),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callCount = (mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      eventCallback({ type: 'error' });
    });

    // Should not trigger refetch
    expect((mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should handle context equal when both are undefined', async () => {
    const { result, rerender } = renderHook(
      ({ context }) => useFlagSnapshot({ context }),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { context: undefined },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callCount = (mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length;

    rerender({ context: undefined });

    // Should not make additional calls for same undefined context
    expect((mockClient.getSnapshot as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should handle context equal when one is undefined', async () => {
    const { result, rerender } = renderHook(
      ({ context }) => useFlagSnapshot({ context }),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { context: { targetingKey: 'user-1' } as { targetingKey: string } | undefined },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.clearAllMocks();

    rerender({ context: undefined });

    await waitFor(() => {
      expect(mockClient.getSnapshot).toHaveBeenCalledWith({
        context: undefined,
      });
    });
  });

});

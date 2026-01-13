import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { FlagsContext } from './context';
import {
  useBooleanFlag,
  useStringFlag,
  useNumberFlag,
  useJsonFlag,
  useFlagDetails,
} from './use-flag';
import type { FlagsClient, ResolutionDetails } from '@kitbase/sdk/flags';

const createMockClient = (overrides: Partial<FlagsClient> = {}) => ({
  getBooleanValue: vi.fn().mockResolvedValue(true),
  getStringValue: vi.fn().mockResolvedValue('test-value'),
  getNumberValue: vi.fn().mockResolvedValue(42),
  getJsonValue: vi.fn().mockResolvedValue({ key: 'value' }),
  getBooleanDetails: vi.fn().mockResolvedValue({
    value: true,
    reason: 'STATIC',
    variant: 'on',
  }),
  getStringDetails: vi.fn().mockResolvedValue({
    value: 'test-value',
    reason: 'STATIC',
    variant: 'variant-a',
  }),
  getNumberDetails: vi.fn().mockResolvedValue({
    value: 42,
    reason: 'STATIC',
    variant: 'variant-1',
  }),
  getJsonDetails: vi.fn().mockResolvedValue({
    value: { key: 'value' },
    reason: 'STATIC',
    variant: 'config-v1',
  }),
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

describe('useBooleanFlag', () => {
  let mockClient: FlagsClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return default value while loading', () => {
    const { result } = renderHook(
      () => useBooleanFlag('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch flag value on mount', async () => {
    const { result } = renderHook(
      () => useBooleanFlag('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
      'test-flag',
      false,
      undefined
    );
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123', plan: 'premium' };
    const { result } = renderHook(
      () => useBooleanFlag('test-flag', false, { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
      'test-flag',
      false,
      context
    );
  });

  it('should handle errors', async () => {
    const error = new Error('API Error');
    mockClient = createMockClient({
      getBooleanValue: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useBooleanFlag('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBe(false); // Returns default value on error
  });

  it('should handle non-Error exceptions', async () => {
    mockClient = createMockClient({
      getBooleanValue: vi.fn().mockRejectedValue('string error'),
    });

    const { result } = renderHook(
      () => useBooleanFlag('test-flag', true),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('string error');
    expect(result.current.data).toBe(true);
  });

  it('should refetch when flagKey changes', async () => {
    const { result, rerender } = renderHook(
      ({ flagKey }) => useBooleanFlag(flagKey, false),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { flagKey: 'flag-1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ flagKey: 'flag-2' });

    await waitFor(() => {
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
        'flag-2',
        false,
        undefined
      );
    });
  });

  it('should refetch when context changes (default behavior)', async () => {
    const { result, rerender } = renderHook(
      ({ context }) => useBooleanFlag('test-flag', false, { context }),
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
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
        'test-flag',
        false,
        { targetingKey: 'user-2' }
      );
    });
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(
      () => useBooleanFlag('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    expect((mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
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
      () => useBooleanFlag('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      eventCallback({ type: 'configurationChanged' });
    });

    await waitFor(() => {
      expect((mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
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
      () => useBooleanFlag('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    const initialCallCount = (mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      eventCallback({ type: 'ready' });
    });

    await waitFor(() => {
      expect((mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should unsubscribe from events on unmount', async () => {
    const unsubscribe = vi.fn();
    mockClient = createMockClient({
      on: vi.fn().mockReturnValue(unsubscribe),
    });

    const { unmount } = renderHook(
      () => useBooleanFlag('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(mockClient.on).toHaveBeenCalled();
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should handle context equal when both are undefined', async () => {
    const { result, rerender } = renderHook(
      ({ context }) => useBooleanFlag('test-flag', false, { context }),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { context: undefined },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callCount = (mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length;

    rerender({ context: undefined });

    // Should not make additional calls for same undefined context
    expect((mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should handle context equal when one is undefined', async () => {
    const { result, rerender } = renderHook(
      ({ context }) => useBooleanFlag('test-flag', false, { context }),
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
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
        'test-flag',
        false,
        undefined
      );
    });
  });

});

describe('useStringFlag', () => {
  let mockClient: FlagsClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should fetch string flag value', async () => {
    const { result } = renderHook(
      () => useStringFlag('string-flag', 'default'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe('test-value');
    expect(mockClient.getStringValue).toHaveBeenCalledWith(
      'string-flag',
      'default',
      undefined
    );
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123' };
    const { result } = renderHook(
      () => useStringFlag('string-flag', 'default', { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getStringValue).toHaveBeenCalledWith(
      'string-flag',
      'default',
      context
    );
  });
});

describe('useNumberFlag', () => {
  let mockClient: FlagsClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should fetch number flag value', async () => {
    const { result } = renderHook(
      () => useNumberFlag('number-flag', 0),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(42);
    expect(mockClient.getNumberValue).toHaveBeenCalledWith(
      'number-flag',
      0,
      undefined
    );
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123' };
    const { result } = renderHook(
      () => useNumberFlag('number-flag', 0, { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getNumberValue).toHaveBeenCalledWith(
      'number-flag',
      0,
      context
    );
  });
});

describe('useJsonFlag', () => {
  let mockClient: FlagsClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should fetch json flag value', async () => {
    const defaultValue = { default: true };
    const { result } = renderHook(
      () => useJsonFlag('json-flag', defaultValue),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ key: 'value' });
    expect(mockClient.getJsonValue).toHaveBeenCalledWith(
      'json-flag',
      defaultValue,
      undefined
    );
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123' };
    const defaultValue = { default: true };
    const { result } = renderHook(
      () => useJsonFlag('json-flag', defaultValue, { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getJsonValue).toHaveBeenCalledWith(
      'json-flag',
      defaultValue,
      context
    );
  });
});

describe('useFlagDetails', () => {
  let mockClient: FlagsClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch boolean flag details', async () => {
    const { result } = renderHook(
      () => useFlagDetails('bool-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      value: true,
      reason: 'STATIC',
      variant: 'on',
    });
    expect(mockClient.getBooleanDetails).toHaveBeenCalledWith(
      'bool-flag',
      false,
      undefined
    );
  });

  it('should fetch string flag details', async () => {
    const { result } = renderHook(
      () => useFlagDetails('string-flag', 'default'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      value: 'test-value',
      reason: 'STATIC',
      variant: 'variant-a',
    });
    expect(mockClient.getStringDetails).toHaveBeenCalledWith(
      'string-flag',
      'default',
      undefined
    );
  });

  it('should fetch number flag details', async () => {
    const { result } = renderHook(
      () => useFlagDetails('number-flag', 0),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      value: 42,
      reason: 'STATIC',
      variant: 'variant-1',
    });
    expect(mockClient.getNumberDetails).toHaveBeenCalledWith(
      'number-flag',
      0,
      undefined
    );
  });

  it('should fetch json flag details', async () => {
    const defaultValue = { default: true };
    const { result } = renderHook(
      () => useFlagDetails('json-flag', defaultValue),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      value: { key: 'value' },
      reason: 'STATIC',
      variant: 'config-v1',
    });
    expect(mockClient.getJsonDetails).toHaveBeenCalledWith(
      'json-flag',
      defaultValue,
      undefined
    );
  });

  it('should fetch array (json) flag details', async () => {
    const defaultValue = [1, 2, 3];
    const { result } = renderHook(
      () => useFlagDetails('array-flag', defaultValue),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getJsonDetails).toHaveBeenCalledWith(
      'array-flag',
      defaultValue,
      undefined
    );
  });

  it('should fetch null (json) flag details', async () => {
    const { result } = renderHook(
      () => useFlagDetails('null-flag', null),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getJsonDetails).toHaveBeenCalledWith(
      'null-flag',
      null,
      undefined
    );
  });

  it('should fetch string flag details with context', async () => {
    const context = { targetingKey: 'user-123' };
    const { result } = renderHook(
      () => useFlagDetails('string-flag', 'default', { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getStringDetails).toHaveBeenCalledWith(
      'string-flag',
      'default',
      context
    );
  });

  it('should fetch number flag details with context', async () => {
    const context = { targetingKey: 'user-123' };
    const { result } = renderHook(
      () => useFlagDetails('number-flag', 42, { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getNumberDetails).toHaveBeenCalledWith(
      'number-flag',
      42,
      context
    );
  });

  it('should fetch json flag details with context', async () => {
    const context = { targetingKey: 'user-123' };
    const defaultValue = { key: 'default' };
    const { result } = renderHook(
      () => useFlagDetails('json-flag', defaultValue, { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getJsonDetails).toHaveBeenCalledWith(
      'json-flag',
      defaultValue,
      context
    );
  });

  it('should handle errors', async () => {
    const error = new Error('API Error');
    mockClient = createMockClient({
      getBooleanDetails: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useFlagDetails('bool-flag', false),
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
      getBooleanDetails: vi.fn().mockRejectedValue('string error'),
    });

    const { result } = renderHook(
      () => useFlagDetails('bool-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('string error');
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123' };
    const { result } = renderHook(
      () => useFlagDetails('bool-flag', false, { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getBooleanDetails).toHaveBeenCalledWith(
      'bool-flag',
      false,
      context
    );
  });

  it('should refetch when flagKey changes', async () => {
    const { result, rerender } = renderHook(
      ({ flagKey }) => useFlagDetails(flagKey, false),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { flagKey: 'flag-1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ flagKey: 'flag-2' });

    await waitFor(() => {
      expect(mockClient.getBooleanDetails).toHaveBeenCalledWith(
        'flag-2',
        false,
        undefined
      );
    });
  });

  it('should refetch when context changes', async () => {
    const { result, rerender } = renderHook(
      ({ context }) => useFlagDetails('test-flag', false, { context }),
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
      expect(mockClient.getBooleanDetails).toHaveBeenCalledWith(
        'test-flag',
        false,
        { targetingKey: 'user-2' }
      );
    });
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(
      () => useFlagDetails('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (mockClient.getBooleanDetails as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    expect((mockClient.getBooleanDetails as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
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
      () => useFlagDetails('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (mockClient.getBooleanDetails as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      eventCallback({ type: 'configurationChanged' });
    });

    await waitFor(() => {
      expect((mockClient.getBooleanDetails as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
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
      () => useFlagDetails('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    const initialCallCount = (mockClient.getBooleanDetails as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      eventCallback({ type: 'ready' });
    });

    await waitFor(() => {
      expect((mockClient.getBooleanDetails as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should unsubscribe from events on unmount', async () => {
    const unsubscribe = vi.fn();
    mockClient = createMockClient({
      on: vi.fn().mockReturnValue(unsubscribe),
    });

    const { unmount } = renderHook(
      () => useFlagDetails('test-flag', false),
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
      () => useFlagDetails('test-flag', false),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callCount = (mockClient.getBooleanDetails as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      eventCallback({ type: 'error' });
    });

    // Should not trigger refetch
    expect((mockClient.getBooleanDetails as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });
});

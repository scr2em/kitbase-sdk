import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { FlagsContext } from './context';
import {
  useBooleanFlag,
  useStringFlag,
  useNumberFlag,
  useJsonFlag,
} from './use-flag';
import type { FlagsClient } from '@kitbase/flags';

const createMockClient = (overrides: Partial<FlagsClient> = {}) => ({
  getBooleanValue: vi.fn().mockResolvedValue(true),
  getStringValue: vi.fn().mockResolvedValue('test-value'),
  getNumberValue: vi.fn().mockResolvedValue(42),
  getJsonValue: vi.fn().mockResolvedValue({ key: 'value' }),
  isReady: vi.fn().mockReturnValue(true),
  on: vi.fn().mockReturnValue(() => { }),
  onFlagChange: vi.fn().mockReturnValue({ unsubscribe: () => { } }),
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
      () => useBooleanFlag('test-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch flag value on mount', async () => {
    const { result } = renderHook(
      () => useBooleanFlag('test-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
      'test-flag',
      undefined
    );
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123', plan: 'premium' };
    const { result } = renderHook(
      () => useBooleanFlag('test-flag', { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getBooleanValue).toHaveBeenCalledWith(
      'test-flag',
      context
    );
  });

  it('should handle errors', async () => {
    const error = new Error('API Error');
    mockClient = createMockClient({
      getBooleanValue: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useBooleanFlag('test-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined(); // No default value without constructor defaults
  });

  it('should handle non-Error exceptions', async () => {
    mockClient = createMockClient({
      getBooleanValue: vi.fn().mockRejectedValue('string error'),
    });

    const { result } = renderHook(
      () => useBooleanFlag('test-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('string error');
    expect(result.current.data).toBeUndefined(); // No default value without constructor defaults
  });

  it('should refetch when flagKey changes', async () => {
    const { result, rerender } = renderHook(
      ({ flagKey }) => useBooleanFlag(flagKey),
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
        undefined
      );
    });
  });

  it('should refetch when context changes (default behavior)', async () => {
    const { result, rerender } = renderHook(
      ({ context }) => useBooleanFlag('test-flag', { context }),
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
        { targetingKey: 'user-2' }
      );
    });
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(
      () => useBooleanFlag('test-flag'),
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

  it('should refetch on flag change event', async () => {
    let flagChangeCallback: (changedFlags: Record<string, unknown>) => void = () => { };
    mockClient = createMockClient({
      onFlagChange: vi.fn().mockImplementation((cb) => {
        flagChangeCallback = cb;
        return { unsubscribe: () => { } };
      }),
    });

    const { result } = renderHook(
      () => useBooleanFlag('test-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      flagChangeCallback({ 'test-flag': true });
    });

    await waitFor(() => {
      expect((mockClient.getBooleanValue as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should refetch on ready event', async () => {
    let eventCallback: (event: { type: string }) => void = () => { };
    mockClient = createMockClient({
      isReady: vi.fn().mockReturnValue(false),
      on: vi.fn().mockImplementation((cb) => {
        eventCallback = cb;
        return () => { };
      }),
    });

    const { result } = renderHook(
      () => useBooleanFlag('test-flag'),
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
      () => useBooleanFlag('test-flag'),
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
      ({ context }) => useBooleanFlag('test-flag', { context }),
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
      ({ context }) => useBooleanFlag('test-flag', { context }),
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
      () => useStringFlag('string-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe('test-value');
    expect(mockClient.getStringValue).toHaveBeenCalledWith(
      'string-flag',
      undefined
    );
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123' };
    const { result } = renderHook(
      () => useStringFlag('string-flag', { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getStringValue).toHaveBeenCalledWith(
      'string-flag',
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
      () => useNumberFlag('number-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(42);
    expect(mockClient.getNumberValue).toHaveBeenCalledWith(
      'number-flag',
      undefined
    );
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123' };
    const { result } = renderHook(
      () => useNumberFlag('number-flag', { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getNumberValue).toHaveBeenCalledWith(
      'number-flag',
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
      () => useJsonFlag('json-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ key: 'value' });
    expect(mockClient.getJsonValue).toHaveBeenCalledWith(
      'json-flag',
      undefined
    );
  });

  it('should pass context to the client', async () => {
    const context = { targetingKey: 'user-123' };
    const defaultValue = { default: true };
    const { result } = renderHook(
      () => useJsonFlag('json-flag', { context }),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.getJsonValue).toHaveBeenCalledWith(
      'json-flag',
      context
    );
  });
});

describe('Hook Re-render on Flag Change', () => {
  it('should update the returned value when flag changes', async () => {
    let flagChangeCallback: (changedFlags: Record<string, unknown>) => void = () => { };
    let returnValue = false;

    const getBooleanValueMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(returnValue);
    });

    const mockClient = createMockClient({
      getBooleanValue: getBooleanValueMock,
      onFlagChange: vi.fn().mockImplementation((cb) => {
        flagChangeCallback = cb;
        return { unsubscribe: () => { } };
      }),
    });

    const { result } = renderHook(
      () => useBooleanFlag('dark-mode'),
      { wrapper: createWrapper(mockClient) }
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initial value should be false
    expect(result.current.data).toBe(false);

    // Change the return value and simulate flag change
    returnValue = true;
    act(() => {
      flagChangeCallback({ 'dark-mode': true });
    });

    // Wait for re-fetch to complete
    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });
  });

  it('should update string flag value when flag changes', async () => {
    let flagChangeCallback: (changedFlags: Record<string, unknown>) => void = () => { };
    let returnValue = 'variant-a';

    const getStringValueMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(returnValue);
    });

    const mockClient = createMockClient({
      getStringValue: getStringValueMock,
      onFlagChange: vi.fn().mockImplementation((cb) => {
        flagChangeCallback = cb;
        return { unsubscribe: () => { } };
      }),
    });

    const { result } = renderHook(
      () => useStringFlag('experiment'),
      { wrapper: createWrapper(mockClient) }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe('variant-a');

    // Change the return value and simulate flag change
    returnValue = 'variant-b';
    act(() => {
      flagChangeCallback({ 'experiment': 'variant-b' });
    });

    // Wait for new value
    await waitFor(() => {
      expect(result.current.data).toBe('variant-b');
    });
  });

  it('should update number flag value when flag changes', async () => {
    let flagChangeCallback: (changedFlags: Record<string, unknown>) => void = () => { };
    let returnValue = 10;

    const getNumberValueMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(returnValue);
    });

    const mockClient = createMockClient({
      getNumberValue: getNumberValueMock,
      onFlagChange: vi.fn().mockImplementation((cb) => {
        flagChangeCallback = cb;
        return { unsubscribe: () => { } };
      }),
    });

    const { result } = renderHook(
      () => useNumberFlag('max-items'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(10);

    // Change the return value and simulate flag change
    returnValue = 100;
    act(() => {
      flagChangeCallback({ 'max-items': 100 });
    });

    await waitFor(() => {
      expect(result.current.data).toBe(100);
    });
  });

  it('should not update when a different flag changes', async () => {
    let flagChangeCallback: (changedFlags: Record<string, unknown>) => void = () => { };

    const getBooleanValueMock = vi.fn().mockResolvedValue(false);

    const mockClient = createMockClient({
      getBooleanValue: getBooleanValueMock,
      onFlagChange: vi.fn().mockImplementation((cb) => {
        flagChangeCallback = cb;
        return { unsubscribe: () => { } };
      }),
    });

    const { result } = renderHook(
      () => useBooleanFlag('dark-mode'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callCount = getBooleanValueMock.mock.calls.length;

    // Simulate a different flag changing
    act(() => {
      flagChangeCallback({ 'other-flag': true });
    });

    // Should not trigger refetch
    expect(getBooleanValueMock.mock.calls.length).toBe(callCount);
  });

  it('should also update when ready event fires', async () => {
    let eventCallback: (event: { type: string }) => void = () => { };
    let returnValue = false;

    const getBooleanValueMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(returnValue);
    });

    const mockClient = createMockClient({
      getBooleanValue: getBooleanValueMock,
      isReady: vi.fn().mockReturnValue(false), // Not ready initially
      on: vi.fn().mockImplementation((cb) => {
        eventCallback = cb;
        return () => { };
      }),
    });

    const { result } = renderHook(
      () => useBooleanFlag('feature-flag'),
      { wrapper: createWrapper(mockClient) }
    );

    // Change the return value and simulate ready event
    returnValue = true;
    act(() => {
      eventCallback({ type: 'ready' });
    });

    await waitFor(() => {
      expect(result.current.data).toBe(true);
    });
  });
});

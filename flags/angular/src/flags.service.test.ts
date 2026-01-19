import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FlagConfiguration } from '@kitbase/flags';

// Mock Angular core
vi.mock('@angular/core', () => ({
  Injectable: () => (target: unknown) => target,
  inject: vi.fn(),
  signal: vi.fn((initial) => {
    let value = initial;
    const fn = () => value;
    fn.set = (newValue: unknown) => {
      value = newValue;
    };
    return fn;
  }),
  computed: vi.fn((fn) => fn),
  DestroyRef: class {
    callbacks: (() => void)[] = [];
    onDestroy(cb: () => void) {
      this.callbacks.push(cb);
    }
    destroy() {
      this.callbacks.forEach((cb) => cb());
    }
  },
}));

// Mock RxJS
vi.mock('rxjs', async () => {
  const actual = await vi.importActual('rxjs');
  return actual;
});

// Mock FlagsClient
const mockClient = {
  on: vi.fn(() => vi.fn()),
  isReady: vi.fn(() => true),
  close: vi.fn(),
  getBooleanValue: vi.fn(),
  getStringValue: vi.fn(),
  getNumberValue: vi.fn(),
  getJsonValue: vi.fn(),
  getBooleanDetails: vi.fn(),
  getSnapshot: vi.fn(),
  waitUntilReady: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('@kitbase/flags', () => ({
  FlagsClient: vi.fn(() => mockClient),
}));

describe('FlagsService', () => {
  let mockDestroyRef: { callbacks: (() => void)[]; onDestroy: (cb: () => void) => void; destroy: () => void };
  let mockConfig: { sdkKey: string };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDestroyRef = {
      callbacks: [],
      onDestroy(cb: () => void) {
        this.callbacks.push(cb);
      },
      destroy() {
        this.callbacks.forEach((cb) => cb());
      },
    };

    mockConfig = { sdkKey: 'test-sdk-key' };

    const { inject } = vi.mocked(await import('@angular/core'));
    inject.mockImplementation((token: unknown) => {
      if (token.toString().includes('FLAGS_CONFIG')) {
        return mockConfig;
      }
      return mockDestroyRef;
    });
  });

  afterEach(() => {
    mockDestroyRef.destroy();
  });

  describe('initialization', () => {
    it('should create FlagsClient with provided config', async () => {
      const { FlagsClient } = await import('@kitbase/flags');
      const { FlagsService } = await import('./flags.service.js');

      new FlagsService();

      expect(FlagsClient).toHaveBeenCalledWith(mockConfig);
    });

    it('should subscribe to client events', async () => {
      const { FlagsService } = await import('./flags.service.js');

      new FlagsService();

      expect(mockClient.on).toHaveBeenCalled();
    });

    it('should cleanup on destroy', async () => {
      const { FlagsService } = await import('./flags.service.js');

      new FlagsService();

      expect(mockDestroyRef.callbacks.length).toBeGreaterThan(0);

      // Trigger destroy
      mockDestroyRef.destroy();

      expect(mockClient.close).toHaveBeenCalled();
    });
  });

  describe('getBooleanValue', () => {
    it('should delegate to client.getBooleanValue', async () => {
      mockClient.getBooleanValue.mockResolvedValue(true);
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      const result = await service.getBooleanValue('dark-mode', false, {
        targetingKey: 'user-123',
      });

      expect(result).toBe(true);
      expect(mockClient.getBooleanValue).toHaveBeenCalledWith('dark-mode', false, {
        targetingKey: 'user-123',
      });
    });
  });

  describe('getStringValue', () => {
    it('should delegate to client.getStringValue', async () => {
      mockClient.getStringValue.mockResolvedValue('variant-a');
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      const result = await service.getStringValue('experiment', 'control');

      expect(result).toBe('variant-a');
      expect(mockClient.getStringValue).toHaveBeenCalledWith(
        'experiment',
        'control',
        undefined,
      );
    });
  });

  describe('getNumberValue', () => {
    it('should delegate to client.getNumberValue', async () => {
      mockClient.getNumberValue.mockResolvedValue(100);
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      const result = await service.getNumberValue('max-items', 50);

      expect(result).toBe(100);
      expect(mockClient.getNumberValue).toHaveBeenCalledWith(
        'max-items',
        50,
        undefined,
      );
    });
  });

  describe('getJsonValue', () => {
    it('should delegate to client.getJsonValue', async () => {
      const config = { theme: 'dark', fontSize: 14 };
      mockClient.getJsonValue.mockResolvedValue(config);
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      const result = await service.getJsonValue('ui-config', {});

      expect(result).toEqual(config);
      expect(mockClient.getJsonValue).toHaveBeenCalledWith('ui-config', {}, undefined);
    });
  });

  describe('getSnapshot', () => {
    it('should delegate to client.getSnapshot', async () => {
      const snapshot = {
        projectId: 'proj-123',
        environmentId: 'env-456',
        evaluatedAt: '2024-01-15T10:30:00Z',
        flags: [],
      };
      mockClient.getSnapshot.mockResolvedValue(snapshot);
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      const result = await service.getSnapshot({ targetingKey: 'user-123' });

      expect(result).toEqual(snapshot);
      expect(mockClient.getSnapshot).toHaveBeenCalledWith({
        context: { targetingKey: 'user-123' },
      });
    });
  });

  describe('isReady', () => {
    it('should delegate to client.isReady', async () => {
      mockClient.isReady.mockReturnValue(true);
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      const result = service.isReady();

      expect(result).toBe(true);
      expect(mockClient.isReady).toHaveBeenCalled();
    });
  });

  describe('waitUntilReady', () => {
    it('should delegate to client.waitUntilReady', async () => {
      mockClient.waitUntilReady.mockResolvedValue(undefined);
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      await service.waitUntilReady();

      expect(mockClient.waitUntilReady).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should delegate to client.refresh', async () => {
      mockClient.refresh.mockResolvedValue(undefined);
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      await service.refresh();

      expect(mockClient.refresh).toHaveBeenCalled();
    });
  });

  describe('getClient', () => {
    it('should return the underlying FlagsClient', async () => {
      const { FlagsService } = await import('./flags.service.js');

      const service = new FlagsService();
      const client = service.getClient();

      expect(client).toBe(mockClient);
    });
  });

  describe('configuration change handling', () => {
    it('should emit on configurationChanged$ when config changes', async () => {
      let configChangeCallback: ((event: { type: string; config: FlagConfiguration }) => void) | null = null;

      mockClient.on.mockImplementation((cb) => {
        configChangeCallback = cb;
        return vi.fn();
      });

      const { FlagsService } = await import('./flags.service.js');
      const service = new FlagsService();

      const receivedConfigs: FlagConfiguration[] = [];
      service.configurationChanged$.subscribe((config) => {
        receivedConfigs.push(config);
      });

      // Simulate config change event
      const newConfig: FlagConfiguration = {
        environmentId: 'env-123',
        schemaVersion: '1.0',
        generatedAt: new Date().toISOString(),
        etag: '"abc123"',
        flags: [],
        segments: [],
      };

      if (configChangeCallback) {
        configChangeCallback({ type: 'configurationChanged', config: newConfig });
      }

      expect(receivedConfigs).toHaveLength(1);
      expect(receivedConfigs[0]).toEqual(newConfig);
    });
  });
});

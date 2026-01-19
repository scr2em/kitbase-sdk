import Dexie, { type Table } from 'dexie';
import type { LogPayload } from '../types.js';
import type {
  OfflineConfig,
  QueuedEvent,
  QueueStats,
  EventQueueInterface,
  SendEventsCallback,
} from './types.js';

const DEFAULT_CONFIG: Required<OfflineConfig> = {
  enabled: false,
  maxQueueSize: 1000,
  flushInterval: 30000,
  flushBatchSize: 50,
  maxRetries: 3,
  retryBaseDelay: 1000,
};

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.indexedDB !== 'undefined' &&
      window.indexedDB !== null
    );
  } catch {
    return false;
  }
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Dexie database for event queue
 */
class KitbaseQueueDB extends Dexie {
  events!: Table<QueuedEvent, number>;

  constructor(dbName: string) {
    super(dbName);
    this.version(1).stores({
      events: '++id, timestamp, retries, lastAttempt',
    });
  }
}

/**
 * In-memory queue implementation for Node.js or when IndexedDB is unavailable
 */
class MemoryQueue {
  private queue: QueuedEvent[] = [];
  private idCounter = 1;

  async enqueue(payload: LogPayload): Promise<number> {
    const event: QueuedEvent = {
      id: this.idCounter++,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };
    this.queue.push(event);
    return event.id!;
  }

  async dequeue(count: number): Promise<QueuedEvent[]> {
    // Sort by timestamp (oldest first) and get the first `count` events
    this.queue.sort((a, b) => a.timestamp - b.timestamp);
    return this.queue.slice(0, count);
  }

  async delete(ids: number[]): Promise<void> {
    this.queue = this.queue.filter((e) => !ids.includes(e.id!));
  }

  async updateRetries(ids: number[]): Promise<void> {
    const now = Date.now();
    for (const event of this.queue) {
      if (ids.includes(event.id!)) {
        event.retries++;
        event.lastAttempt = now;
      }
    }
  }

  async getStats(): Promise<{ size: number; oldestEvent?: number }> {
    const size = this.queue.length;
    const oldestEvent =
      size > 0
        ? Math.min(...this.queue.map((e) => e.timestamp))
        : undefined;
    return { size, oldestEvent };
  }

  async clear(): Promise<void> {
    this.queue = [];
  }

  async enforceMaxSize(maxSize: number): Promise<void> {
    if (this.queue.length > maxSize) {
      // Sort by timestamp and keep only the newest events
      this.queue.sort((a, b) => a.timestamp - b.timestamp);
      this.queue = this.queue.slice(-maxSize);
    }
  }

  async getEventsExceedingRetries(maxRetries: number): Promise<number[]> {
    return this.queue
      .filter((e) => e.retries >= maxRetries)
      .map((e) => e.id!);
  }
}

/**
 * Event queue for offline support
 * Uses IndexedDB (via Dexie) in browser, in-memory queue in Node.js
 */
export class EventQueue implements EventQueueInterface {
  private readonly config: Required<OfflineConfig>;
  private readonly dbName: string;
  private db: KitbaseQueueDB | null = null;
  private memoryQueue: MemoryQueue | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private sendEvents: SendEventsCallback | null = null;
  private readonly useIndexedDB: boolean;
  private debugMode = false;
  private debugLogger: ((message: string, data?: unknown) => void) | null = null;

  constructor(config: OfflineConfig = {}, dbName = '_ka_events') {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dbName = dbName;
    this.useIndexedDB = isIndexedDBAvailable();

    if (this.useIndexedDB) {
      this.db = new KitbaseQueueDB(this.dbName);
    } else {
      this.memoryQueue = new MemoryQueue();
    }
  }

  /**
   * Set debug mode and logger
   */
  setDebugMode(enabled: boolean, logger?: (message: string, data?: unknown) => void): void {
    this.debugMode = enabled;
    this.debugLogger = logger ?? null;
  }

  private log(message: string, data?: unknown): void {
    if (this.debugMode && this.debugLogger) {
      this.debugLogger(message, data);
    }
  }

  /**
   * Set the callback for sending events
   */
  setSendCallback(callback: SendEventsCallback): void {
    this.sendEvents = callback;
  }

  /**
   * Check if the queue storage is available
   */
  isAvailable(): boolean {
    return this.useIndexedDB || this.memoryQueue !== null;
  }

  /**
   * Get the storage type being used
   */
  getStorageType(): 'indexeddb' | 'memory' {
    return this.useIndexedDB ? 'indexeddb' : 'memory';
  }

  /**
   * Add an event to the queue
   */
  async enqueue(payload: LogPayload): Promise<void> {
    const event: Omit<QueuedEvent, 'id'> = {
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    if (this.useIndexedDB && this.db) {
      await this.db.events.add(event as QueuedEvent);
      this.log('Event queued to IndexedDB', payload);
    } else if (this.memoryQueue) {
      await this.memoryQueue.enqueue(payload);
      this.log('Event queued to memory', payload);
    }

    // Enforce max queue size
    await this.enforceMaxQueueSize();
  }

  /**
   * Get and remove the next batch of events to send
   */
  async dequeue(count: number): Promise<QueuedEvent[]> {
    if (this.useIndexedDB && this.db) {
      // Get events sorted by timestamp (oldest first), excluding those with too many retries
      return this.db.events
        .where('retries')
        .below(this.config.maxRetries)
        .sortBy('timestamp')
        .then((events) => events.slice(0, count));
    } else if (this.memoryQueue) {
      const events = await this.memoryQueue.dequeue(count);
      return events.filter((e) => e.retries < this.config.maxRetries);
    }
    return [];
  }

  /**
   * Mark events as successfully sent (remove from queue)
   */
  async markSent(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    if (this.useIndexedDB && this.db) {
      await this.db.events.bulkDelete(ids);
      this.log(`Removed ${ids.length} sent events from queue`);
    } else if (this.memoryQueue) {
      await this.memoryQueue.delete(ids);
      this.log(`Removed ${ids.length} sent events from memory queue`);
    }
  }

  /**
   * Mark events as failed and increment retry count
   */
  async markFailed(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    const now = Date.now();

    if (this.useIndexedDB && this.db) {
      await this.db.transaction('rw', this.db.events, async () => {
        for (const id of ids) {
          const event = await this.db!.events.get(id);
          if (event) {
            await this.db!.events.update(id, {
              retries: event.retries + 1,
              lastAttempt: now,
            });
          }
        }
      });
      this.log(`Marked ${ids.length} events as failed`);
    } else if (this.memoryQueue) {
      await this.memoryQueue.updateRetries(ids);
      this.log(`Marked ${ids.length} events as failed in memory queue`);
    }

    // Remove events that have exceeded max retries
    await this.removeExpiredRetries();
  }

  /**
   * Remove events that have exceeded max retry attempts
   */
  private async removeExpiredRetries(): Promise<void> {
    if (this.useIndexedDB && this.db) {
      const expiredIds = await this.db.events
        .where('retries')
        .aboveOrEqual(this.config.maxRetries)
        .primaryKeys();
      if (expiredIds.length > 0) {
        await this.db.events.bulkDelete(expiredIds);
        this.log(`Removed ${expiredIds.length} events that exceeded max retries`);
      }
    } else if (this.memoryQueue) {
      const expiredIds = await this.memoryQueue.getEventsExceedingRetries(
        this.config.maxRetries
      );
      if (expiredIds.length > 0) {
        await this.memoryQueue.delete(expiredIds);
        this.log(`Removed ${expiredIds.length} events that exceeded max retries`);
      }
    }
  }

  /**
   * Enforce the maximum queue size by removing oldest events
   */
  private async enforceMaxQueueSize(): Promise<void> {
    if (this.useIndexedDB && this.db) {
      const count = await this.db.events.count();
      if (count > this.config.maxQueueSize) {
        const excess = count - this.config.maxQueueSize;
        const oldestEvents = await this.db.events
          .orderBy('timestamp')
          .limit(excess)
          .primaryKeys();
        await this.db.events.bulkDelete(oldestEvents);
        this.log(`Removed ${excess} oldest events to enforce queue size limit`);
      }
    } else if (this.memoryQueue) {
      await this.memoryQueue.enforceMaxSize(this.config.maxQueueSize);
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    if (this.useIndexedDB && this.db) {
      const size = await this.db.events.count();
      const oldestEvent = await this.db.events
        .orderBy('timestamp')
        .first()
        .then((e) => e?.timestamp);
      return { size, oldestEvent, isFlushing: this.isFlushing };
    } else if (this.memoryQueue) {
      const stats = await this.memoryQueue.getStats();
      return { ...stats, isFlushing: this.isFlushing };
    }
    return { size: 0, isFlushing: this.isFlushing };
  }

  /**
   * Clear all events from the queue
   */
  async clear(): Promise<void> {
    if (this.useIndexedDB && this.db) {
      await this.db.events.clear();
      this.log('Queue cleared (IndexedDB)');
    } else if (this.memoryQueue) {
      await this.memoryQueue.clear();
      this.log('Queue cleared (memory)');
    }
  }

  /**
   * Start the automatic flush timer
   */
  startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.log('Flush timer error', err);
      });
    }, this.config.flushInterval);

    // Also listen for online events in browser
    if (isBrowser()) {
      window.addEventListener('online', this.handleOnline);
    }

    this.log(`Flush timer started (interval: ${this.config.flushInterval}ms)`);
  }

  /**
   * Stop the automatic flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (isBrowser()) {
      window.removeEventListener('online', this.handleOnline);
    }

    this.log('Flush timer stopped');
  }

  /**
   * Handle coming back online
   */
  private handleOnline = (): void => {
    this.log('Browser came online, triggering flush');
    this.flush().catch((err) => {
      this.log('Online flush error', err);
    });
  };

  /**
   * Check if we're currently online
   */
  private isOnline(): boolean {
    if (isBrowser()) {
      return navigator.onLine;
    }
    // Assume online in Node.js
    return true;
  }

  /**
   * Manually trigger a flush of queued events
   */
  async flush(): Promise<void> {
    if (this.isFlushing) {
      this.log('Flush already in progress, skipping');
      return;
    }

    if (!this.isOnline()) {
      this.log('Offline, skipping flush');
      return;
    }

    if (!this.sendEvents) {
      this.log('No send callback configured, skipping flush');
      return;
    }

    this.isFlushing = true;

    try {
      const stats = await this.getStats();
      if (stats.size === 0) {
        this.log('Queue is empty, nothing to flush');
        return;
      }

      this.log(`Flushing queue (${stats.size} events)`);

      // Process in batches
      let processed = 0;
      while (true) {
        const events = await this.dequeue(this.config.flushBatchSize);
        if (events.length === 0) break;

        this.log(`Sending batch of ${events.length} events`);

        try {
          const sentIds = await this.sendEvents(events);
          await this.markSent(sentIds);

          // Mark remaining as failed
          const failedIds = events
            .filter((e) => !sentIds.includes(e.id!))
            .map((e) => e.id!);
          if (failedIds.length > 0) {
            await this.markFailed(failedIds);
          }

          processed += sentIds.length;
        } catch (error) {
          // Mark all as failed on network error
          const allIds = events.map((e) => e.id!);
          await this.markFailed(allIds);
          this.log('Batch send failed', error);
          break; // Stop flushing on error
        }
      }

      this.log(`Flush complete, sent ${processed} events`);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    this.stopFlushTimer();
    if (this.db) {
      this.db.close();
      this.log('Database connection closed');
    }
  }
}

export type { OfflineConfig, QueuedEvent, QueueStats, EventQueueInterface, SendEventsCallback };

import type { LogPayload } from '../types.js';

/**
 * Configuration options for offline event queueing
 */
export interface OfflineConfig {
  /**
   * Enable offline queueing
   * @default false
   */
  enabled?: boolean;

  /**
   * Maximum number of events to store in the queue
   * Oldest events are dropped when limit is reached
   * @default 1000
   */
  maxQueueSize?: number;

  /**
   * Interval in milliseconds to flush queued events when online
   * @default 30000 (30 seconds)
   */
  flushInterval?: number;

  /**
   * Number of events to send per batch when flushing
   * @default 50
   */
  flushBatchSize?: number;

  /**
   * Maximum number of retry attempts for failed events
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for exponential backoff
   * @default 1000 (1 second)
   */
  retryBaseDelay?: number;
}

/**
 * A queued event stored in the database
 */
export interface QueuedEvent {
  /**
   * Auto-incremented unique identifier
   */
  id?: number;

  /**
   * The event payload to send
   */
  payload: LogPayload;

  /**
   * Timestamp when the event was queued (ms since epoch)
   */
  timestamp: number;

  /**
   * Number of retry attempts made
   */
  retries: number;

  /**
   * Timestamp of the last retry attempt (ms since epoch)
   */
  lastAttempt?: number;
}

/**
 * Statistics about the event queue
 */
export interface QueueStats {
  /**
   * Number of events currently in the queue
   */
  size: number;

  /**
   * Oldest event timestamp in the queue
   */
  oldestEvent?: number;

  /**
   * Whether the queue is currently flushing
   */
  isFlushing: boolean;
}

/**
 * Interface for event queue implementations
 */
export interface EventQueueInterface {
  /**
   * Add an event to the queue
   */
  enqueue(payload: LogPayload): Promise<void>;

  /**
   * Get and remove the next batch of events to send
   */
  dequeue(count: number): Promise<QueuedEvent[]>;

  /**
   * Mark events as successfully sent (remove from queue)
   */
  markSent(ids: number[]): Promise<void>;

  /**
   * Mark events as failed and increment retry count
   */
  markFailed(ids: number[]): Promise<void>;

  /**
   * Get queue statistics
   */
  getStats(): Promise<QueueStats>;

  /**
   * Clear all events from the queue
   */
  clear(): Promise<void>;

  /**
   * Start the flush timer
   */
  startFlushTimer(): void;

  /**
   * Stop the flush timer
   */
  stopFlushTimer(): void;

  /**
   * Manually trigger a flush
   */
  flush(): Promise<void>;

  /**
   * Check if the queue is available (IndexedDB supported)
   */
  isAvailable(): boolean;
}

/**
 * Callback for sending events during flush
 */
export type SendEventsCallback = (events: QueuedEvent[]) => Promise<number[]>;

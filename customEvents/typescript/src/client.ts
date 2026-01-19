import type {
  KitbaseConfig,
  TrackOptions,
  TrackResponse,
  LogPayload,
  Tags,
} from './types.js';
import { ValidationError } from './errors.js';
import { KitbaseBase } from './client-base.js';
import { EventQueue } from './queue/index.js';
import type { QueuedEvent, QueueStats } from './queue/types.js';

/**
 * Kitbase client for tracking events with full offline queue support
 *
 * @example
 * ```typescript
 * import { Kitbase } from '@kitbase/sdk/events';
 *
 * const kitbase = new Kitbase({
 *   token: '<YOUR_API_KEY>',
 *   debug: true,
 *   offline: { enabled: true },
 * });
 *
 * // Register super properties (included in all events)
 * kitbase.register({ app_version: '2.1.0', platform: 'web' });
 *
 * // Track anonymous events (anonymous_id is automatically included)
 * await kitbase.track({
 *   channel: 'payments',
 *   event: 'Page Viewed',
 *   icon: '👀',
 * });
 *
 * // Time events for duration tracking
 * kitbase.timeEvent('Video Watched');
 * // ... later
 * await kitbase.track({
 *   channel: 'engagement',
 *   event: 'Video Watched', // $duration automatically included
 * });
 *
 * // Track events for a logged-in user (just pass user_id)
 * await kitbase.track({
 *   channel: 'payments',
 *   event: 'New Subscription',
 *   user_id: 'user-123',
 *   icon: '💰',
 *   notify: true,
 *   tags: {
 *     plan: 'premium',
 *     cycle: 'monthly',
 *   },
 * });
 * ```
 */
export class Kitbase extends KitbaseBase {
  // Offline queue
  private queue: EventQueue | null = null;
  private offlineEnabled: boolean;
  private clearQueueOnOptOut: boolean;

  constructor(config: KitbaseConfig) {
    super(config);

    // Initialize offline queue if enabled
    this.offlineEnabled = config.offline?.enabled ?? false;
    this.clearQueueOnOptOut = config.privacy?.clearQueueOnOptOut ?? true;

    if (this.offlineEnabled) {
      this.queue = new EventQueue(config.offline);
      this.queue.setDebugMode(this.debugMode, this.log.bind(this));
      this.queue.setSendCallback(this.sendQueuedEvents.bind(this));
      this.queue.startFlushTimer();
      this.log('Offline queueing enabled', {
        storageType: this.queue.getStorageType(),
      });
    }
  }

  // ============================================================
  // Debug Mode Override
  // ============================================================

  /**
   * Enable or disable debug mode
   * When enabled, all SDK operations are logged to the console
   *
   * @param enabled - Whether to enable debug mode
   *
   * @example
   * ```typescript
   * kitbase.setDebugMode(true);
   * // All events and operations will now be logged
   * ```
   */
  override setDebugMode(enabled: boolean): void {
    super.setDebugMode(enabled);
    if (this.queue) {
      this.queue.setDebugMode(enabled, this.log.bind(this));
    }
  }

  // ============================================================
  // Privacy & Consent Override
  // ============================================================

  /**
   * Opt out of tracking
   * When opted out, all tracking calls will be silently ignored.
   * The opt-out state is persisted to storage and survives page reloads.
   *
   * @example
   * ```typescript
   * // User clicks "Reject" on cookie consent banner
   * await kitbase.optOut();
   * ```
   */
  async optOut(): Promise<void> {
    // Call base optOut first (synchronous)
    super.optOut();

    // Clear queued events if configured to do so
    if (this.clearQueueOnOptOut && this.queue) {
      await this.queue.clear();
      this.log('Offline queue cleared due to opt-out');
    }
  }

  // ============================================================
  // Offline Queue
  // ============================================================

  /**
   * Get offline queue statistics
   *
   * @returns Queue statistics including size and flush status
   *
   * @example
   * ```typescript
   * const stats = await kitbase.getQueueStats();
   * console.log(stats); // { size: 5, isFlushing: false }
   * ```
   */
  async getQueueStats(): Promise<QueueStats | null> {
    if (!this.queue) return null;
    return this.queue.getStats();
  }

  /**
   * Manually flush the offline queue
   * Events are automatically flushed on interval and when coming back online,
   * but this method can be used to trigger an immediate flush
   *
   * @example
   * ```typescript
   * await kitbase.flushQueue();
   * ```
   */
  async flushQueue(): Promise<void> {
    if (!this.queue) return;
    await this.queue.flush();
  }

  /**
   * Clear all events from the offline queue
   *
   * @example
   * ```typescript
   * await kitbase.clearQueue();
   * ```
   */
  async clearQueue(): Promise<void> {
    if (!this.queue) return;
    await this.queue.clear();
  }

  /**
   * Callback for the queue to send batched events
   */
  private async sendQueuedEvents(events: QueuedEvent[]): Promise<number[]> {
    const sentIds: number[] = [];

    for (const event of events) {
      try {
        await this.sendRequest<TrackResponse>('/sdk/v1/logs', event.payload);
        sentIds.push(event.id!);
      } catch (error) {
        this.log('Failed to send queued event', { id: event.id, error });
        // Continue with next event
      }
    }

    return sentIds;
  }

  // ============================================================
  // Track Event Override
  // ============================================================

  /**
   * Track an event
   *
   * When offline queueing is enabled, events are always written to the local
   * database first (write-ahead), then sent to the server. This ensures no
   * events are lost if the browser crashes or the network fails.
   *
   * @param options - Event tracking options
   * @returns Promise resolving to the track response, or void if tracking is blocked
   * @throws {ValidationError} When required fields are missing
   * @throws {AuthenticationError} When the API key is invalid (only when offline disabled)
   * @throws {ApiError} When the API returns an error (only when offline disabled)
   * @throws {TimeoutError} When the request times out (only when offline disabled)
   */
  override async track(options: TrackOptions): Promise<TrackResponse | void> {
    this.validateTrackOptions(options);

    // Check if user has opted out of tracking
    if (this.optedOut) {
      this.log('Event skipped - user opted out', { event: options.event });
      return;
    }

    // Check if bot blocking is active
    if (this.isBotBlockingActive()) {
      this.log('Event skipped - bot detected', { event: options.event });
      return;
    }

    // Calculate duration if this event was being timed
    let duration: number | undefined;
    const startTime = this.timedEvents.get(options.event);
    if (startTime !== undefined) {
      duration = (Date.now() - startTime) / 1000;
      this.timedEvents.delete(options.event);
      this.log('Timer stopped', { event: options.event, duration });
    }

    // Include anonymous_id unless explicitly disabled
    const includeAnonymousId = options.includeAnonymousId !== false;

    // Merge super properties with event tags (event tags take precedence)
    const mergedTags: Tags = {
      ...this.superProperties,
      ...(options.tags ?? {}),
      ...(duration !== undefined ? { $duration: duration } : {}),
    };

    const payload: LogPayload = {
      channel: options.channel,
      event: options.event,
      timestamp: Date.now(),
      ...(options.user_id && { user_id: options.user_id }),
      ...(includeAnonymousId && this.anonymousId && { anonymous_id: this.anonymousId }),
      ...(options.icon && { icon: options.icon }),
      ...(options.notify !== undefined && { notify: options.notify }),
      ...(options.description && { description: options.description }),
      ...(Object.keys(mergedTags).length > 0 && { tags: mergedTags }),
    };

    this.log('Track', { event: options.event, payload });

    // If offline queueing is enabled, use write-ahead pattern
    if (this.queue) {
      // Always write to DB first (guaranteed durability)
      await this.queue.enqueue(payload);
      this.log('Event persisted to queue');

      // Trigger an immediate flush attempt (non-blocking)
      this.queue.flush().catch((err) => {
        this.log('Background flush failed', err);
      });

      // Return immediately after DB write
      return {
        id: `queued-${Date.now()}`,
        event: options.event,
        timestamp: new Date().toISOString(),
      };
    }

    // No offline queue - send directly (original behavior)
    const response = await this.sendRequest<TrackResponse>('/sdk/v1/logs', payload);
    this.log('Event sent successfully', { id: response.id });
    return response;
  }

  protected override validateTrackOptions(options: TrackOptions): void {
    if (!options.event) {
      throw new ValidationError('Event is required', 'event');
    }
  }

  // ============================================================
  // Cleanup
  // ============================================================

  /**
   * Shutdown the client and cleanup resources
   * Call this when you're done using the client to stop timers and close connections
   *
   * @example
   * ```typescript
   * await kitbase.shutdown();
   * ```
   */
  override async shutdown(): Promise<void> {
    this.log('Shutting down');

    // Flush any remaining queued events
    if (this.queue) {
      await this.queue.flush();
      await this.queue.close();
      this.queue = null;
    }

    // Clear timed events
    this.timedEvents.clear();

    this.log('Shutdown complete');
  }
}

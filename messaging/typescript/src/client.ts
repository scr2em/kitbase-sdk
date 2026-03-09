import type {
  MessagingConfig,
  InAppMessage,
  GetMessagesOptions,
  SubscribeOptions,
} from './types.js';
import { ValidationError } from './errors.js';
import { MessagingApi } from './api.js';
import { MessageRenderer } from './renderer.js';

const DEFAULT_POLL_INTERVAL = 60000;

/**
 * Singleton instance managed by `init()` / `getInstance()`.
 */
let _instance: Messaging | null = null;

/**
 * Initialize the Kitbase In-App Messaging SDK.
 *
 * Creates a singleton instance that is used for all messaging.
 * Call this once at the top of your application entry point.
 *
 * @param config - SDK configuration
 * @returns The Messaging instance
 *
 * @example
 * ```typescript
 * import { init } from '@kitbase/messaging';
 *
 * const messaging = init({
 *   sdkKey: 'your-api-key',
 *   userId: currentUser.id,
 *   metadata: { plan: 'pro' },
 * });
 * ```
 */
export function init(config: MessagingConfig): Messaging {
  if (_instance) {
    _instance.close();
  }
  _instance = new Messaging(config);
  return _instance;
}

/**
 * Get the current Messaging singleton instance.
 *
 * @returns The instance, or null if `init()` has not been called
 */
export function getInstance(): Messaging | null {
  return _instance;
}

/**
 * Kitbase In-App Messaging SDK
 *
 * Fetches targeted in-app messages and renders them directly in the page.
 * Supports modals, banners, cards, and full-screen images with automatic
 * stacking.
 *
 * @example Using init (recommended)
 * ```typescript
 * import { init } from '@kitbase/messaging';
 *
 * const messaging = init({
 *   sdkKey: 'your-api-key',
 *   metadata: { plan: 'pro' },
 *   onAction: (msg, btn) => {
 *     console.log('User clicked:', btn.text);
 *   },
 * });
 *
 * // Later: clean up
 * messaging.close();
 * ```
 *
 * @example CDN (zero-config)
 * ```html
 * <script>
 *   window.KITBASE_MESSAGING = { sdkKey: 'your-api-key' };
 * </script>
 * <script src="https://unpkg.com/@kitbase/messaging/dist/cdn.js"></script>
 * <!-- Messages appear automatically! -->
 * ```
 *
 * @example Data-only (no rendering)
 * ```typescript
 * const messaging = init({
 *   sdkKey: 'your-api-key',
 *   autoShow: false,
 * });
 *
 * const messages = await messaging.getMessages();
 * // render messages yourself
 * ```
 */
export class Messaging {
  private api: MessagingApi;
  private renderer: MessageRenderer | null = null;
  private config: MessagingConfig;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private dismissed = new Set<string>();
  private subscriptionTimers = new Set<ReturnType<typeof setInterval>>();
  private pendingPoll = false;
  private visibilityHandler: (() => void) | null = null;

  private userId: string | undefined;

  constructor(config: MessagingConfig) {
    if (!config.sdkKey) {
      throw new ValidationError('SDK key is required', 'sdkKey');
    }

    this.config = config;
    this.userId = config.userId;
    this.api = new MessagingApi(config.sdkKey, config.baseUrl);

    if (config.autoShow !== false && typeof window !== 'undefined') {
      this.start();
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  /**
   * Start fetching and rendering messages.
   * Called automatically unless `autoShow: false`.
   */
  start(): void {
    if (typeof window === 'undefined') return;
    if (this.renderer) return; // already started

    this.renderer = new MessageRenderer({
      onShow: (msg) => {
        this.config.onShow?.(msg);
      },
      onDismiss: (msg) => {
        this.dismissed.add(msg.id);
        this.config.onDismiss?.(msg);
      },
      onAction: (msg, btn) => {
        return this.config.onAction?.(msg, btn);
      },
    });

    // Fetch immediately
    this.poll();

    // Set up polling
    const interval = this.config.pollInterval ?? DEFAULT_POLL_INTERVAL;
    if (interval > 0) {
      this.pollTimer = setInterval(() => this.poll(), interval);
    }

    // Pause polling when tab is hidden, resume when visible
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && this.pendingPoll) {
        this.pendingPoll = false;
        this.poll();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Stop polling and remove all rendered messages.
   */
  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.pendingPoll = false;
    this.renderer?.destroy();
    this.renderer = null;
  }

  /**
   * Stop everything and remove all rendered UI.
   */
  close(): void {
    this.stop();
    for (const tid of this.subscriptionTimers) {
      clearInterval(tid);
    }
    this.subscriptionTimers.clear();
    this.dismissed.clear();
  }

  // ── User identity ────────────────────────────────────────────

  /**
   * Set the current user ID.
   * Triggers an immediate re-fetch so show-once messages that the user
   * has already viewed are filtered out.
   */
  identify(userId: string): void {
    this.userId = userId;
    this.poll();
  }

  /**
   * Clear the current user ID and reset dismissed messages.
   * Call this on logout.
   */
  reset(): void {
    this.userId = undefined;
    this.dismissed.clear();
    this.poll();
  }

  /**
   * Record that the current user has viewed a message.
   * The message is optimistically removed from the UI.
   *
   * @throws {ValidationError} When no user ID has been set
   * @throws {ApiError} When the API returns an error
   */
  async markViewed(messageId: string): Promise<void> {
    if (!this.userId) {
      throw new ValidationError(
        'User ID is required to mark a message as viewed. Call identify() first.',
        'userId',
      );
    }
    this.dismissed.add(messageId);
    this.renderer?.dismiss(messageId);
    await this.api.markViewed(messageId, this.userId);
  }

  // ── Data-only methods ─────────────────────────────────────────

  /**
   * Fetch active messages without rendering.
   * Use this when `autoShow: false` or for custom rendering.
   *
   * @param options - Metadata for targeting evaluation
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {ApiError} When the API returns an error
   * @throws {TimeoutError} When the request times out
   */
  async getMessages(options?: GetMessagesOptions): Promise<InAppMessage[]> {
    return this.api.getMessages(options);
  }

  /**
   * Subscribe to messages with polling (data-only, no rendering).
   * Returns an unsubscribe function.
   *
   * @example
   * ```typescript
   * const unsub = messaging.subscribe(
   *   (messages) => renderMyUI(messages),
   *   { pollInterval: 30_000 },
   * );
   *
   * // Later
   * unsub();
   * ```
   */
  subscribe(
    callback: (messages: InAppMessage[]) => void,
    options?: SubscribeOptions,
  ): () => void {
    const interval = options?.pollInterval ?? DEFAULT_POLL_INTERVAL;
    let active = true;

    const run = async () => {
      if (!active) return;
      try {
        const msgs = await this.api.getMessages(options);
        if (active) callback(msgs);
      } catch {
        /* skip failed polls */
      }
    };

    run();
    const tid = setInterval(run, interval);
    this.subscriptionTimers.add(tid);

    return () => {
      active = false;
      clearInterval(tid);
      this.subscriptionTimers.delete(tid);
    };
  }

  // ── Internal ──────────────────────────────────────────────────

  private async poll(): Promise<void> {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.pendingPoll = true;
      return;
    }

    try {
      const messages = await this.api.getMessages({
        userId: this.userId,
        metadata: this.config.metadata,
      });

      // Filter out messages dismissed in this session
      const visible = messages.filter((m) => !this.dismissed.has(m.id));

      this.renderer?.update(visible);
    } catch {
      /* silently skip failed polls */
    }
  }
}

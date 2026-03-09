/**
 * Kitbase In-App Messaging — CDN / Script Tag Build
 *
 * Drop-in script for any page (PHP, WordPress, static HTML, etc.).
 * No bundler required. Messages are rendered automatically.
 *
 * @example Simplest integration
 * ```html
 * <script>
 *   window.KITBASE_MESSAGING = { sdkKey: 'your-api-key' };
 * </script>
 * <script src="https://unpkg.com/@kitbase/messaging/dist/cdn.js"></script>
 * <!-- In-app messages appear automatically! -->
 * ```
 *
 * @example With user targeting
 * ```html
 * <script>
 *   window.KITBASE_MESSAGING = {
 *     sdkKey: 'your-api-key',
 *     userId: '<?php echo $user_id; ?>',
 *     metadata: {
 *       plan: '<?php echo $plan; ?>',
 *       country: '<?php echo $country; ?>',
 *     },
 *   };
 * </script>
 * <script src="https://unpkg.com/@kitbase/messaging/dist/cdn.js"></script>
 * ```
 *
 * @example With callbacks
 * ```html
 * <script>
 *   window.KITBASE_MESSAGING = {
 *     sdkKey: 'your-api-key',
 *     onAction: function(message, button) {
 *       console.log('Clicked:', button.text, button.url);
 *     },
 *     onDismiss: function(message) {
 *       console.log('Dismissed:', message.title);
 *     },
 *   };
 * </script>
 * <script src="https://unpkg.com/@kitbase/messaging/dist/cdn.js"></script>
 * ```
 *
 * @example Manual init
 * ```html
 * <script src="https://unpkg.com/@kitbase/messaging/dist/cdn.js"></script>
 * <script>
 *   var messaging = KitbaseMessaging.init({
 *     sdkKey: 'your-api-key',
 *   });
 *
 *   // After user logs in
 *   messaging.identify('user_456');
 *
 *   // Mark a message as viewed (requires identify first)
 *   messaging.markViewed('msg_id');
 *
 *   // Clean up
 *   messaging.close();
 * </script>
 * ```
 *
 * @packageDocumentation
 */

export { Messaging, init, getInstance } from './client.js';
export type {
  MessagingConfig,
  InAppMessage,
  MessageType,
  MessageButton,
  GetMessagesOptions,
  SubscribeOptions,
} from './types.js';
export {
  MessagingError,
  ApiError,
  AuthenticationError,
  ValidationError,
  TimeoutError,
} from './errors.js';

// ── Auto-init ───────────────────────────────────────────────────

import type { MessagingConfig } from './types.js';
import { init } from './client.js';
import type { Messaging } from './client.js';

declare global {
  interface Window {
    /** Set before loading the script to auto-initialize. */
    KITBASE_MESSAGING?: MessagingConfig;
    /** The auto-initialized Messaging instance. */
    kitbaseMessaging?: Messaging;
  }
}

if (typeof window !== 'undefined' && window.KITBASE_MESSAGING) {
  try {
    window.kitbaseMessaging = init(window.KITBASE_MESSAGING);
  } catch (error) {
    console.error('[KitbaseMessaging] Failed to auto-initialize:', error);
  }
}

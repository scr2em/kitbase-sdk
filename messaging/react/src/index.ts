// Provider
export { MessagingProvider } from './provider.js';
export type { MessagingProviderProps } from './provider.js';

// Context hook (for advanced usage)
export { useMessagingContext } from './context.js';

// Message hooks (data-only, for custom rendering)
export { useMessages, useLazyMessages } from './use-messages.js';
export type { UseMessagesResult } from './use-messages.js';

// Types
export type { UseMessagesOptions, AsyncState } from './types.js';

// Re-export core types for convenience
export type {
  MessagingConfig,
  InAppMessage,
  MessageType,
  MessageButton,
  GetMessagesOptions,
} from '@kitbase/messaging';

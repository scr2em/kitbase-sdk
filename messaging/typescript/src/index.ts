// Main client
export { Messaging, init, getInstance } from './client.js';

// Renderer (for embedding previews in external UIs)
export { MessageRenderer } from './renderer.js';
export type { RendererCallbacks } from './renderer.js';
export { STYLES as MESSAGE_STYLES } from './styles.js';

// Types
export type {
  MessagingConfig,
  InAppMessage,
  MessageType,
  MessageButton,
  GetMessagesOptions,
  SubscribeOptions,
} from './types.js';

// Errors
export {
  MessagingError,
  ApiError,
  AuthenticationError,
  ValidationError,
  TimeoutError,
} from './errors.js';

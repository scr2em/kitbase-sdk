// Main client
export { Messaging, init, getInstance } from './client.js';

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

// Server-side OpenFeature Provider
export { KitbaseProvider } from './provider.js';
export type { KitbaseProviderOptions } from './provider.js';

// Re-export OpenFeature types for convenience
export type {
  Provider,
  ResolutionDetails,
  EvaluationContext,
  JsonValue,
  ProviderMetadata,
  Hook,
  ProviderStatus,
} from '@openfeature/server-sdk';


// Provider
export { EventsProvider } from './provider.js';
export type { EventsProviderProps } from './provider.js';

// Context hook (for advanced usage)
export { useEventsContext } from './context.js';

// Event hooks
export { useTrack, useTrackChannel } from './use-track.js';
export type { UseTrackResult } from './use-track.js';


// Re-export types from the SDK for convenience
export type { TrackOptions, TrackResponse, Tags, TagValue, Storage } from '@kitbase/sdk/events';

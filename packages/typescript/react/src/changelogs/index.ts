// Provider
export { ChangelogsProvider } from './provider.js';
export type { ChangelogsProviderProps } from './provider.js';

// Context hook (for advanced usage)
export { useChangelogsContext } from './context.js';

// Changelog hooks
export { useChangelog, useLazyChangelog } from './use-changelog.js';
export type { UseChangelogResult } from './use-changelog.js';

// Types
export type { UseChangelogOptions, AsyncState } from './types.js';

// Re-export types from the SDK for convenience
export type { ChangelogResponse } from '@kitbase/sdk/changelogs';

# Kitbase SDK

## Project Structure

Monorepo containing the Kitbase SDKs:

- `analytics/typescript/packages/core/` — Core analytics SDK (vanilla JS, no framework dependency)
- `analytics/typescript/packages/angular/` — Angular wrapper
- `analytics/typescript/packages/react/` — React wrapper

Documentation lives in a separate repo at `/Users/mohamed/private/kitbase-mono/docs/`.

## Documentation Sync Rules

### Auto-Tracked Events Page

**File:** `/Users/mohamed/private/kitbase-mono/docs/features/events/auto-events.md`

Whenever you modify auto-tracking behavior in `analytics/typescript/packages/core/src/client-base.ts` — adding, removing, or changing an auto-tracked event, its tags, its channel, or its trigger conditions — you **must** update the auto-events documentation page to match.

This includes changes to:
- Event names or channels
- Tag keys, types, or descriptions
- Trigger conditions (when events fire)
- Data attributes (e.g. `data-kb-track-visibility`, `data-kb-track-click`)
- Config flags in `AnalyticsConfig` (e.g. `autoTrackVisibility`)
- Common payload fields (`client_timestamp`, `client_session_id`, etc.)

### Package READMEs

Whenever you modify the core SDK implementation (public API, config options, features, data attributes), you **must** update both package READMEs to reflect the changes:

- **Core:** `analytics/typescript/packages/core/README.md`
- **Angular:** `analytics/typescript/packages/angular/README.md`

This includes changes to:
- Public methods (adding, removing, or changing signatures)
- Config options (`KitbaseConfig`, `AnalyticsConfig`, `PrivacyConfig`, etc.)
- Auto-tracked events or data attributes
- Exported types
- Build variants (full vs lite)

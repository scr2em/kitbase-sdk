# Kitbase SDK

## Project Structure

Monorepo containing the Kitbase SDKs:

- `analytics/typescript/packages/core/` — Core analytics SDK (vanilla JS, no framework dependency)
- `analytics/typescript/packages/angular/` — Angular wrapper
- `analytics/typescript/packages/react/` — React wrapper

Documentation lives in a separate repo at `/Users/mohamed/private/kitbase-mono/docs/`.

## Documentation Sync Rules

Whenever you modify the SDK, you **must** update the matching documentation pages AND the package READMEs.

### Documentation Pages to Update

| What Changed | Docs to Update |
|---|---|
| Auto-tracking behavior (events, tags, channels, triggers) | `docs/autocapture.md` and `docs/features/events/auto-events.md` |
| Public methods (track, identify, revenue, etc.) | `docs/sdks/javascript.md` and `docs/track-events.md` |
| Config options (KitbaseConfig, AnalyticsConfig, PrivacyConfig, OfflineConfig) | `docs/sdks/javascript.md` and `docs/tracking-script.md` |
| Identify behavior | `docs/identify-users.md` |
| Data attributes (data-kb-track-click, data-kb-track-visibility) | `docs/autocapture.md` |
| React wrapper | `docs/sdks/react.md` |
| Angular wrapper | `docs/sdks/angular.md` |
| Error types or handling | `docs/sdks/javascript.md` (Error Types section) |
| Offline queue behavior | `docs/sdks/javascript.md` (Offline Support section) |
| Privacy/consent behavior | `docs/sdks/javascript.md` (Privacy & Consent section) |
| Session management | `docs/sdks/javascript.md` and `docs/guide/sessions.md` |
| TypeScript types (interfaces, enums) | `docs/sdks/javascript.md` (TypeScript Types section) |

All doc paths are relative to `/Users/mohamed/private/kitbase-mono/`.

### Package READMEs

Whenever you modify the core SDK implementation (public API, config options, features, data attributes), you **must** also update both package READMEs:

- **Core:** `analytics/typescript/packages/core/README.md`
- **React:** `analytics/typescript/packages/react/README.md`
- **Angular:** `analytics/typescript/packages/angular/README.md`

This includes changes to:
- Public methods (adding, removing, or changing signatures)
- Config options (`KitbaseConfig`, `AnalyticsConfig`, `PrivacyConfig`, etc.)
- Auto-tracked events or data attributes
- Exported types
- Build variants (full vs lite)

### Full Doc Structure Reference

See `/Users/mohamed/private/kitbase-mono/CLAUDE.md` for the complete documentation structure and cross-project sync rules.

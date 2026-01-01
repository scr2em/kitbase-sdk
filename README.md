# Kitbase SDK

Official SDKs for [Kitbase](https://kitbase.io).

## Packages

### TypeScript / JavaScript

| Package                                              | Description       | Status |
| ---------------------------------------------------- | ----------------- | ------ |
| [@kitbase/events](./packages/typescript/events)      | Event tracking    | ✅     |
| [@kitbase/changelogs](./packages/typescript/changelogs) | Changelogs     | 🚧     |
| [@kitbase/flags](./packages/typescript/flags)        | Feature flags     | 🚧     |

### Dart / Flutter

| Package                                        | Description       | Status |
| ---------------------------------------------- | ----------------- | ------ |
| [kitbase_events](./packages/dart/events)       | Event tracking    | ✅     |
| kitbase_changelogs                             | Changelogs        | 🚧     |
| kitbase_flags                                  | Feature flags     | 🚧     |

### Python (coming soon)

| Package          | Description       | Status |
| ---------------- | ----------------- | ------ |
| kitbase-events   | Event tracking    | 🚧     |
| kitbase-changelogs | Changelogs      | 🚧     |
| kitbase-flags    | Feature flags     | 🚧     |

### PHP (coming soon)

| Package              | Description       | Status |
| -------------------- | ----------------- | ------ |
| kitbase/events       | Event tracking    | 🚧     |
| kitbase/changelogs   | Changelogs        | 🚧     |
| kitbase/flags        | Feature flags     | 🚧     |

## Quick Start

### TypeScript / JavaScript

```bash
npm install @kitbase/events
```

```typescript
import { Kitbase } from '@kitbase/events';

const kitbase = new Kitbase({
  token: '<YOUR_API_KEY>',
});

await kitbase.track({
  channel: 'payments',
  event: 'New Subscription',
  user_id: 'user-123',
  icon: '💰',
  notify: true,
  tags: {
    plan: 'premium',
    cycle: 'monthly',
  },
});
```

### Dart / Flutter

```yaml
# pubspec.yaml
dependencies:
  kitbase_events: ^0.1.0
```

```dart
import 'package:kitbase_events/kitbase_events.dart';

final kitbase = Kitbase(token: '<YOUR_API_KEY>');

await kitbase.track(
  channel: 'payments',
  event: 'New Subscription',
  userId: 'user-123',
  icon: '💰',
  notify: true,
  tags: {
    'plan': 'premium',
    'cycle': 'monthly',
  },
);
```

## Repository Structure

```
kitbase-sdk/
├── packages/
│   ├── typescript/
│   │   ├── events/       # @kitbase/events
│   │   ├── changelogs/   # @kitbase/changelogs (coming soon)
│   │   └── flags/        # @kitbase/flags (coming soon)
│   ├── dart/
│   │   ├── events/       # kitbase_events
│   │   ├── changelogs/   # kitbase_changelogs (coming soon)
│   │   └── flags/        # kitbase_flags (coming soon)
│   ├── python/           # Python SDKs (coming soon)
│   └── php/              # PHP SDKs (coming soon)
└── ...
```

## Development

This is a monorepo containing SDKs for multiple languages.

### TypeScript

```bash
# Install dependencies
pnpm install

# Build all TypeScript packages
pnpm build

# Run tests
pnpm test
```

### Dart

```bash
cd packages/dart/events

# Get dependencies
dart pub get

# Run tests
dart test

# Analyze code
dart analyze
```

## License

MIT

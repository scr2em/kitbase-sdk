# Kitbase SDK

Official SDKs for [Kitbase](https://kitbase.io).

## Packages

### TypeScript / JavaScript

```bash
npm install @kitbase/sdk
```

| Import                        | Description       | Status |
| ----------------------------- | ----------------- | ------ |
| `@kitbase/sdk/events`         | Event tracking    | ✅     |
| `@kitbase/sdk/changelogs`     | Changelogs        | ✅     |
| `@kitbase/sdk/flags`          | Feature flags     | 🚧     |

### Dart / Flutter

| Package                                              | Description       | Status |
| ---------------------------------------------------- | ----------------- | ------ |
| [kitbase_events](./packages/dart/events)             | Event tracking    | ✅     |
| [kitbase_changelogs](./packages/dart/changelogs)     | Changelogs        | ✅     |
| kitbase_flags                                        | Feature flags     | 🚧     |

### Python (coming soon)

| Package            | Description       | Status |
| ------------------ | ----------------- | ------ |
| kitbase-events     | Event tracking    | 🚧     |
| kitbase-changelogs | Changelogs        | 🚧     |
| kitbase-flags      | Feature flags     | 🚧     |

### PHP (coming soon)

| Package            | Description       | Status |
| ------------------ | ----------------- | ------ |
| kitbase/events     | Event tracking    | 🚧     |
| kitbase/changelogs | Changelogs        | 🚧     |
| kitbase/flags      | Feature flags     | 🚧     |

## Quick Start

### TypeScript / JavaScript

```typescript
import { Kitbase } from '@kitbase/sdk/events';
import { Changelogs } from '@kitbase/sdk/changelogs';

// Track events
const kitbase = new Kitbase({ token: '<YOUR_API_KEY>' });
await kitbase.track({
  channel: 'payments',
  event: 'New Subscription',
  user_id: 'user-123',
  icon: '💰',
  notify: true,
});

// Fetch changelogs
const changelogs = new Changelogs({ token: '<YOUR_API_KEY>' });
const changelog = await changelogs.get('1.0.0');
console.log(changelog.markdown);
```

### Dart / Flutter

```dart
import 'package:kitbase_events/kitbase_events.dart';
import 'package:kitbase_changelogs/kitbase_changelogs.dart';

// Track events
final kitbase = Kitbase(token: '<YOUR_API_KEY>');
await kitbase.track(
  channel: 'payments',
  event: 'New Subscription',
  userId: 'user-123',
  icon: '💰',
  notify: true,
);

// Fetch changelogs
final changelogs = Changelogs(token: '<YOUR_API_KEY>');
final changelog = await changelogs.get('1.0.0');
print(changelog.markdown);
```

## Repository Structure

```
kitbase-sdk/
├── packages/
│   ├── typescript/
│   │   └── sdk/              # @kitbase/sdk (npm)
│   │       └── src/
│   │           ├── events/       # @kitbase/sdk/events
│   │           └── changelogs/   # @kitbase/sdk/changelogs
│   ├── dart/
│   │   ├── events/           # kitbase_events (pub.dev)
│   │   └── changelogs/       # kitbase_changelogs (pub.dev)
│   ├── python/               # (coming soon)
│   └── php/                  # (coming soon)
└── ...
```

## Development

### TypeScript

```bash
pnpm install
pnpm build
pnpm test
```

### Dart

```bash
cd packages/dart/events
dart pub get
dart test

cd packages/dart/changelogs
dart pub get
dart test
```

## License

MIT

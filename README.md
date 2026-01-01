# Kitbase SDK

Official SDKs for [Kitbase](https://kitbase.io).

## Packages

### TypeScript / JavaScript

```bash
npm install @kitbase/sdk
```

| Import                    | Description    | Status |
| ------------------------- | -------------- | ------ |
| `@kitbase/sdk/events`     | Event tracking | ✅     |
| `@kitbase/sdk/changelogs` | Changelogs     | ✅     |
| `@kitbase/sdk/flags`      | Feature flags  | 🚧     |

### Dart / Flutter

```yaml
dependencies:
  kitbase: ^0.1.0
```

| Import                           | Description    | Status |
| -------------------------------- | -------------- | ------ |
| `package:kitbase/events.dart`    | Event tracking | ✅     |
| `package:kitbase/changelogs.dart`| Changelogs     | ✅     |
| `package:kitbase/flags.dart`     | Feature flags  | 🚧     |

### Python (coming soon)

| Package            | Description    | Status |
| ------------------ | -------------- | ------ |
| kitbase-events     | Event tracking | 🚧     |
| kitbase-changelogs | Changelogs     | 🚧     |
| kitbase-flags      | Feature flags  | 🚧     |

### PHP (coming soon)

| Package            | Description    | Status |
| ------------------ | -------------- | ------ |
| kitbase/events     | Event tracking | 🚧     |
| kitbase/changelogs | Changelogs     | 🚧     |
| kitbase/flags      | Feature flags  | 🚧     |

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
});

// Fetch changelogs
const changelogs = new Changelogs({ token: '<YOUR_API_KEY>' });
const changelog = await changelogs.get('1.0.0');
console.log(changelog.markdown);
```

### Dart / Flutter

```dart
import 'package:kitbase/events.dart';
import 'package:kitbase/changelogs.dart';

// Track events
final events = KitbaseEvents(token: '<YOUR_API_KEY>');
await events.track(
  channel: 'payments',
  event: 'New Subscription',
  userId: 'user-123',
  icon: '💰',
);

// Fetch changelogs
final changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');
final changelog = await changelogs.get('1.0.0');
print(changelog.markdown);
```

## Repository Structure

```
kitbase-sdk/
├── packages/
│   ├── typescript/
│   │   └── sdk/                  # @kitbase/sdk (npm)
│   │       └── src/
│   │           ├── events/           # @kitbase/sdk/events
│   │           └── changelogs/       # @kitbase/sdk/changelogs
│   ├── dart/                     # kitbase (pub.dev)
│   │   └── lib/
│   │       ├── events.dart           # package:kitbase/events.dart
│   │       └── changelogs.dart       # package:kitbase/changelogs.dart
│   ├── python/                   # (coming soon)
│   └── php/                      # (coming soon)
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
cd packages/dart
dart pub get
dart test
dart analyze
```

## License

MIT

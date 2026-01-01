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
| `@kitbase/sdk/changelogs`     | Changelogs        | 🚧     |
| `@kitbase/sdk/flags`          | Feature flags     | 🚧     |

### Dart / Flutter

```yaml
dependencies:
  kitbase_events: ^0.1.0
```

| Package                                        | Description       | Status |
| ---------------------------------------------- | ----------------- | ------ |
| [kitbase_events](./packages/dart/events)       | Event tracking    | ✅     |
| kitbase_changelogs                             | Changelogs        | 🚧     |
| kitbase_flags                                  | Feature flags     | 🚧     |

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
│   │   └── sdk/              # @kitbase/sdk (npm)
│   │       └── src/
│   │           ├── events/       # @kitbase/sdk/events
│   │           ├── changelogs/   # @kitbase/sdk/changelogs (coming soon)
│   │           └── flags/        # @kitbase/sdk/flags (coming soon)
│   ├── dart/
│   │   ├── events/           # kitbase_events (pub.dev)
│   │   ├── changelogs/       # kitbase_changelogs (coming soon)
│   │   └── flags/            # kitbase_flags (coming soon)
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
dart analyze
```

## License

MIT

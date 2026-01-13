# Kitbase SDK

Official SDKs for [Kitbase](https://kitbase.io).

## Repository Structure

This monorepo is organized by **feature**, with each feature available in multiple languages/platforms:

```
kitbase-sdk/
├── customEvents/          # Event tracking
│   ├── typescript/        # @kitbase/events (npm)
│   ├── react/             # @kitbase/events-react (npm)
│   ├── dart/              # kitbase_events (pub.dev)
│   └── php/               # kitbase/events (packagist)
│
├── changelogs/            # Changelog management
│   ├── typescript/        # @kitbase/changelogs (npm)
│   ├── react/             # @kitbase/changelogs-react (npm)
│   ├── dart/              # kitbase_changelogs (pub.dev)
│   └── php/               # kitbase/changelogs (packagist)
│
├── flags/                 # Feature flags
│   ├── typescript/        # @kitbase/flags (npm)
│   ├── react/             # @kitbase/flags-react (npm)
│   ├── dart/              # kitbase_flags (pub.dev)
│   └── php/               # kitbase/flags (packagist)
│
└── ionic/                 # CLI tool for Ionic/Capacitor apps
```

## Packages

### Custom Events

Track events and logs in your application.

| Platform   | Package               | Install                          |
|------------|----------------------|----------------------------------|
| TypeScript | `@kitbase/events`     | `npm install @kitbase/events`    |
| React      | `@kitbase/events-react` | `npm install @kitbase/events-react` |
| Dart       | `kitbase_events`      | `dart pub add kitbase_events`    |
| PHP        | `kitbase/events`      | `composer require kitbase/events`|

### Changelogs

Fetch and display product changelogs.

| Platform   | Package                  | Install                             |
|------------|--------------------------|-------------------------------------|
| TypeScript | `@kitbase/changelogs`    | `npm install @kitbase/changelogs`   |
| React      | `@kitbase/changelogs-react` | `npm install @kitbase/changelogs-react` |
| Dart       | `kitbase_changelogs`     | `dart pub add kitbase_changelogs`   |
| PHP        | `kitbase/changelogs`     | `composer require kitbase/changelogs`|

### Feature Flags

Evaluate feature flags with OpenFeature support.

| Platform   | Package             | Install                        |
|------------|---------------------|--------------------------------|
| TypeScript | `@kitbase/flags`    | `npm install @kitbase/flags`   |
| React      | `@kitbase/flags-react` | `npm install @kitbase/flags-react` |
| Dart       | `kitbase_flags`     | `dart pub add kitbase_flags`   |
| PHP        | `kitbase/flags`     | `composer require kitbase/flags`|

## Quick Start

### TypeScript

```typescript
import { Kitbase } from '@kitbase/events';

const kitbase = new Kitbase({
  token: '<YOUR_API_KEY>',
  debug: true,
  offline: { enabled: true },
});

// Register super properties (included in all events)
kitbase.register({ app_version: '2.1.0', platform: 'web' });

// Track events
await kitbase.track({
  channel: 'payments',
  event: 'New Subscription',
  user_id: 'user-123',
  icon: '💰',
  notify: true,
});
```

### React

```tsx
import { EventsProvider, useTrack } from '@kitbase/events-react';

function App() {
  return (
    <EventsProvider token="<YOUR_API_KEY>">
      <MyComponent />
    </EventsProvider>
  );
}

function MyComponent() {
  const { track } = useTrack();

  return (
    <button onClick={() => track({ channel: 'ui', event: 'Button Clicked' })}>
      Click me
    </button>
  );
}
```

### Dart / Flutter

```dart
import 'package:kitbase_events/events.dart';

final events = KitbaseEvents(token: '<YOUR_API_KEY>');

await events.track(
  channel: 'payments',
  event: 'New Subscription',
  userId: 'user-123',
  icon: '💰',
);
```

### PHP

```php
use Kitbase\Events\Kitbase;
use Kitbase\Events\KitbaseConfig;
use Kitbase\Events\TrackOptions;

$kitbase = new Kitbase(new KitbaseConfig(
    token: '<YOUR_API_KEY>',
));

$kitbase->track(new TrackOptions(
    event: 'New Subscription',
    channel: 'payments',
    userId: 'user-123',
    icon: '💰',
));
```

## Development

### TypeScript/React packages

```bash
pnpm install
pnpm --filter @kitbase/events build
pnpm --filter @kitbase/events test
```

### Dart packages

```bash
cd customEvents/dart
dart pub get
dart test
dart analyze
```

### PHP packages

```bash
cd customEvents/php
composer install
composer test
```

## License

MIT

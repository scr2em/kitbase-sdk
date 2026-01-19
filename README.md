# Kitbase SDK

Official SDKs for [Kitbase](https://kitbase.io).

## Repository Structure

This monorepo is organized by **feature**, with each feature available in multiple languages/platforms:

```
kitbase-sdk/
├── customEvents/          # Analytics & Event tracking
│   ├── typescript/        # @kitbase/analytics (npm)
│   │   ├── packages/core      # @kitbase/analytics
│   │   ├── packages/react     # @kitbase/analytics-react
│   │   └── packages/angular   # @kitbase/analytics-angular
│   ├── dart/              # kitbase_analytics (pub.dev)
│   └── php/               # kitbase/analytics (packagist)
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

### Analytics (Custom Events)

Track events and analytics in your application.

| Platform   | Package                    | Install                               |
|------------|----------------------------|---------------------------------------|
| TypeScript | `@kitbase/analytics`       | `npm install @kitbase/analytics`      |
| React      | `@kitbase/analytics-react` | `npm install @kitbase/analytics-react`|
| Angular    | `@kitbase/analytics-angular`| `npm install @kitbase/analytics-angular`|
| Dart       | `kitbase_analytics`        | `dart pub add kitbase_analytics`      |
| PHP        | `kitbase/analytics`        | `composer require kitbase/analytics`  |

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
import { KitbaseAnalytics } from '@kitbase/analytics';

const analytics = new KitbaseAnalytics({
  token: '<YOUR_API_KEY>',
  debug: true,
  offline: { enabled: true },
});

// Register super properties (included in all events)
analytics.register({ app_version: '2.1.0', platform: 'web' });

// Track events
await analytics.track({
  channel: 'payments',
  event: 'New Subscription',
  user_id: 'user-123',
  icon: '💰',
  notify: true,
});
```

### React

```tsx
import { KitbaseAnalyticsProvider, useTrack } from '@kitbase/analytics-react';

function App() {
  return (
    <KitbaseAnalyticsProvider config={{ token: '<YOUR_API_KEY>' }}>
      <MyComponent />
    </KitbaseAnalyticsProvider>
  );
}

function MyComponent() {
  const track = useTrack();

  return (
    <button onClick={() => track({ channel: 'ui', event: 'Button Clicked' })}>
      Click me
    </button>
  );
}
```

### Angular

```typescript
// app.config.ts
import { provideKitbaseAnalytics } from '@kitbase/analytics-angular';

export const appConfig = {
  providers: [
    provideKitbaseAnalytics({ token: '<YOUR_API_KEY>' }),
  ],
};

// component.ts
import { KitbaseAnalyticsService } from '@kitbase/analytics-angular';

@Component({ ... })
export class MyComponent {
  constructor(private analytics: KitbaseAnalyticsService) {}

  onClick() {
    this.analytics.track({ channel: 'ui', event: 'Button Clicked' });
  }
}
```

### Dart / Flutter

```dart
import 'package:kitbase_analytics/analytics.dart';

final analytics = KitbaseAnalytics(token: '<YOUR_API_KEY>');

await analytics.track(
  channel: 'payments',
  event: 'New Subscription',
  userId: 'user-123',
  icon: '💰',
);
```

### PHP

```php
use Kitbase\Analytics\KitbaseAnalytics;
use Kitbase\Analytics\KitbaseConfig;
use Kitbase\Analytics\TrackOptions;

$analytics = new KitbaseAnalytics(new KitbaseConfig(
    token: '<YOUR_API_KEY>',
));

$analytics->track(new TrackOptions(
    event: 'New Subscription',
    channel: 'payments',
    userId: 'user-123',
    icon: '💰',
));
```

## Development

### TypeScript/React/Angular packages

```bash
cd customEvents/typescript
pnpm install
pnpm build
pnpm test
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

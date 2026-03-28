# kitbase_analytics

Kitbase Analytics SDK for Dart and Flutter. Track events and logs in your application with a simple, type-safe API.

**[Full Documentation](https://docs.kitbase.dev/sdks/dart)**

## Installation

Add `kitbase_analytics` to your `pubspec.yaml`:

```yaml
dependencies:
  kitbase_analytics: ^0.1.0
```

## Quick Start

```dart
import 'package:kitbase_analytics/events.dart';

final events = KitbaseAnalytics();

final response = await events.track(
  channel: 'payments',
  event: 'New Subscription',
  userId: 'user-123',
  tags: {'plan': 'premium'},
);
```

## License

MIT

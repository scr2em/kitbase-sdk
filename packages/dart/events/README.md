# kitbase_events

Kitbase Events SDK for Dart and Flutter. Track events and logs in your application.

## Installation

Add `kitbase_events` to your `pubspec.yaml`:

```yaml
dependencies:
  kitbase_events: ^0.1.0
```

Then run:

```bash
dart pub get
# or for Flutter
flutter pub get
```

## Quick Start

```dart
import 'package:kitbase_events/kitbase_events.dart';

final kitbase = Kitbase(token: '<YOUR_API_KEY>');

// Track an event
await kitbase.track(
  channel: 'payments',
  event: 'New Subscription',
  userId: 'user-123',
  icon: '💰',
  notify: true,
  description: 'User subscribed to premium plan',
  tags: {
    'plan': 'premium',
    'cycle': 'monthly',
    'trial': false,
  },
);

// Don't forget to close the client when done
kitbase.close();
```

## Configuration

```dart
final kitbase = Kitbase(
  // Required: Your Kitbase API key
  token: '<YOUR_API_KEY>',
);
```

## API

### `kitbase.track(...)`

Track an event.

```dart
Future<TrackResponse> track({
  // Required: The channel/category for the event
  required String channel,

  // Required: The name of the event
  required String event,

  // Optional: User identifier
  String? userId,

  // Optional: Icon (emoji or icon name)
  String? icon,

  // Optional: Send a notification
  bool? notify,

  // Optional: Event description
  String? description,

  // Optional: Additional metadata tags
  Map<String, dynamic>? tags,
})
```

**Returns:** `Future<TrackResponse>`

```dart
class TrackResponse {
  final String id;
  final String event;
  final String timestamp;
}
```

## Error Handling

The SDK provides typed exceptions for precise error handling:

```dart
import 'package:kitbase_events/kitbase_events.dart';

try {
  await kitbase.track(
    channel: 'payments',
    event: 'New Subscription',
  );
} on AuthenticationException {
  // Invalid API key
} on ValidationException catch (e) {
  // Missing required fields
  print(e.field);
} on TimeoutException {
  // Request timed out
} on ApiException catch (e) {
  // API returned an error
  print(e.statusCode);
  print(e.response);
} on KitbaseException catch (e) {
  // Generic SDK error
  print(e.message);
}
```

## Flutter Usage

For Flutter apps, you might want to create a singleton or use a dependency injection solution:

```dart
// Using a simple singleton
class KitbaseService {
  static final KitbaseService _instance = KitbaseService._internal();
  late final Kitbase _client;

  factory KitbaseService() => _instance;

  KitbaseService._internal() {
    _client = Kitbase(token: '<YOUR_API_KEY>');
  }

  Future<TrackResponse> track({
    required String channel,
    required String event,
    String? userId,
    String? icon,
    bool? notify,
    String? description,
    Map<String, dynamic>? tags,
  }) {
    return _client.track(
      channel: channel,
      event: event,
      userId: userId,
      icon: icon,
      notify: notify,
      description: description,
      tags: tags,
    );
  }
}
```

## Requirements

- Dart SDK >= 3.0.0

## License

MIT


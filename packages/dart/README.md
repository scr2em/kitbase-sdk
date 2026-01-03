# kitbase

Official Kitbase SDK for Dart and Flutter.

## Installation

Add `kitbase` to your `pubspec.yaml`:

```yaml
dependencies:
  kitbase: ^0.1.0
```

Then run:

```bash
dart pub get
# or for Flutter
flutter pub get
```

## Features

Import what you need:

```dart
// Import everything
import 'package:kitbase/kitbase.dart';

// Or import specific features
import 'package:kitbase/events.dart';
import 'package:kitbase/changelogs.dart';
```

---

## Events

Track events and logs in your application.

```dart
import 'package:kitbase/events.dart';

final events = KitbaseEvents(token: '<YOUR_API_KEY>');

await events.track(
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

// Don't forget to close when done
events.close();
```

### `events.track(...)`

| Parameter     | Type                   | Required | Description              |
| ------------- | ---------------------- | -------- | ------------------------ |
| `channel`     | `String`               | ✅       | Channel/category         |
| `event`       | `String`               | ✅       | Event name               |
| `userId`      | `String?`              | –        | User identifier          |
| `icon`        | `String?`              | –        | Emoji or icon name       |
| `notify`      | `bool?`                | –        | Send notification        |
| `description` | `String?`              | –        | Event description        |
| `tags`        | `Map<String, dynamic>?`| –        | Additional metadata      |

---

## Changelogs

Fetch version changelogs for your application.

```dart
import 'package:kitbase/changelogs.dart';

final changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');

final changelog = await changelogs.get('1.0.0');
print(changelog.version);   // "1.0.0"
print(changelog.markdown);  // "## What's New\n\n- Feature X..."

// Don't forget to close when done
changelogs.close();
```

### `changelogs.get(version)`

Returns a `ChangelogResponse`:

```dart
class ChangelogResponse {
  final String id;
  final String version;
  final String markdown;      // Markdown content
  final bool isPublished;
  final String projectId;
  final String createdAt;
  final String updatedAt;
}
```

---

## Error Handling

### Events Errors

```dart
try {
  await events.track(channel: 'test', event: 'Test');
} on EventsAuthenticationException {
  // Invalid API key
} on EventsValidationException catch (e) {
  print(e.field);  // Which field failed
} on EventsTimeoutException {
  // Request timed out
} on EventsApiException catch (e) {
  print(e.statusCode);
} on KitbaseEventsException catch (e) {
  print(e.message);
}
```

### Changelogs Errors

```dart
try {
  await changelogs.get('1.0.0');
} on ChangelogsAuthenticationException {
  // Invalid API key
} on ChangelogsNotFoundException catch (e) {
  print('Version ${e.version} not found');
} on ChangelogsValidationException catch (e) {
  print(e.field);
} on ChangelogsTimeoutException {
  // Request timed out
} on ChangelogsApiException catch (e) {
  print(e.statusCode);
} on KitbaseChangelogsException catch (e) {
  print(e.message);
}
```

---

## Flutter Usage

```dart
// Singleton pattern
class KitbaseService {
  static final KitbaseService _instance = KitbaseService._internal();
  late final KitbaseEvents _events;
  late final KitbaseChangelogs _changelogs;

  factory KitbaseService() => _instance;

  KitbaseService._internal() {
    _events = KitbaseEvents(token: '<YOUR_API_KEY>');
    _changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');
  }

  Future<TrackResponse> track({
    required String channel,
    required String event,
    String? userId,
    String? icon,
    bool? notify,
    Map<String, dynamic>? tags,
  }) {
    return _events.track(
      channel: channel,
      event: event,
      userId: userId,
      icon: icon,
      notify: notify,
      tags: tags,
    );
  }

  Future<ChangelogResponse> getChangelog(String version) {
    return _changelogs.get(version);
  }
}
```

## Requirements

- Dart SDK >= 3.0.0

## License

MIT





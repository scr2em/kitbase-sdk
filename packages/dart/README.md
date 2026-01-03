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
import 'package:kitbase/flags.dart';
```

---

## Feature Flags

Evaluate feature flags in your application with targeting support.

```dart
import 'package:kitbase/flags.dart';

final flags = KitbaseFlags(token: '<YOUR_API_KEY>');

// Simple boolean check
final isEnabled = await flags.getBooleanValue('dark-mode', false);

// With targeting context
final isPremiumFeature = await flags.getBooleanValue(
  'premium-feature',
  false,
  context: EvaluationContext(
    targetingKey: 'user-123',
    attributes: {'plan': 'premium', 'country': 'US'},
  ),
);

// Other value types
final apiUrl = await flags.getStringValue('api-url', 'https://default.api');
final maxItems = await flags.getNumberValue('max-items', 50);
final config = await flags.getJsonValue<Map<String, dynamic>>('ui-config', {});

// Get full resolution details
final details = await flags.getBooleanDetails('feature-x', false);
print('Value: ${details.value}');
print('Reason: ${details.reason}');
print('Variant: ${details.variant}');

// Get all flags as a snapshot
final snapshot = await flags.getSnapshot();
for (final flag in snapshot.flags) {
  print('${flag.flagKey}: ${flag.value}');
}

// Don't forget to close when done
flags.close();
```

### Value Methods

| Method | Return Type | Description |
| ------ | ----------- | ----------- |
| `getBooleanValue(key, default, {context})` | `Future<bool>` | Get boolean flag value |
| `getStringValue(key, default, {context})` | `Future<String>` | Get string flag value |
| `getNumberValue(key, default, {context})` | `Future<num>` | Get number flag value |
| `getJsonValue<T>(key, default, {context})` | `Future<T>` | Get JSON flag value |

### Details Methods

| Method | Return Type | Description |
| ------ | ----------- | ----------- |
| `getBooleanDetails(key, default, {context})` | `Future<ResolutionDetails<bool>>` | Get boolean with resolution details |
| `getStringDetails(key, default, {context})` | `Future<ResolutionDetails<String>>` | Get string with resolution details |
| `getNumberDetails(key, default, {context})` | `Future<ResolutionDetails<num>>` | Get number with resolution details |
| `getJsonDetails<T>(key, default, {context})` | `Future<ResolutionDetails<T>>` | Get JSON with resolution details |

### Other Methods

| Method | Return Type | Description |
| ------ | ----------- | ----------- |
| `getSnapshot({options})` | `Future<FlagSnapshot>` | Get all evaluated flags |
| `evaluateFlag(key, {context, defaultValue})` | `Future<EvaluatedFlag>` | Evaluate a single flag |

### OpenFeature Integration

For OpenFeature ecosystem integration, use the provider:

```dart
import 'package:openfeature_dart_server_sdk/open_feature_api.dart';
import 'package:openfeature_dart_server_sdk/client.dart';
import 'package:openfeature_dart_server_sdk/hooks.dart';
import 'package:openfeature_dart_server_sdk/evaluation_context.dart';
import 'package:kitbase/flags/openfeature.dart';

// Register the Kitbase provider
final api = OpenFeatureAPI();
api.setProvider(KitbaseProvider(
  options: KitbaseProviderOptions(token: '<YOUR_API_KEY>'),
));

// Create a client
final client = FeatureClient(
  metadata: ClientMetadata(name: 'my-app'),
  hookManager: HookManager(),
  defaultContext: EvaluationContext(attributes: {}),
);

// Evaluate flags using the OpenFeature API
final isEnabled = await client.getBooleanFlag(
  'dark-mode',
  defaultValue: false,
  context: EvaluationContext(attributes: {
    'targetingKey': 'user-123',
  }),
);
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

### Flags Errors

```dart
try {
  await flags.getBooleanValue('my-flag', false);
} on FlagsAuthenticationException {
  // Invalid API key
} on FlagNotFoundException catch (e) {
  print('Flag ${e.flagKey} not found');
} on TypeMismatchException catch (e) {
  print('Expected ${e.expectedType}, got ${e.actualType}');
} on FlagsValidationException catch (e) {
  print(e.field);
} on FlagsTimeoutException {
  // Request timed out
} on FlagsApiException catch (e) {
  print(e.statusCode);
} on KitbaseFlagsException catch (e) {
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
  late final KitbaseFlags _flags;

  factory KitbaseService() => _instance;

  KitbaseService._internal() {
    _events = KitbaseEvents(token: '<YOUR_API_KEY>');
    _changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');
    _flags = KitbaseFlags(token: '<YOUR_API_KEY>');
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

  Future<bool> isFeatureEnabled(String flagKey, {String? userId}) {
    return _flags.getBooleanValue(
      flagKey,
      false,
      context: userId != null
          ? EvaluationContext(targetingKey: userId)
          : null,
    );
  }
}
```

## Requirements

- Dart SDK >= 3.0.0

## License

MIT

# Kitbase SDK for Dart & Flutter

Official Kitbase SDK for Dart and Flutter applications.

[![Pub Version](https://img.shields.io/pub/v/kitbase)](https://pub.dev/packages/kitbase)
[![Dart SDK](https://img.shields.io/badge/Dart-%3E%3D3.0.0-blue)](https://dart.dev)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Feature Flags](#feature-flags)
- [Events](#events)
- [Changelogs](#changelogs)
- [Error Handling](#error-handling)
- [Flutter Integration](#flutter-integration)

---

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

---

## Quick Start

```dart
// Import everything
import 'package:kitbase/kitbase.dart';

// Or import only what you need
import 'package:kitbase/flags.dart';
import 'package:kitbase/events.dart';
import 'package:kitbase/changelogs.dart';
```

---

## Feature Flags

Evaluate feature flags with targeting and percentage rollouts.

### Basic Usage

```dart
import 'package:kitbase/flags.dart';

final flags = KitbaseFlags(token: '<YOUR_API_KEY>');

// Simple boolean check
final darkMode = await flags.getBooleanValue('dark-mode', false);

// With targeting context
final premiumFeature = await flags.getBooleanValue(
  'premium-feature',
  false,
  context: EvaluationContext(
    targetingKey: 'user-123',
    attributes: {'plan': 'premium', 'country': 'US'},
  ),
);

// Don't forget to close when done
flags.close();
```

### All Value Types

```dart
// Boolean
final isEnabled = await flags.getBooleanValue('feature', false);

// String
final apiUrl = await flags.getStringValue('api-url', 'https://default.api');

// Number
final maxItems = await flags.getNumberValue('max-items', 50);

// JSON
final config = await flags.getJsonValue<Map<String, dynamic>>('ui-config', {});
```

### Resolution Details

Get detailed information about flag evaluation:

```dart
final details = await flags.getBooleanDetails('feature-x', false);

print(details.value);        // true
print(details.reason);       // ResolutionReason.targetingMatch
print(details.variant);      // "treatment-a"
print(details.flagMetadata); // {name: "Feature X"}
```

### Flag Snapshot

Fetch all flags at once:

```dart
final snapshot = await flags.getSnapshot(
  options: EvaluateOptions(
    context: EvaluationContext(targetingKey: 'user-123'),
  ),
);

for (final flag in snapshot.flags) {
  print('${flag.flagKey}: ${flag.value} (${flag.valueType})');
}
```

### API Reference

#### Value Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getBooleanValue(key, default, {context})` | `Future<bool>` | Get boolean value |
| `getStringValue(key, default, {context})` | `Future<String>` | Get string value |
| `getNumberValue(key, default, {context})` | `Future<num>` | Get number value |
| `getJsonValue<T>(key, default, {context})` | `Future<T>` | Get JSON value |

#### Details Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getBooleanDetails(key, default, {context})` | `Future<ResolutionDetails<bool>>` | Boolean with details |
| `getStringDetails(key, default, {context})` | `Future<ResolutionDetails<String>>` | String with details |
| `getNumberDetails(key, default, {context})` | `Future<ResolutionDetails<num>>` | Number with details |
| `getJsonDetails<T>(key, default, {context})` | `Future<ResolutionDetails<T>>` | JSON with details |

#### Other Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getSnapshot({options})` | `Future<FlagSnapshot>` | Get all flags |
| `evaluateFlag(key, {context, defaultValue})` | `Future<EvaluatedFlag>` | Evaluate single flag |

### OpenFeature Integration

For projects using [OpenFeature](https://openfeature.dev), we provide a compatible provider:

```dart
import 'package:openfeature_dart_server_sdk/open_feature_api.dart';
import 'package:openfeature_dart_server_sdk/client.dart';
import 'package:openfeature_dart_server_sdk/hooks.dart';
import 'package:openfeature_dart_server_sdk/evaluation_context.dart';
import 'package:kitbase/flags/openfeature.dart';

// Register provider
final api = OpenFeatureAPI();
api.setProvider(KitbaseProvider(
  options: KitbaseProviderOptions(token: '<YOUR_API_KEY>'),
));

// Create client
final client = FeatureClient(
  metadata: ClientMetadata(name: 'my-app'),
  hookManager: HookManager(),
  defaultContext: EvaluationContext(attributes: {}),
);

// Evaluate flags
final isEnabled = await client.getBooleanFlag(
  'dark-mode',
  defaultValue: false,
);
```

---

## Events

Track events and logs in your application.

### Basic Usage

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

events.close();
```

### API Reference

#### `events.track(...)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | `String` | ✅ | Channel/category |
| `event` | `String` | ✅ | Event name |
| `userId` | `String?` | – | User identifier |
| `icon` | `String?` | – | Emoji or icon name |
| `notify` | `bool?` | – | Send notification |
| `description` | `String?` | – | Event description |
| `tags` | `Map<String, dynamic>?` | – | Additional metadata |

#### Response

```dart
class TrackResponse {
  final String id;        // Event ID
  final String event;     // Event name
  final String timestamp; // Server timestamp
}
```

---

## Changelogs

Fetch version changelogs for your application.

### Basic Usage

```dart
import 'package:kitbase/changelogs.dart';

final changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');

final changelog = await changelogs.get('1.0.0');
print(changelog.version);   // "1.0.0"
print(changelog.markdown);  // "## What's New\n\n- Feature X..."

changelogs.close();
```

### API Reference

#### `changelogs.get(version)`

Returns a `ChangelogResponse`:

```dart
class ChangelogResponse {
  final String id;
  final String version;
  final String markdown;    // Markdown content
  final bool isPublished;
  final String projectId;
  final String createdAt;
  final String updatedAt;
}
```

---

## Error Handling

All modules throw specific exceptions for different error cases.

### Feature Flags

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
  print('Validation error: ${e.field}');
} on FlagsTimeoutException {
  // Request timed out
} on FlagsApiException catch (e) {
  print('API error: ${e.statusCode}');
}
```

### Events

```dart
try {
  await events.track(channel: 'test', event: 'Test');
} on EventsAuthenticationException {
  // Invalid API key
} on EventsValidationException catch (e) {
  print('Validation error: ${e.field}');
} on EventsTimeoutException {
  // Request timed out
} on EventsApiException catch (e) {
  print('API error: ${e.statusCode}');
}
```

### Changelogs

```dart
try {
  await changelogs.get('1.0.0');
} on ChangelogsAuthenticationException {
  // Invalid API key
} on ChangelogsNotFoundException catch (e) {
  print('Version ${e.version} not found');
} on ChangelogsValidationException catch (e) {
  print('Validation error: ${e.field}');
} on ChangelogsTimeoutException {
  // Request timed out
} on ChangelogsApiException catch (e) {
  print('API error: ${e.statusCode}');
}
```

---

## Flutter Integration

Example singleton service for Flutter apps:

```dart
import 'package:kitbase/kitbase.dart';

class KitbaseService {
  static final KitbaseService _instance = KitbaseService._internal();
  
  late final KitbaseFlags _flags;
  late final KitbaseEvents _events;
  late final KitbaseChangelogs _changelogs;

  factory KitbaseService() => _instance;

  KitbaseService._internal() {
    const token = '<YOUR_API_KEY>';
    _flags = KitbaseFlags(token: token);
    _events = KitbaseEvents(token: token);
    _changelogs = KitbaseChangelogs(token: token);
  }

  // Feature Flags
  Future<bool> isFeatureEnabled(String key, {String? userId}) {
    return _flags.getBooleanValue(
      key,
      false,
      context: userId != null 
          ? EvaluationContext(targetingKey: userId) 
          : null,
    );
  }

  // Events
  Future<TrackResponse> trackEvent({
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

  // Changelogs
  Future<ChangelogResponse> getChangelog(String version) {
    return _changelogs.get(version);
  }

  // Cleanup
  void dispose() {
    _flags.close();
    _events.close();
    _changelogs.close();
  }
}
```

**Usage in widgets:**

```dart
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: KitbaseService().isFeatureEnabled('new-ui', userId: 'user-123'),
      builder: (context, snapshot) {
        if (snapshot.data == true) {
          return NewUIWidget();
        }
        return OldUIWidget();
      },
    );
  }
}
```

---

## Requirements

- Dart SDK >= 3.0.0

## License

MIT

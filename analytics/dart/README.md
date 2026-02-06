# kitbase_analytics

Kitbase Analytics SDK for Dart and Flutter. Track events and logs in your application with a simple, type-safe API.

## Installation

Add `kitbase_analytics` to your `pubspec.yaml`:

```yaml
dependencies:
  kitbase_analytics: ^0.1.0
```

Then run:

```sh
dart pub get
```

## Quick Start

```dart
import 'package:kitbase_analytics/events.dart';

final events = KitbaseAnalytics();

final response = await events.track(
  channel: 'payments',
  event: 'New Subscription',
  userId: 'user-123',
  icon: '💰',
  notify: true,
  tags: {'plan': 'premium', 'cycle': 'monthly'},
);

print(response.id);        // unique event ID
print(response.event);     // "New Subscription"
print(response.timestamp); // ISO 8601 timestamp
```

## API Reference

### `KitbaseAnalytics`

Create an instance to start tracking events. The SDK communicates with the Kitbase API at `https://api.kitbase.dev`.

### `track()`

Send an event to Kitbase.

| Parameter     | Type                    | Required | Description                        |
|---------------|-------------------------|----------|------------------------------------|
| `channel`     | `String`                | Yes      | Category for the event             |
| `event`       | `String`                | Yes      | Name of the event                  |
| `userId`      | `String?`               | No       | User identifier                    |
| `icon`        | `String?`               | No       | Emoji or icon name                 |
| `notify`      | `bool?`                 | No       | Whether to send a notification     |
| `description` | `String?`               | No       | Event description                  |
| `tags`        | `Map<String, dynamic>?` | No       | Key-value metadata for the event   |

### Response

`track()` returns a `Future<TrackResponse>` with the following fields:

| Field       | Type     | Description              |
|-------------|----------|--------------------------|
| `id`        | `String` | Unique event identifier  |
| `event`     | `String` | Name of the tracked event|
| `timestamp` | `String` | ISO 8601 timestamp       |

## Error Handling

The SDK throws typed exceptions so you can handle each failure case precisely.

```dart
import 'package:kitbase_analytics/events.dart';

final events = KitbaseAnalytics();

try {
  await events.track(
    channel: 'payments',
    event: 'New Subscription',
  );
} on KitbaseValidationException catch (e) {
  // A required field is missing or invalid
  print('Validation error on field: ${e.field}');
} on KitbaseAuthenticationException {
  // The API key is invalid or missing
  print('Authentication failed');
} on KitbaseApiException catch (e) {
  // The API returned a non-success status code
  print('API error ${e.statusCode}: ${e.response}');
} on KitbaseTimeoutException {
  // The request timed out
  print('Request timed out');
} on KitbaseConnectionException {
  // A network error occurred
  print('Connection failed');
}
```

### Exception Types

| Exception                        | Description                          | Properties              |
|----------------------------------|--------------------------------------|-------------------------|
| `KitbaseValidationException`     | Required field missing or invalid    | `field`                 |
| `KitbaseAuthenticationException` | Invalid or missing API key           | --                      |
| `KitbaseApiException`            | API returned an error response       | `statusCode`, `response`|
| `KitbaseConnectionException`     | Network connectivity error           | --                      |
| `KitbaseTimeoutException`        | Request exceeded the time limit      | --                      |

## Requirements

- Dart SDK `>=3.0.0 <4.0.0`

## Documentation

For full documentation, visit [docs.kitbase.dev](https://docs.kitbase.dev).

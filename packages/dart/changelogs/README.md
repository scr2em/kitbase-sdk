# kitbase_changelogs

Kitbase Changelogs SDK for Dart and Flutter. Fetch version changelogs in your application.

## Installation

Add `kitbase_changelogs` to your `pubspec.yaml`:

```yaml
dependencies:
  kitbase_changelogs: ^0.1.0
```

Then run:

```bash
dart pub get
# or for Flutter
flutter pub get
```

## Quick Start

```dart
import 'package:kitbase_changelogs/kitbase_changelogs.dart';

final changelogs = Changelogs(token: '<YOUR_API_KEY>');

// Get a changelog by version
final changelog = await changelogs.get('1.0.0');
print(changelog.version);
print(changelog.markdown);

// Don't forget to close the client when done
changelogs.close();
```

## API

### `changelogs.get(version)`

Get a published changelog by version.

```dart
final changelog = await changelogs.get('1.0.0');
```

**Returns:** `Future<ChangelogResponse>`

```dart
class ChangelogResponse {
  final String id;
  final String version;
  final String markdown;      // Changelog content in Markdown format
  final bool isPublished;
  final String projectId;
  final String createdAt;
  final String updatedAt;
}
```

## Error Handling

The SDK provides typed exceptions for precise error handling:

```dart
import 'package:kitbase_changelogs/kitbase_changelogs.dart';

try {
  final changelog = await changelogs.get('1.0.0');
} on AuthenticationException {
  // Invalid API key
} on NotFoundException catch (e) {
  // Changelog not found
  print('Version ${e.version} not found');
} on ValidationException catch (e) {
  // Missing required fields
  print(e.field);
} on TimeoutException {
  // Request timed out
} on ApiException catch (e) {
  // API returned an error
  print(e.statusCode);
  print(e.response);
} on ChangelogsException catch (e) {
  // Generic SDK error
  print(e.message);
}
```

## Flutter Usage

```dart
class ChangelogService {
  static final ChangelogService _instance = ChangelogService._internal();
  late final Changelogs _client;

  factory ChangelogService() => _instance;

  ChangelogService._internal() {
    _client = Changelogs(token: '<YOUR_API_KEY>');
  }

  Future<ChangelogResponse> getChangelog(String version) {
    return _client.get(version);
  }
}
```

## Requirements

- Dart SDK >= 3.0.0

## License

MIT


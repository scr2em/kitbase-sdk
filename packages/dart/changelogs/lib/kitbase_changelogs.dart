/// Kitbase Changelogs SDK for Dart/Flutter
///
/// Fetch version changelogs in your application.
///
/// ```dart
/// import 'package:kitbase_changelogs/kitbase_changelogs.dart';
///
/// final changelogs = Changelogs(token: '<YOUR_API_KEY>');
///
/// final changelog = await changelogs.get('1.0.0');
/// print(changelog.version);
/// print(changelog.markdown);
/// ```
library kitbase_changelogs;

export 'src/changelogs.dart';
export 'src/types.dart';
export 'src/exceptions.dart';


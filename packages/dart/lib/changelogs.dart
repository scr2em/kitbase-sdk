/// Kitbase Changelogs SDK for Dart/Flutter
///
/// Fetch version changelogs in your application.
///
/// ```dart
/// import 'package:kitbase/changelogs.dart';
///
/// final changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');
/// final changelog = await changelogs.get('1.0.0');
/// print(changelog.markdown);
/// ```
library kitbase.changelogs;

export 'src/changelogs/client.dart';
export 'src/changelogs/types.dart';
export 'src/changelogs/exceptions.dart';


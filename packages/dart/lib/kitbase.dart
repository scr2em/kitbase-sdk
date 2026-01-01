/// Kitbase SDK for Dart/Flutter
///
/// Official SDK for Kitbase - Events tracking and changelogs.
///
/// ## Events
///
/// ```dart
/// import 'package:kitbase/kitbase.dart';
///
/// final events = KitbaseEvents(token: '<YOUR_API_KEY>');
/// await events.track(
///   channel: 'payments',
///   event: 'New Subscription',
///   userId: 'user-123',
/// );
/// ```
///
/// ## Changelogs
///
/// ```dart
/// import 'package:kitbase/kitbase.dart';
///
/// final changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');
/// final changelog = await changelogs.get('1.0.0');
/// print(changelog.markdown);
/// ```
library kitbase;

// Events
export 'src/events/client.dart';
export 'src/events/types.dart';
export 'src/events/exceptions.dart';

// Changelogs
export 'src/changelogs/client.dart';
export 'src/changelogs/types.dart';
export 'src/changelogs/exceptions.dart';



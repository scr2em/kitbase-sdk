/// Kitbase SDK for Dart/Flutter
///
/// Official SDK for Kitbase - Events tracking, changelogs, and feature flags.
///
/// ## Getting Started
///
/// Initialize the SDK once on app startup:
/// ```dart
/// import 'package:kitbase/kitbase.dart';
///
/// Kitbase.init(config: KitbaseConfig(token: '<YOUR_API_KEY>'));
/// ```
///
/// ## Events
///
/// ```dart
/// await Kitbase.events.track(
///   channel: 'payments',
///   event: 'New Subscription',
///   userId: 'user-123',
/// );
/// ```
///
/// ## Changelogs
///
/// ```dart
/// final changelogs = KitbaseChangelogs(token: '<YOUR_API_KEY>');
/// final changelog = await changelogs.get('1.0.0');
/// print(changelog.markdown);
/// ```
///
/// ## Feature Flags
///
/// ```dart
/// final flags = KitbaseFlags(token: '<YOUR_API_KEY>');
/// final isEnabled = await flags.getBooleanValue('dark-mode', false);
/// ```
library kitbase;

// SDK Entry Point
export 'src/kitbase_sdk.dart';

// Events
export 'src/events/kitbase_events.dart';
export 'src/events/domain/entities/track_options.dart';
export 'src/events/domain/entities/track_response.dart';
export 'src/core/exceptions/exceptions.dart';

// Changelogs
export 'src/changelogs/client.dart';
export 'src/changelogs/types.dart';
export 'src/changelogs/exceptions.dart';

// Flags
export 'src/flags/client.dart';
export 'src/flags/types.dart';
export 'src/flags/exceptions.dart';

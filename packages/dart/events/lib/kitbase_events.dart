/// Kitbase Events SDK for Dart/Flutter
///
/// Track events and logs in your application.
///
/// ```dart
/// import 'package:kitbase_events/kitbase_events.dart';
///
/// final kitbase = Kitbase(token: '<YOUR_API_KEY>');
///
/// await kitbase.track(
///   channel: 'payments',
///   event: 'New Subscription',
///   userId: 'user-123',
///   icon: '💰',
///   notify: true,
///   tags: {'plan': 'premium'},
/// );
/// ```
library kitbase_events;

export 'src/kitbase.dart';
export 'src/types.dart';
export 'src/exceptions.dart';


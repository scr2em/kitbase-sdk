/// Kitbase Events SDK for Dart/Flutter
///
/// Track events and logs in your application.
///
/// ```dart
/// import 'package:kitbase/events.dart';
///
/// final events = KitbaseEvents(token: '<YOUR_API_KEY>');
/// await events.track(
///   channel: 'payments',
///   event: 'New Subscription',
///   userId: 'user-123',
///   icon: '💰',
///   notify: true,
/// );
/// ```
library kitbase.events;

export 'src/events/client.dart';
export 'src/events/types.dart';
export 'src/events/exceptions.dart';



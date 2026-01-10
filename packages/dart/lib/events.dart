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

export 'src/events/kitbase_events.dart';
export 'src/events/domain/entities/track_options.dart';
export 'src/events/domain/entities/track_response.dart';
export 'src/events/domain/repos/events_repository.dart';
export 'src/core/exceptions/exceptions.dart';

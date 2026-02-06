/// Kitbase Events SDK for Dart/Flutter
///
/// Track events and logs in your application.
///
/// ```dart
/// import 'package:kitbase_analytics/events.dart';
///
/// final events = KitbaseAnalytics(token: '<YOUR_API_KEY>');
/// await events.track(
///   channel: 'payments',
///   event: 'New Subscription',
///   userId: 'user-123',
///   icon: '💰',
///   notify: true,
/// );
/// ```
library kitbase_analytics;

export 'src/kitbase_analytics.dart';
export 'src/domain/entities/track_options.dart';
export 'src/domain/entities/track_response.dart';
export 'src/domain/repos/events_repository.dart';
export 'src/core/exceptions/exceptions.dart';

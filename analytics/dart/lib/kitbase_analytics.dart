/// Kitbase Analytics SDK for Dart/Flutter
///
/// Track events and logs in your application.
///
/// ```dart
/// import 'package:kitbase_analytics/analytics.dart';
///
/// final analytics = KitbaseAnalytics(
///   KitbaseConfig(token: '<YOUR_API_KEY>'),
/// );
///
/// await analytics.track(TrackOptions(
///   channel: 'payments',
///   event: 'New Subscription',
///   userId: 'user-123',
///   icon: '💰',
///   notify: true,
/// ));
/// ```
library kitbase_analytics;

// Main client
export 'package:kitbase_analytics/src/core/client/kitbase_analytics.dart';

// Configuration
export 'package:kitbase_analytics/src/domain/entities/config.dart';

// Tracking options
export 'package:kitbase_analytics/src/domain/entities/track_options.dart';
export 'package:kitbase_analytics/src/domain/entities/track_response.dart';
export 'package:kitbase_analytics/src/domain/entities/page_view_options.dart';
export 'package:kitbase_analytics/src/domain/entities/revenue_options.dart';
export 'package:kitbase_analytics/src/domain/entities/identify_options.dart';

// Session
export 'package:kitbase_analytics/src/domain/entities/kitbase_session.dart';

// Storage
export 'package:kitbase_analytics/src/data/datasources/local/storage.dart';

// Exceptions
export 'package:kitbase_analytics/src/core/exceptions/exceptions.dart';

// Navigation
export 'package:kitbase_analytics/src/core/navigation/kitbase_page_tracker.dart';

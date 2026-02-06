import 'package:kitbase_analytics/src/core/constants.dart';
import 'package:kitbase_analytics/src/data/datasources/local/storage.dart';

/// Configuration options for offline event queueing
class OfflineConfig {
  final bool enabled;
  final int maxQueueSize;
  final int flushInterval; // milliseconds
  final int flushBatchSize;
  final int maxRetries;
  final int retryBaseDelay; // milliseconds

  const OfflineConfig({
    this.enabled = false,
    this.maxQueueSize = 1000,
    this.flushInterval = 30000,
    this.flushBatchSize = 50,
    this.maxRetries = 3,
    this.retryBaseDelay = 1000,
  });
}

/// Configuration options for privacy and consent management
class PrivacyConfig {
  final bool optOutByDefault;
  final String optOutStorageKey;

  const PrivacyConfig({
    this.optOutByDefault = false,
    this.optOutStorageKey = KitbaseConstants.defaultOptOutKey,
  });
}

/// Configuration for analytics tracking
class AnalyticsConfig {
  final bool autoTrackSessions;
  final int sessionTimeout; // milliseconds
  final String sessionStorageKey;

  const AnalyticsConfig({
    this.autoTrackSessions = true,
    this.sessionTimeout = 30 * 60 * 1000, // 30 minutes
    this.sessionStorageKey = KitbaseConstants.defaultSessionKey,
  });
}

/// Configuration options for the Kitbase client
class KitbaseConfig {
  final String token;
  final String baseUrl;
  final KitbaseStorage? storage;
  final String storageKey;
  final bool debug;
  final OfflineConfig offline;
  final AnalyticsConfig analytics;
  final PrivacyConfig privacy;

  const KitbaseConfig({
    required this.token,
    this.baseUrl = KitbaseConstants.baseUrl,
    this.storage,
    this.storageKey = KitbaseConstants.defaultAnonymousIdKey,
    this.debug = false,
    this.offline = const OfflineConfig(),
    this.analytics = const AnalyticsConfig(),
    this.privacy = const PrivacyConfig(),
  });
}

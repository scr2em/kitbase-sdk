import 'package:kitbase_analytics/src/core/internal/kitbase_analytics_internal.dart';
import 'package:kitbase_analytics/src/domain/entities/config.dart';
import 'package:kitbase_analytics/src/core/exceptions/exceptions.dart';
import 'package:kitbase_analytics/src/domain/entities/track_options.dart';
import 'package:kitbase_analytics/src/domain/entities/track_response.dart';
import 'package:kitbase_analytics/src/domain/entities/page_view_options.dart';
import 'package:kitbase_analytics/src/domain/entities/revenue_options.dart';
import 'package:kitbase_analytics/src/domain/entities/identify_options.dart';

/// Kitbase Analytics SDK Singleton
///
/// Initialize once with [KitbaseAnalytics.init], then access via [KitbaseAnalytics.instance].
///
/// ```dart
/// // Initialize once at app startup
/// KitbaseAnalytics.init(KitbaseConfig(token: '<YOUR_API_KEY>'));
///
/// // Access anywhere in your app
/// await KitbaseAnalytics.instance.track(TrackOptions(
///   channel: 'payments',
///   event: 'New Subscription',
/// ));
/// ```
class KitbaseAnalytics {
  KitbaseAnalytics._();

  static KitbaseAnalyticsInternal? _internal;

  /// Initialize the Kitbase Analytics SDK.
  /// Must be called before accessing [instance].
  ///
  /// This method is asynchronous to ensure all storage and device info
  /// is loaded before the SDK is used.
  ///
  /// Throws [StateError] if already initialized.
  static Future<void> init(KitbaseConfig config) async {
    if (_internal != null) {
      throw KitbaseNotConfiguredException(
        feature: 'KitbaseAnalytics',
        message:
            'Already initialized. Call reset() first if you need to reinitialize.',
      );
    }
    _internal = KitbaseAnalyticsInternal(config);
    await _internal!.initialize();
  }

  /// Get the singleton instance (private).
  /// Throws [KitbaseNotConfiguredException] if [init] has not been called.
  static KitbaseAnalyticsInternal get _instance {
    if (_internal == null) {
      throw KitbaseNotConfiguredException(
        feature: 'KitbaseAnalytics',
        message: 'Not initialized. Call KitbaseAnalytics.init() first.',
      );
    }
    return _internal!;
  }

  /// Check if the SDK has been initialized.
  static bool get isInitialized => _internal != null;

  /// Reset the SDK instance.
  /// Useful for testing or reinitializing with different config.
  static Future<void> reset() async {
    if (_internal != null) {
      await _internal!.shutdown();
      _internal = null;
    }
  }

  // ============================================================
  // Convenience Static Methods (delegate to instance)
  // ============================================================

  /// Enable or disable debug mode
  static void setDebugMode(bool enabled) => _instance.setDebugMode(enabled);

  /// Check if debug mode is enabled
  static bool isDebugMode() => _instance.isDebugMode();

  /// Register super properties
  static void registerSuperPropertie(Map<String, dynamic> properties) =>
      _instance.register(properties);

  /// Register super properties only if not set
  static void registerSuperPropertieOnce(Map<String, dynamic> properties) =>
      _instance.registerOnce(properties);

  /// Remove a super property
  static void unregisterSuperPropertie(String key) => _instance.unregister(key);

  /// Get all super properties
  static Map<String, dynamic> getSuperProperties() =>
      _instance.getSuperProperties();

  /// Clear all super properties
  static void clearSuperProperties() => _instance.clearSuperProperties();

  /// Start timing an event
  static void startTimeEvent(String eventName) =>
      _instance.timeEvent(eventName);

  /// Alias for track() with timed event for better readability
  static Future<TrackResponse?> trackTimeEvent(TrackOptions options) =>
      _instance.track(options);

  /// Cancel a timed event
  static void cancelTimeEvent(String eventName) =>
      _instance.cancelTimeEvent(eventName);

  /// Get duration of a timed event
  static double? getEventDuration(String eventName) =>
      _instance.getEventDuration(eventName);

  /// Opt out of tracking
  static Future<void> optOut() => _instance.optOut();

  /// Opt back in to tracking
  static Future<void> optIn() => _instance.optIn();

  /// Check if opted out
  static bool isOptedOut() => _instance.isOptedOut();

  /// Identify a user
  static void identify(IdentifyOptions options) => _instance.identify(options);

  /// Clear the current user ID
  static void unidentify() => _instance.unidentify();

  /// Track an event
  static Future<TrackResponse?> track(TrackOptions options) =>
      _instance.track(options);

  /// Track a pageview
  static Future<TrackResponse?> trackPageView(PageViewOptions options) =>
      _instance.trackPageView(options);

  /// Track revenue
  static Future<TrackResponse?> trackRevenue(RevenueOptions options) =>
      _instance.trackRevenue(options);

  // ============================================================
  // Debugging & Development
  // ============================================================

  /// Get all stored logs (debug only)
  /// Useful for verifying that events are being persisted correctly.
  static Future<List<Map<String, dynamic>>> debugGetStoredLogs() =>
      _instance.debugGetStoredLogs();

  /// Clear all stored data (debug only)
  /// WARNING: This will delete all pending and sent logs from the local database.
  static Future<void> debugClearStorage() => _instance.debugClearStorage();
}

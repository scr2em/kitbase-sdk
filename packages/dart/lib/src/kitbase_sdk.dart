import 'core/exceptions/exceptions.dart';
import 'core/network/kitbase_http_client.dart';
import 'events/kitbase_events.dart';

export 'events/kitbase_events.dart';

/// Configuration options for the Events feature.
class EventsConfig {
  /// Name identifier for this events configuration.
  final String name;

  /// Creates a new [EventsConfig].
  const EventsConfig({this.name = 'default'});
}

/// Configuration options for Kitbase SDK.
class KitbaseConfig {
  /// Your Kitbase API key.
  final String token;

  /// Optional base URL to override the default API URL.
  final String? baseUrl;

  /// Optional configuration for the Events feature.
  final EventsConfig? events;

  /// Creates a new [KitbaseConfig].
  const KitbaseConfig({
    required this.token,
    this.baseUrl,
    this.events,
  });
}

/// Main entry point for the Kitbase SDK.
///
/// Initialize the SDK once on app startup:
/// ```dart
/// Kitbase.init(
///   config: KitbaseConfig(
///     token: '<YOUR_API_KEY>',
///     events: EventsConfig(),
///   ),
/// );
/// ```
///
/// Then access features:
/// ```dart
/// await Kitbase.events.track(
///   channel: 'payments',
///   event: 'New Subscription',
/// );
/// ```
class Kitbase {
  Kitbase._();

  static bool _isInitialized = false;
  static bool _eventsConfigured = false;
  static KitbaseEvents? _events;

  /// Whether the SDK has been initialized.
  static bool get isInitialized => _isInitialized;

  /// Access the Events feature for tracking events.
  ///
  /// Throws [KitbaseNotConfiguredException] if the SDK has not been
  /// initialized or if Events was not configured.
  static KitbaseEvents get events {
    if (!_isInitialized) {
      throw const KitbaseNotConfiguredException(
        feature: 'sdk',
        message: 'Kitbase SDK is not initialized. '
            'Call Kitbase.init(config: KitbaseConfig(token: "YOUR_TOKEN", events: EventsConfig())) first.',
      );
    }
    if (!_eventsConfigured || _events == null) {
      throw const KitbaseNotConfiguredException(
        feature: 'events',
        message: 'Events feature is not configured. '
            'Pass EventsConfig to KitbaseConfig when initializing: '
            'Kitbase.init(config: KitbaseConfig(token: "YOUR_TOKEN", events: EventsConfig()))',
      );
    }
    return _events!;
  }

  /// Initializes the Kitbase SDK.
  ///
  /// [config] contains the API token and feature configuration options.
  ///
  /// This should be called once on app startup.
  static void init({required KitbaseConfig config}) {
    if (_isInitialized) return;

    KitbaseHttpClient.instance.init(
      token: config.token,
      baseUrl: config.baseUrl,
    );

    if (config.events != null) {
      _events = KitbaseEvents();
      _eventsConfigured = true;
    }

    _isInitialized = true;
  }
}

import 'dart:async';
import 'package:kitbase_analytics/src/core/network/kitbase_http_client.dart';
import 'package:kitbase_analytics/src/data/datasources/local/shared_prefs_storage.dart';
import 'package:kitbase_analytics/src/data/datasources/local/storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'package:kitbase_analytics/src/core/constants.dart';
import 'package:kitbase_analytics/src/core/utils/kitbase_logger.dart';
import 'package:kitbase_analytics/src/core/utils/device_context_provider.dart';
import 'package:kitbase_analytics/src/core/utils/kitbase_system_info.dart';
import 'package:kitbase_analytics/src/domain/entities/config.dart';
import 'package:kitbase_analytics/src/domain/entities/kitbase_session.dart';
import 'package:kitbase_analytics/src/domain/entities/log_payload.dart';
import 'package:kitbase_analytics/src/domain/entities/track_options.dart';
import 'package:kitbase_analytics/src/domain/entities/track_response.dart';
import 'package:kitbase_analytics/src/domain/entities/page_view_options.dart';
import 'package:kitbase_analytics/src/domain/entities/revenue_options.dart';
import 'package:kitbase_analytics/src/domain/entities/identify_options.dart';

import 'package:kitbase_analytics/src/data/repositories/analytics_repository_impl.dart';

/// Internal Kitbase Analytics implementation.
/// Use [KitbaseAnalytics] singleton for public access.
/// This class is exposed for unit testing purposes only.
class KitbaseAnalyticsInternal {
  final KitbaseConfig config;
  late final AnalyticsRepositoryImpl _repository;

  KitbaseSession? _session;
  String? _anonymousId;
  String? _userId;
  bool _optedOut = false;
  bool _debugMode = false;
  late final KitbaseStorage _storage;

  // Super properties
  final Map<String, dynamic> _superProperties = {};

  // System Info (Device Context)
  late final KitbaseDeviceContextProvider _systemInfo;

  // Timed events
  final Map<String, int> _timedEvents = {};

  KitbaseAnalyticsInternal(this.config,
      {KitbaseDeviceContextProvider? systemInfo})
      : _systemInfo = systemInfo ?? KitbaseSystemInfo() {
    _debugMode = config.debug;
    _repository = AnalyticsRepositoryImpl(config);
  }

  Future<void> initialize() async {
    try {
      // 0. Initialize HTTP Client
      KitbaseHttpClient.instance.init(
        token: config.token,
        baseUrl: config.baseUrl,
      );

      // Initialize Storage
      if (config.storage != null) {
        _storage = config.storage!;
      } else {
        final prefs = await SharedPreferences.getInstance();
        _storage = SharedPrefsStorage(prefs);
      }

      // 1. Initialize Storage & Anonymous ID & User ID
      await _initializeAnonymousId();
      await _initializeUserId();

      // 2. Initialize Privacy (Opt-out)
      await _initializeOptOut();

      // 3. Initialize Session
      if (config.analytics.autoTrackSessions) {
        await _initializeSession();
      }

      // 4. Initialize System Info (Device tags)
      await _systemInfo.init();
    } catch (e) {
      _log('Initialization error', e);
      rethrow;
    }
  }

  Future<void> _initializeAnonymousId() async {
    final stored = _storage.getItem(config.storageKey);
    if (stored != null) {
      _anonymousId = stored;
      return;
    }

    _anonymousId = const Uuid().v4();
    await _storage.setItem(config.storageKey, _anonymousId!);
  }

  Future<void> _initializeUserId() async {
    final stored = _storage.getItem(KitbaseConstants.defaultUserIdKey);
    if (stored != null) {
      _userId = stored;
      _log('Restored user ID', {'userId': _userId});
    }
  }

  Future<void> _initializeOptOut() async {
    final stored = _storage.getItem(config.privacy.optOutStorageKey);
    if (stored != null) {
      _optedOut = stored == 'true';
      return;
    }
    _optedOut = config.privacy.optOutByDefault;
  }

  Future<void> _initializeSession() async {
    _storage.getItem(config.analytics.sessionStorageKey);
    _startNewSession();
  }

  void _startNewSession() {
    _session = KitbaseSession(
      id: const Uuid().v4(),
      startedAt: DateTime.now().millisecondsSinceEpoch,
      lastActivityAt: DateTime.now().millisecondsSinceEpoch,
    );
  }

  void _log(String message, [dynamic data]) {
    if (_debugMode) {
      if (data != null) {
        KitbaseLogger.info(message, data);
      } else {
        KitbaseLogger.info(message);
      }
    }
  }

  // ============================================================
  // Anonymous ID
  // ============================================================

  /// Get the current anonymous ID
  String? getAnonymousId() => _anonymousId;

  // ============================================================
  // Debug Mode
  // ============================================================

  /// Enable or disable debug mode dynamically
  void setDebugMode(bool enabled) {
    _debugMode = enabled;
    _log('Debug mode ${enabled ? 'enabled' : 'disabled'}');
  }

  /// Check if debug mode is enabled
  bool isDebugMode() => _debugMode;

  // ============================================================
  // Super Properties
  // ============================================================

  /// Register super properties that will be included with every event
  void register(Map<String, dynamic> properties) {
    _superProperties.addAll(properties);
    _log('Super properties registered', properties);
  }

  /// Register super properties only if they haven't been set yet
  void registerOnce(Map<String, dynamic> properties) {
    final newProps = <String, dynamic>{};
    for (final entry in properties.entries) {
      if (!_superProperties.containsKey(entry.key)) {
        newProps[entry.key] = entry.value;
      }
    }
    if (newProps.isNotEmpty) {
      _superProperties.addAll(newProps);
      _log('Super properties registered (once)', newProps);
    }
  }

  /// Remove a super property
  void unregister(String key) {
    if (_superProperties.containsKey(key)) {
      _superProperties.remove(key);
      _log('Super property removed', {'key': key});
    }
  }

  /// Get all registered super properties
  Map<String, dynamic> getSuperProperties() => Map.from(_superProperties);

  /// Clear all super properties
  void clearSuperProperties() {
    _superProperties.clear();
    _log('Super properties cleared');
  }

  // ============================================================
  // Time Events (Duration Tracking)
  // ============================================================

  /// Start timing an event
  void timeEvent(String eventName) {
    _timedEvents[eventName] = DateTime.now().millisecondsSinceEpoch;
    _log('Timer started', {'event': eventName});
  }

  /// Cancel a timed event without tracking it
  void cancelTimeEvent(String eventName) {
    if (_timedEvents.containsKey(eventName)) {
      _timedEvents.remove(eventName);
      _log('Timer cancelled', {'event': eventName});
    }
  }

  /// Get all currently timed events
  List<String> getTimedEvents() => _timedEvents.keys.toList();

  /// Get the duration of a timed event (without stopping it)
  double? getEventDuration(String eventName) {
    final startTime = _timedEvents[eventName];
    if (startTime == null) return null;
    return (DateTime.now().millisecondsSinceEpoch - startTime) / 1000.0;
  }

  // ============================================================
  // Privacy & Consent
  // ============================================================

  /// Opt out of tracking
  Future<void> optOut() async {
    _optedOut = true;
    await _storage.setItem(config.privacy.optOutStorageKey, 'true');
    _log('User opted out of tracking');
  }

  /// Opt back in to tracking
  Future<void> optIn() async {
    _optedOut = false;
    await _storage.setItem(config.privacy.optOutStorageKey, 'false');
    _log('User opted in to tracking');
  }

  /// Check if tracking is currently opted out
  bool isOptedOut() => _optedOut;

  // ============================================================
  // User Identity
  // ============================================================

  /// Identify a user with optional traits
  void identify(IdentifyOptions options) {
    _userId = options.userId;
    if (options.traits != null) {
      _superProperties.addAll(options.traits!);
    }
    // Persist user ID
    _storage.setItem(KitbaseConstants.defaultUserIdKey, options.userId);

    _log('User identified',
        {'userId': options.userId, 'traits': options.traits});
  }

  /// Clear the current user ID
  void unidentify() {
    _userId = null;
    // Clear persisted user ID
    _storage.removeItem(KitbaseConstants.defaultUserIdKey);
    _log('User identity cleared');
  }

  // ============================================================
  // Queue Management
  // ============================================================

  /// Manually flush the offline queue
  Future<void> flushQueue() async {
    await _repository.flush();
    _log('Queue flushed');
  }

  /// Alias for flushQueue
  Future<void> flush() async {
    await flushQueue();
  }

  /// Get all stored logs (debug only)
  Future<List<Map<String, dynamic>>> debugGetStoredLogs() async {
    return _repository.getAllLogs();
  }

  /// Clear all stored data (debug only)
  Future<void> debugClearStorage() async {
    await _repository.clearStorage();
    _log('Storage cleared (debug)');
  }

  // ============================================================
  // Tracking
  // ============================================================

  /// Track an event
  Future<TrackResponse?> track(TrackOptions options) async {
    if (_optedOut) {
      _log('Event skipped - user opted out', {'event': options.event});
      return null;
    }

    // Duration
    double? duration;
    if (_timedEvents.containsKey(options.event)) {
      final start = _timedEvents.remove(options.event)!;
      duration = (DateTime.now().millisecondsSinceEpoch - start) / 1000.0;
      _log('Timer stopped', {'event': options.event, 'duration': duration});
    }

    final mergedTags = <String, dynamic>{
      ..._superProperties,
      ...?options.tags,
      if (duration != null) '\$duration': duration,
      if (_session != null) '__session_id': _session!.id,
      ..._systemInfo.deviceContext,
    };

    final payload = LogPayload(
      channel: options.channel,
      event: options.event,
      userId: options.userId ?? _userId,
      anonymousId: _anonymousId,
      icon: options.icon,
      notify: options.notify,
      description: options.description,
      tags: mergedTags.isEmpty ? null : mergedTags,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _log('Track', {'event': options.event, 'payload': payload});

    return await _repository.log(payload);
  }

  /// Track a pageview
  Future<TrackResponse?> trackPageView(PageViewOptions options) async {
    return await track(TrackOptions(
      channel: KitbaseConstants.analyticsChannel,
      event: 'Page View',
      tags: {
        if (options.path != null) '\$path': options.path,
        if (options.title != null) '\$title': options.title,
        if (options.referrer != null) '\$referrer': options.referrer,
        ...?options.tags,
        ..._systemInfo.deviceContext,
      },
    ));
  }

  /// Track revenue
  Future<TrackResponse?> trackRevenue(RevenueOptions options) async {
    return await track(TrackOptions(
      channel: KitbaseConstants.analyticsChannel,
      event: 'Revenue',
      userId: options.userId,
      tags: {
        '\$amount': options.amount,
        '\$currency': options.currency,
        ...?options.tags,
        ..._systemInfo.deviceContext,
      },
    ));
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  /// Shutdown the client and cleanup resources
  Future<void> shutdown() async {
    _log('Shutting down');

    // Flush any remaining queued events
    await _repository.flush();
    _repository.stopFlushTimer();

    // Clear timed events
    _timedEvents.clear();

    _log('Shutdown complete');
  }
}

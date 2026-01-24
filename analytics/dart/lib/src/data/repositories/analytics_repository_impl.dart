import 'dart:async';
import 'package:kitbase_analytics/src/domain/entities/config.dart';
import 'package:kitbase_analytics/src/data/datasources/remote/analytics_remote_data_source.dart';
import 'package:kitbase_analytics/src/data/datasources/local/log_database.dart';
import 'package:kitbase_analytics/src/core/sync/sync_engine.dart';
import 'package:kitbase_analytics/src/core/network/connectivity_manager.dart';
import 'package:kitbase_analytics/src/core/utils/kitbase_logger.dart';
import 'package:kitbase_analytics/src/domain/entities/log_payload.dart';
import 'package:kitbase_analytics/src/domain/entities/track_response.dart';
import 'package:kitbase_analytics/src/domain/repositories/analytics_repository.dart';

class AnalyticsRepositoryImpl implements AnalyticsRepository {
  final KitbaseConfig config;
  final AnalyticsRemoteDataSource _remoteDataSource;
  final KitbaseAnalyticsDatabase _logDatabase;
  final ConnectivityManager _connectivityManager;
  late final KitbaseSyncEngine _syncEngine;

  AnalyticsRepositoryImpl(
    this.config, {
    AnalyticsRemoteDataSource? remoteDataSource,
    KitbaseAnalyticsDatabase? logDatabase,
    KitbaseSyncEngine? syncEngine,
    ConnectivityManager? connectivityManager,
  })  : _remoteDataSource =
            remoteDataSource ?? const AnalyticsRemoteDataSourceImpl(),
        _logDatabase = logDatabase ?? KitbaseAnalyticsDatabase(),
        _connectivityManager =
            connectivityManager ?? ConnectivityManagerImpl() {
    _syncEngine = syncEngine ??
        KitbaseSyncEngine(
          _logDatabase,
          _remoteDataSource,
          _connectivityManager,
          config.offline,
        );

    _init();
  }

  Future<void> _init() async {
    await _logDatabase.init();
    _syncEngine.init();
  }

  void stopFlushTimer() {
    _syncEngine.dispose();
  }

  @override
  Future<TrackResponse> log(LogPayload payload) async {
    // Insert into DB
    try {
      // Ideally we should await initialization, but for performance we might fire and forget
      // However, inserting into uninitialized DB throws.
      // _init() is called in constructor but it's async so it might not be done yet.
      // Safe bet is to await init() again (it's idempotent).
      await _logDatabase.init();
      await _logDatabase.insertLog(payload);

      // Trigger sync (fire-and-forget - don't wait)
      // If already syncing, sync() returns immediately
      // ignore: unawaited_futures
      _syncEngine.sync();

      return TrackResponse(
          id: 'queued-${DateTime.now().millisecondsSinceEpoch}',
          event: payload.event,
          timestamp: DateTime.now().toIso8601String());
    } catch (e) {
      // Fallback or error handling
      KitbaseLogger.error('Failed to log event', e);
      return TrackResponse(
          id: 'error',
          event: payload.event,
          timestamp: DateTime.now().toIso8601String());
    }
  }

  @override
  Future<void> flush() async {
    await _syncEngine.sync();
  }

  @override
  Future<List<Map<String, dynamic>>> getAllLogs() async {
    await _logDatabase.init();
    return _logDatabase.getAllLogs();
  }

  @override
  Future<void> clearStorage() async {
    await _logDatabase.init();
    await _logDatabase.clearAllLogs();
  }
}

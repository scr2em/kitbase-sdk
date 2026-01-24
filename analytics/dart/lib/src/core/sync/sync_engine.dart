import 'dart:async';
import 'dart:collection';

import 'package:kitbase_analytics/src/core/network/connectivity_manager.dart';
import 'package:kitbase_analytics/src/core/utils/kitbase_logger.dart';
import 'package:kitbase_analytics/src/domain/entities/config.dart';
import 'package:kitbase_analytics/src/domain/entities/log_payload.dart';
import 'package:kitbase_analytics/src/data/datasources/local/log_database.dart';
import 'package:kitbase_analytics/src/data/datasources/remote/analytics_remote_data_source.dart';

/// Manages sequential syncing of logs to the remote server.
class KitbaseSyncEngine {
  final KitbaseAnalyticsDatabase _db;
  final AnalyticsRemoteDataSource _remoteDataSource;
  final ConnectivityManager _connectivityManager;
  final Queue<MapEntry<int, LogPayload>> _queue = Queue();

  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;
  bool _isConnected = true;
  StreamSubscription<bool>? _connectivitySubscription;

  // Track continuous failures for the current item
  int _currentFailureCount = 0;

  final OfflineConfig _config;

  KitbaseSyncEngine(this._db, this._remoteDataSource, this._connectivityManager,
      this._config);

  /// Initialize the sync engine
  Future<void> init() async {
    _connectivitySubscription =
        _connectivityManager.onConnectivityChanged.listen((isConnected) {
      _isConnected = isConnected;
      if (isConnected) {
        // Resume syncing when reconnected
        sync();
      }
    });

    // Check initial status
    _isConnected = _connectivityManager.isConnected;

    // Retry previously failed logs by resetting them to pending
    // MUST complete before sync starts to avoid race condition
    await _retryTryLaterLogs();

    if (_isConnected) sync();
  }

  /// Reset try_later logs back to pending for automatic retry (run once at startup)
  Future<void> _retryTryLaterLogs() async {
    try {
      // Only reset logs once at startup, not in a loop
      final tryLaterLogs =
          await _db.getTryLaterLogs(limit: _config.flushBatchSize * 10);

      if (tryLaterLogs.isEmpty) return;

      for (final entry in tryLaterLogs.entries) {
        await _db.updateLogStatus(entry.key, 'pending');
      }

      KitbaseLogger.info(
          'Reset ${tryLaterLogs.length} try_later logs to pending for retry');
    } catch (e) {
      KitbaseLogger.error('Failed to retry try_later logs', e);
    }
  }

  /// Trigger the sync process
  Future<void> sync() async {
    if (_isSyncing) return;
    if (!_isConnected) return;

    _isSyncing = true;

    try {
      while (_isConnected) {
        // If queue is empty, fetch more
        if (_queue.isEmpty) {
          final pendingLogs =
              await _db.getPendingLogs(limit: _config.flushBatchSize);
          if (pendingLogs.isEmpty) break; // No more logs to sync

          for (final entry in pendingLogs.entries) {
            _queue.add(entry);
          }
        }

        // Process directly from queue head
        if (_queue.isEmpty) break;

        final currentEntry = _queue.first;
        final id = currentEntry.key;
        final log = currentEntry.value;

        // Try to sync
        final success = await _remoteDataSource.send(log);

        if (success) {
          // Success: delete from DB and remove from queue
          await _db.deleteLog(id);
          _queue.removeFirst();
          _currentFailureCount = 0; // Reset failure count
        } else {
          // Failure
          _currentFailureCount++;

          if (_currentFailureCount >= _config.maxRetries) {
            // Max retries reached
            // Mark as try_later and remove from current processing queue
            await _db.updateLogStatus(id, 'try_later');
            _queue.removeFirst();
            _currentFailureCount = 0; // Reset for next item
          } else {
            // Keep in queue head to retry (will happen in next loop iteration)
            await Future.delayed(
                Duration(milliseconds: _config.retryBaseDelay));
          }
        }
      }
    } catch (e) {
      // Handle unexpected errors during sync loop
      KitbaseLogger.error('SyncEngine error', e);
    } finally {
      _isSyncing = false;
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
  }
}

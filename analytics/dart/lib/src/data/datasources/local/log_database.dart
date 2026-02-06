import 'dart:async';
import 'package:kitbase_analytics/src/data/datasources/local/db_helper/db_factory.dart';
import 'package:kitbase_analytics/src/data/parsers/log_payload_parser.dart';
import 'package:kitbase_analytics/src/domain/entities/log_payload.dart';
import 'package:sembast/sembast.dart';

/// Database wrapper that handles persistence of analytics logs using Sembast.
/// Works on both Native (IO) and Web (IndexedDB).
class KitbaseAnalyticsDatabase {
  static const String _dbName = 'kitbase_analytics.db';
  static const String _storeName = 'logs';

  Database? _db;
  final _store = intMapStoreFactory.store(_storeName);

  bool get isInitialized => _db != null;

  /// Initialize the database
  Future<void> init() async {
    if (_db != null) return;
    _db = await openLocalDatabase(_dbName);
  }

  /// Insert a log into the database
  Future<void> insertLog(LogPayload log) async {
    _ensureInitialized();
    await _store.add(_db!, {
      'payload': LogPayloadParser.toJson(log),
      'status': 'pending',
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  /// Get pending logs (logs with status 'pending')
  Future<Map<int, LogPayload>> getPendingLogs({int limit = 100}) async {
    return _getLogsByStatus('pending', limit);
  }

  /// Get try_later logs (logs that have failed and need retry)
  Future<Map<int, LogPayload>> getTryLaterLogs({int limit = 100}) async {
    return _getLogsByStatus('try_later', limit);
  }

  Future<Map<int, LogPayload>> _getLogsByStatus(
      String status, int limit) async {
    _ensureInitialized();
    final finder = Finder(
      filter: Filter.equals('status', status),
      limit: limit,
      sortOrders: [SortOrder('created_at')],
    );

    final records = await _store.find(_db!, finder: finder);
    final logs = <int, LogPayload>{};

    for (final record in records) {
      try {
        final value = record.value;
        final payloadMap = Map<String, dynamic>.from(value['payload'] as Map);
        final log = LogPayloadParser.fromJson(payloadMap);
        logs[record.key] = log;
      } catch (e) {
        // Skip corrupted logs
      }
    }
    return logs;
  }

  /// Update a log's status
  Future<void> updateLogStatus(int id, String status) async {
    _ensureInitialized();
    await _store.record(id).update(_db!, {'status': status});
  }

  /// Delete a log by ID
  Future<void> deleteLog(int id) async {
    _ensureInitialized();
    await _store.record(id).delete(_db!);
  }

  /// Clear all logs
  Future<void> clearAllLogs() async {
    _ensureInitialized();
    await _store.delete(_db!);
  }

  /// Get all logs regardless of status (for debugging)
  Future<List<Map<String, dynamic>>> getAllLogs() async {
    _ensureInitialized();
    final finder = Finder(sortOrders: [SortOrder('created_at', false)]);
    final records = await _store.find(_db!, finder: finder);

    return records.map((record) {
      final value = record.value;
      // Return raw record with ID mixed in for display
      return {
        'id': record.key,
        ...value,
      };
    }).toList();
  }

  /// Close the database
  Future<void> close() async {
    await _db?.close();
    _db = null;
  }

  void _ensureInitialized() {
    if (_db == null) throw StateError('Database not initialized');
  }
}

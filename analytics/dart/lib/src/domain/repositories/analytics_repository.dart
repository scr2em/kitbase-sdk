import 'package:kitbase_analytics/src/domain/entities/log_payload.dart';
import 'package:kitbase_analytics/src/domain/entities/track_response.dart';

/// Repository interface for analytics operations
abstract class AnalyticsRepository {
  Future<TrackResponse> log(LogPayload payload);

  /// The operation is asynchronous.
  Future<void> flush();

  /// Get all stored logs (debug only)
  Future<List<Map<String, dynamic>>> getAllLogs();

  /// Clear all stored data (debug only)
  Future<void> clearStorage();
}

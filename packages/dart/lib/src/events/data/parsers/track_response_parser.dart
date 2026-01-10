import '../../domain/entities/track_response.dart';

/// Parser extension for converting JSON to [TrackResponse].
extension TrackResponseParser on TrackResponse {
  /// Creates a [TrackResponse] from a JSON map.
  static TrackResponse fromJson(Map<String, dynamic> json) {
    return TrackResponse(
      id: json['id'] as String,
      event: json['event'] as String,
      timestamp: json['timestamp'] as String,
    );
  }
}

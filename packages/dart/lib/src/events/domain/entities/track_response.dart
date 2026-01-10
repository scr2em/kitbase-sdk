/// Response entity from the track API.
class TrackResponse {
  /// Unique identifier for the logged event.
  final String id;

  /// The event name.
  final String event;

  /// Server timestamp when the event was recorded.
  final String timestamp;

  const TrackResponse({
    required this.id,
    required this.event,
    required this.timestamp,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TrackResponse &&
        other.id == id &&
        other.event == event &&
        other.timestamp == timestamp;
  }

  @override
  int get hashCode => Object.hash(id, event, timestamp);

  @override
  String toString() =>
      'TrackResponse(id: $id, event: $event, timestamp: $timestamp)';
}

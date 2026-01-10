/// Options entity for tracking an event.
class TrackOptions {
  /// The channel/category for the event.
  final String channel;

  /// The name of the event.
  final String event;

  /// Optional user identifier.
  final String? userId;

  /// Icon for the event (emoji or icon name).
  final String? icon;

  /// Whether to send a notification for this event.
  final bool? notify;

  /// Optional description for the event.
  final String? description;

  /// Additional metadata tags.
  final Map<String, dynamic>? tags;

  const TrackOptions({
    required this.channel,
    required this.event,
    this.userId,
    this.icon,
    this.notify,
    this.description,
    this.tags,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TrackOptions &&
        other.channel == channel &&
        other.event == event &&
        other.userId == userId &&
        other.icon == icon &&
        other.notify == notify &&
        other.description == description &&
        _mapEquals(other.tags, tags);
  }

  @override
  int get hashCode => Object.hash(
        channel,
        event,
        userId,
        icon,
        notify,
        description,
        tags != null ? Object.hashAll(tags!.entries) : null,
      );

  @override
  String toString() => 'TrackOptions(channel: $channel, event: $event)';

  static bool _mapEquals(Map<String, dynamic>? a, Map<String, dynamic>? b) {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    for (final key in a.keys) {
      if (!b.containsKey(key) || a[key] != b[key]) return false;
    }
    return true;
  }
}

/// Configuration for the Kitbase client.
class KitbaseConfig {
  /// Your Kitbase API key.
  final String token;

  const KitbaseConfig({
    required this.token,
  });
}

/// Options for tracking an event.
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

  Map<String, dynamic> toJson() {
    return {
      'environment': 'production',
      'channel': channel,
      'event': event,
      if (userId != null) 'user_id': userId,
      if (icon != null) 'icon': icon,
      if (notify != null) 'notify': notify,
      if (description != null) 'description': description,
      if (tags != null) 'tags': tags,
    };
  }
}

/// Response from the track API.
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

  factory TrackResponse.fromJson(Map<String, dynamic> json) {
    return TrackResponse(
      id: json['id'] as String,
      event: json['event'] as String,
      timestamp: json['timestamp'] as String,
    );
  }
}



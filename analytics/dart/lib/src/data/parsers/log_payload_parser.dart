import 'package:kitbase_analytics/src/domain/entities/log_payload.dart';

/// Parser for converting [LogPayload] to/from JSON.
class LogPayloadParser {
  /// Converts [LogPayload] to a JSON map.
  static Map<String, dynamic> toJson(LogPayload payload) {
    return {
      'channel': payload.channel,
      'event': payload.event,
      if (payload.userId != null) 'user_id': payload.userId,
      if (payload.anonymousId != null) 'anonymous_id': payload.anonymousId,
      if (payload.icon != null) 'icon': payload.icon,
      if (payload.notify != null) 'notify': payload.notify,
      if (payload.description != null) 'description': payload.description,
      if (payload.tags != null) 'tags': payload.tags,
      if (payload.timestamp != null) 'timestamp': payload.timestamp,
    };
  }

  /// Creates a [LogPayload] from a JSON map.
  static LogPayload fromJson(Map<String, dynamic> json) {
    return LogPayload(
      channel: json['channel'] as String,
      event: json['event'] as String,
      userId: json['user_id'] as String?,
      anonymousId: json['anonymous_id'] as String?,
      icon: json['icon'] as String?,
      notify: json['notify'] as bool?,
      description: json['description'] as String?,
      tags: json['tags'] as Map<String, dynamic>?,
      timestamp: json['timestamp'] as int?,
    );
  }
}

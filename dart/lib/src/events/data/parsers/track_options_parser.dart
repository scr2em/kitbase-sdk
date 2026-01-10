import '../../domain/entities/track_options.dart';

/// Parser extension for converting [TrackOptions] to JSON.
extension TrackOptionsParser on TrackOptions {
  /// Converts this [TrackOptions] to a JSON map for API requests.
  Map<String, dynamic> toJson() {
    return {
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

import '../entities/track_options.dart';
import '../entities/track_response.dart';

/// Abstract repository for events operations.
abstract class EventsRepository {
  /// Tracks an event with the given options.
  ///
  /// Returns a [TrackResponse] with the event ID and timestamp.
  Future<TrackResponse> track(TrackOptions options);
}

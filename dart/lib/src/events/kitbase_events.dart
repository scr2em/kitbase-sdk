import '../core/exceptions/exceptions.dart';
import 'data/data_sources/events_remote_data_source.dart';
import 'data/repos/events_repository_impl.dart';
import 'domain/entities/track_options.dart';
import 'domain/entities/track_response.dart';
import 'domain/repos/events_repository.dart';

/// Kitbase Events feature for tracking events.
///
/// Access via [Kitbase.events] after initializing the SDK:
/// ```dart
/// Kitbase.init(config: KitbaseConfig(token: '<YOUR_API_KEY>'));
///
/// await Kitbase.events.track(
///   channel: 'payments',
///   event: 'New Subscription',
///   userId: 'user-123',
///   icon: '💰',
///   notify: true,
///   tags: {'plan': 'premium', 'cycle': 'monthly'},
/// );
/// ```
class KitbaseEvents {
  final EventsRepository _repository;

  /// Creates a new KitbaseEvents instance.
  KitbaseEvents({EventsRepository? repository})
      : _repository = repository ??
            const EventsRepositoryImpl(
              remoteDataSource: EventsRemoteDataSourceImpl(),
            );

  /// Track an event.
  ///
  /// [channel] is the channel/category for the event (required).
  /// [event] is the name of the event (required).
  /// [userId] is an optional user identifier.
  /// [icon] is an optional icon (emoji or icon name).
  /// [notify] determines whether to send a notification.
  /// [description] is an optional event description.
  /// [tags] are optional additional metadata tags.
  ///
  /// Returns a [TrackResponse] with the event ID and timestamp.
  ///
  /// Throws [KitbaseValidationException] when required fields are missing.
  /// Throws [KitbaseAuthenticationException] when the API key is invalid.
  /// Throws [KitbaseApiException] when the API returns an error.
  /// Throws [KitbaseConnectionException] on network/connection errors.
  Future<TrackResponse> track({
    required String channel,
    required String event,
    String? userId,
    String? icon,
    bool? notify,
    String? description,
    Map<String, dynamic>? tags,
  }) async {
    if (channel.isEmpty) {
      throw const KitbaseValidationException(
        'Channel is required',
        field: 'channel',
      );
    }
    if (event.isEmpty) {
      throw const KitbaseValidationException(
        'Event is required',
        field: 'event',
      );
    }

    final options = TrackOptions(
      channel: channel,
      event: event,
      userId: userId,
      icon: icon,
      notify: notify,
      description: description,
      tags: tags,
    );

    return _repository.track(options);
  }
}

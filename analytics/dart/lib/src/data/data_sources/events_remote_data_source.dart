import 'package:kitbase_analytics/src/data/parsers/track_options_parser.dart';
import 'package:kitbase_analytics/src/core/network/kitbase_http_response.dart';
import 'package:kitbase_analytics/src/core/network/kitbase_http_client.dart';
import 'package:kitbase_analytics/src/data/constants.dart';
import 'package:kitbase_analytics/events.dart';

/// Remote data source for events API.
abstract class EventsRemoteDataSource {
  /// Sends a track event request to the API.
  Future<KitbaseHttpResponse> track(TrackOptions options);
}

/// Implementation of [EventsRemoteDataSource].
class EventsRemoteDataSourceImpl implements EventsRemoteDataSource {
  const EventsRemoteDataSourceImpl();

  @override
  Future<KitbaseHttpResponse> track(TrackOptions options) {
    return KitbaseHttpClient.instance.post(
      path: EventsApiConstants.trackPath,
      data: options.toJson(),
    );
  }
}

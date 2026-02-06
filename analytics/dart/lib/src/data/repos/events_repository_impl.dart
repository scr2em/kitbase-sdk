import 'package:kitbase_analytics/src/data/data_sources/events_remote_data_source.dart';
import 'package:kitbase_analytics/src/core/network/kitbase_http_response.dart';
import 'package:kitbase_analytics/src/data/parsers/track_response_parser.dart';
import 'package:kitbase_analytics/src/core/network/network_helpers.dart';
import 'package:kitbase_analytics/events.dart';

/// Implementation of [EventsRepository].
class EventsRepositoryImpl implements EventsRepository {
  final EventsRemoteDataSource _remoteDataSource;

  const EventsRepositoryImpl({
    required EventsRemoteDataSource remoteDataSource,
  }) : _remoteDataSource = remoteDataSource;

  @override
  Future<TrackResponse> track(TrackOptions options) async {
    try {
      final KitbaseHttpResponse response =
          await _remoteDataSource.track(options);

      if (response.isConnectionError) {
        throw const KitbaseConnectionException();
      }

      if (StatusCodes.isUnauthorized(response.statusCode)) {
        throw const KitbaseAuthenticationException();
      }

      if (response.isError) {
        throw KitbaseApiException(
          ResponseErrorExtractor.extractFromResponse(response),
          statusCode: response.statusCode ?? 0,
          response: response.data,
        );
      }

      return TrackResponseParser.fromJson(
        response.data as Map<String, dynamic>,
      );
    } on KitbaseException {
      rethrow;
    } catch (e) {
      throw KitbaseApiException(
        NetworkErrorMessages.unknownError,
        statusCode: 0,
        response: e.toString(),
      );
    }
  }
}

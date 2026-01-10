import '../../../core/exceptions/exceptions.dart';
import '../../../core/network/kitbase_http_response.dart';
import '../../../core/network/network_helpers.dart';
import '../../domain/entities/track_options.dart';
import '../../domain/entities/track_response.dart';
import '../../domain/repos/events_repository.dart';
import '../data_sources/events_remote_data_source.dart';
import '../parsers/track_response_parser.dart';

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

import 'package:kitbase/events.dart';
import 'package:kitbase/src/core/network/kitbase_http_response.dart';
import 'package:kitbase/src/events/data/data_sources/events_remote_data_source.dart';
import 'package:kitbase/src/events/data/repos/events_repository_impl.dart';
import 'package:test/test.dart';

class MockEventsRemoteDataSource implements EventsRemoteDataSource {
  KitbaseHttpResponse? response;
  TrackOptions? capturedOptions;

  @override
  Future<KitbaseHttpResponse> track(TrackOptions options) async {
    capturedOptions = options;
    return response ?? const KitbaseHttpResponse(statusCode: 200);
  }
}

class MockEventsRepository implements EventsRepository {
  TrackResponse? response;
  Exception? exception;
  TrackOptions? capturedOptions;

  @override
  Future<TrackResponse> track(TrackOptions options) async {
    capturedOptions = options;
    if (exception != null) throw exception!;
    return response ??
        const TrackResponse(
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        );
  }
}

void main() {
  group('KitbaseEvents', () {
    group('track validation', () {
      test('throws KitbaseValidationException when channel is empty', () {
        final events = KitbaseEvents();
        expect(
          () => events.track(channel: '', event: 'Test Event'),
          throwsA(isA<KitbaseValidationException>()),
        );
      });

      test('throws KitbaseValidationException when event is empty', () {
        final events = KitbaseEvents();
        expect(
          () => events.track(channel: 'test', event: ''),
          throwsA(isA<KitbaseValidationException>()),
        );
      });
    });

    group('track with mocked repository', () {
      test('successfully tracks an event', () async {
        final mockRepo = MockEventsRepository();
        final events = KitbaseEvents(repository: mockRepo);

        final result = await events.track(
          channel: 'test',
          event: 'Test Event',
        );

        expect(result.id, 'evt-123');
        expect(result.event, 'Test Event');
        expect(mockRepo.capturedOptions?.channel, 'test');
        expect(mockRepo.capturedOptions?.event, 'Test Event');
      });

      test('passes all optional fields to repository', () async {
        final mockRepo = MockEventsRepository();
        final events = KitbaseEvents(repository: mockRepo);

        await events.track(
          channel: 'payments',
          event: 'New Subscription',
          userId: 'user-123',
          icon: '💰',
          notify: true,
          description: 'User subscribed',
          tags: {'plan': 'premium'},
        );

        expect(mockRepo.capturedOptions?.channel, 'payments');
        expect(mockRepo.capturedOptions?.event, 'New Subscription');
        expect(mockRepo.capturedOptions?.userId, 'user-123');
        expect(mockRepo.capturedOptions?.icon, '💰');
        expect(mockRepo.capturedOptions?.notify, true);
        expect(mockRepo.capturedOptions?.description, 'User subscribed');
        expect(mockRepo.capturedOptions?.tags, {'plan': 'premium'});
      });
    });
  });

  group('EventsRepositoryImpl', () {
    test('returns TrackResponse on successful response', () async {
      final mockDataSource = MockEventsRemoteDataSource();
      mockDataSource.response = const KitbaseHttpResponse(
        statusCode: 201,
        data: {
          'id': 'evt-456',
          'event': 'Payment',
          'timestamp': '2024-01-15T10:30:00Z',
        },
      );

      final repo = EventsRepositoryImpl(remoteDataSource: mockDataSource);
      final result = await repo.track(const TrackOptions(
        channel: 'test',
        event: 'Payment',
      ));

      expect(result.id, 'evt-456');
      expect(result.event, 'Payment');
    });

    test('throws KitbaseAuthenticationException on 401', () async {
      final mockDataSource = MockEventsRemoteDataSource();
      mockDataSource.response = const KitbaseHttpResponse(
        statusCode: 401,
        data: {'message': 'Invalid API key'},
      );

      final repo = EventsRepositoryImpl(remoteDataSource: mockDataSource);

      expect(
        () => repo.track(const TrackOptions(channel: 'test', event: 'Test')),
        throwsA(isA<KitbaseAuthenticationException>()),
      );
    });

    test('throws KitbaseApiException on other HTTP errors', () async {
      final mockDataSource = MockEventsRemoteDataSource();
      mockDataSource.response = const KitbaseHttpResponse(
        statusCode: 400,
        data: {'message': 'Invalid channel'},
      );

      final repo = EventsRepositoryImpl(remoteDataSource: mockDataSource);

      expect(
        () => repo.track(const TrackOptions(channel: 'test', event: 'Test')),
        throwsA(isA<KitbaseApiException>()),
      );
    });

    test('throws KitbaseConnectionException on connection error', () async {
      final mockDataSource = MockEventsRemoteDataSource();
      mockDataSource.response =
          const KitbaseHttpResponse(isConnectionError: true);

      final repo = EventsRepositoryImpl(remoteDataSource: mockDataSource);

      expect(
        () => repo.track(const TrackOptions(channel: 'test', event: 'Test')),
        throwsA(isA<KitbaseConnectionException>()),
      );
    });
  });
}

import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kitbase_events/kitbase_events.dart';
import 'package:test/test.dart';

void main() {
  group('Kitbase', () {
    group('constructor', () {
      test('throws ValidationException when token is empty', () {
        expect(
          () => Kitbase(token: ''),
          throwsA(isA<ValidationException>()),
        );
      });

      test('creates client with valid token', () {
        final client = Kitbase(token: 'test-token');
        expect(client, isA<Kitbase>());
        client.close();
      });
    });

    group('track', () {
      test('throws ValidationException when channel is empty', () async {
        final client = Kitbase(token: 'test-token');
        expect(
          () => client.track(channel: '', event: 'Test Event'),
          throwsA(isA<ValidationException>()),
        );
        client.close();
      });

      test('throws ValidationException when event is empty', () async {
        final client = Kitbase(token: 'test-token');
        expect(
          () => client.track(channel: 'test', event: ''),
          throwsA(isA<ValidationException>()),
        );
        client.close();
      });

      test('successfully tracks an event', () async {
        final mockResponse = {
          'id': 'evt-123',
          'event': 'Test Event',
          'timestamp': '2024-01-15T10:30:00Z',
        };

        final mockClient = MockClient((request) async {
          expect(request.url.toString(), 'https://api.kitbase.io/v1/logs');
          expect(request.method, 'POST');
          expect(request.headers['Authorization'], 'Bearer test-token');
          expect(request.headers['Content-Type'], 'application/json');
          return http.Response(jsonEncode(mockResponse), 201);
        });

        final client = Kitbase(token: 'test-token', client: mockClient);
        final result = await client.track(
          channel: 'test',
          event: 'Test Event',
        );

        expect(result.id, 'evt-123');
        expect(result.event, 'Test Event');
        expect(result.timestamp, '2024-01-15T10:30:00Z');
        client.close();
      });

      test('sends all optional fields', () async {
        Map<String, dynamic>? capturedBody;

        final mockClient = MockClient((request) async {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode({
              'id': 'evt-123',
              'event': 'New Subscription',
              'timestamp': '2024-01-15T10:30:00Z',
            }),
            201,
          );
        });

        final client = Kitbase(token: 'test-token', client: mockClient);
        await client.track(
          channel: 'payments',
          event: 'New Subscription',
          userId: 'user-123',
          icon: '💰',
          notify: true,
          description: 'User subscribed',
          tags: {'plan': 'premium', 'trial': false},
        );

        expect(capturedBody, {
          'environment': 'production',
          'channel': 'payments',
          'event': 'New Subscription',
          'user_id': 'user-123',
          'icon': '💰',
          'notify': true,
          'description': 'User subscribed',
          'tags': {'plan': 'premium', 'trial': false},
        });
        client.close();
      });

      test('throws AuthenticationException on 401', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Invalid API key'}),
            401,
          );
        });

        final client = Kitbase(token: 'invalid-token', client: mockClient);
        expect(
          () => client.track(channel: 'test', event: 'Test Event'),
          throwsA(isA<AuthenticationException>()),
        );
        client.close();
      });

      test('throws ApiException on other HTTP errors', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Invalid channel'}),
            400,
          );
        });

        final client = Kitbase(token: 'test-token', client: mockClient);
        expect(
          () => client.track(channel: 'test', event: 'Test Event'),
          throwsA(isA<ApiException>()),
        );
        client.close();
      });
    });
  });
}



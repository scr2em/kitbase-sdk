import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kitbase/events.dart';
import 'package:test/test.dart';

void main() {
  group('KitbaseEvents', () {
    group('constructor', () {
      test('throws EventsValidationException when token is empty', () {
        expect(
          () => KitbaseEvents(token: ''),
          throwsA(isA<EventsValidationException>()),
        );
      });

      test('creates client with valid token', () {
        final client = KitbaseEvents(token: 'test-token');
        expect(client, isA<KitbaseEvents>());
        client.close();
      });
    });

    group('track', () {
      test('throws EventsValidationException when channel is empty', () async {
        final client = KitbaseEvents(token: 'test-token');
        expect(
          () => client.track(channel: '', event: 'Test Event'),
          throwsA(isA<EventsValidationException>()),
        );
        client.close();
      });

      test('throws EventsValidationException when event is empty', () async {
        final client = KitbaseEvents(token: 'test-token');
        expect(
          () => client.track(channel: 'test', event: ''),
          throwsA(isA<EventsValidationException>()),
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
          expect(request.url.toString(), 'https://api.kitbase.dev/v1/logs');
          expect(request.method, 'POST');
          expect(request.headers['Authorization'], 'Bearer test-token');
          expect(request.headers['Content-Type'], 'application/json');
          return http.Response(jsonEncode(mockResponse), 201);
        });

        final client = KitbaseEvents(token: 'test-token', client: mockClient);
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

        final client = KitbaseEvents(token: 'test-token', client: mockClient);
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

      test('throws EventsAuthenticationException on 401', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Invalid API key'}),
            401,
          );
        });

        final client = KitbaseEvents(token: 'invalid-token', client: mockClient);
        expect(
          () => client.track(channel: 'test', event: 'Test Event'),
          throwsA(isA<EventsAuthenticationException>()),
        );
        client.close();
      });

      test('throws EventsApiException on other HTTP errors', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Invalid channel'}),
            400,
          );
        });

        final client = KitbaseEvents(token: 'test-token', client: mockClient);
        expect(
          () => client.track(channel: 'test', event: 'Test Event'),
          throwsA(isA<EventsApiException>()),
        );
        client.close();
      });
    });
  });
}






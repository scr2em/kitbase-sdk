import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kitbase/changelogs.dart';
import 'package:test/test.dart';

void main() {
  group('KitbaseChangelogs', () {
    group('constructor', () {
      test('throws ChangelogsValidationException when token is empty', () {
        expect(
          () => KitbaseChangelogs(token: ''),
          throwsA(isA<ChangelogsValidationException>()),
        );
      });

      test('creates client with valid token', () {
        final client = KitbaseChangelogs(token: 'test-token');
        expect(client, isA<KitbaseChangelogs>());
        client.close();
      });
    });

    group('get', () {
      test('throws ChangelogsValidationException when version is empty',
          () async {
        final client = KitbaseChangelogs(token: 'test-token');
        expect(
          () => client.get(''),
          throwsA(isA<ChangelogsValidationException>()),
        );
        client.close();
      });

      test('successfully gets a changelog', () async {
        final mockResponse = {
          'id': 'cl-123',
          'version': '1.0.0',
          'markdown': '## What\'s New\n\n- Added feature X',
          'isPublished': true,
          'projectId': 'proj-456',
          'createdAt': '2024-01-14T08:00:00Z',
          'updatedAt': '2024-01-15T10:30:00Z',
        };

        final mockClient = MockClient((request) async {
          expect(request.url.toString(),
              'https://api.kitbase.dev/v1/changelogs/1.0.0');
          expect(request.method, 'GET');
          expect(request.headers['Authorization'], 'Bearer test-token');
          return http.Response(jsonEncode(mockResponse), 200);
        });

        final client =
            KitbaseChangelogs(token: 'test-token', client: mockClient);
        final result = await client.get('1.0.0');

        expect(result.id, 'cl-123');
        expect(result.version, '1.0.0');
        expect(result.markdown, '## What\'s New\n\n- Added feature X');
        expect(result.isPublished, true);
        expect(result.projectId, 'proj-456');
        client.close();
      });

      test('URL encodes the version', () async {
        final mockClient = MockClient((request) async {
          expect(request.url.toString(),
              'https://api.kitbase.dev/v1/changelogs/1.0.0-beta.1');
          return http.Response(
            jsonEncode({
              'id': 'cl-123',
              'version': '1.0.0-beta.1',
              'markdown': '## Beta Release',
              'isPublished': true,
              'projectId': 'proj-456',
              'createdAt': '2024-01-14T08:00:00Z',
              'updatedAt': '2024-01-15T10:30:00Z',
            }),
            200,
          );
        });

        final client =
            KitbaseChangelogs(token: 'test-token', client: mockClient);
        await client.get('1.0.0-beta.1');
        client.close();
      });

      test('throws ChangelogsAuthenticationException on 401', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Invalid API key'}),
            401,
          );
        });

        final client =
            KitbaseChangelogs(token: 'invalid-token', client: mockClient);
        expect(
          () => client.get('1.0.0'),
          throwsA(isA<ChangelogsAuthenticationException>()),
        );
        client.close();
      });

      test('throws ChangelogsNotFoundException on 404', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Changelog not found'}),
            404,
          );
        });

        final client =
            KitbaseChangelogs(token: 'test-token', client: mockClient);
        expect(
          () => client.get('99.99.99'),
          throwsA(isA<ChangelogsNotFoundException>()),
        );
        client.close();
      });

      test('throws ChangelogsApiException on other HTTP errors', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Server error'}),
            500,
          );
        });

        final client =
            KitbaseChangelogs(token: 'test-token', client: mockClient);
        expect(
          () => client.get('1.0.0'),
          throwsA(isA<ChangelogsApiException>()),
        );
        client.close();
      });
    });
  });
}


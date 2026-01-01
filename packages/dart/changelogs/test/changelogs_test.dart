import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kitbase_changelogs/kitbase_changelogs.dart';
import 'package:test/test.dart';

void main() {
  group('Changelogs', () {
    group('constructor', () {
      test('throws ValidationException when token is empty', () {
        expect(
          () => Changelogs(token: ''),
          throwsA(isA<ValidationException>()),
        );
      });

      test('creates client with valid token', () {
        final client = Changelogs(token: 'test-token');
        expect(client, isA<Changelogs>());
        client.close();
      });
    });

    group('get', () {
      test('throws ValidationException when version is empty', () async {
        final client = Changelogs(token: 'test-token');
        expect(
          () => client.get(''),
          throwsA(isA<ValidationException>()),
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

        final client = Changelogs(token: 'test-token', client: mockClient);
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

        final client = Changelogs(token: 'test-token', client: mockClient);
        await client.get('1.0.0-beta.1');
        client.close();
      });

      test('throws AuthenticationException on 401', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Invalid API key'}),
            401,
          );
        });

        final client = Changelogs(token: 'invalid-token', client: mockClient);
        expect(
          () => client.get('1.0.0'),
          throwsA(isA<AuthenticationException>()),
        );
        client.close();
      });

      test('throws NotFoundException on 404', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Changelog not found'}),
            404,
          );
        });

        final client = Changelogs(token: 'test-token', client: mockClient);
        expect(
          () => client.get('99.99.99'),
          throwsA(isA<NotFoundException>()),
        );
        client.close();
      });

      test('throws ApiException on other HTTP errors', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Server error'}),
            500,
          );
        });

        final client = Changelogs(token: 'test-token', client: mockClient);
        expect(
          () => client.get('1.0.0'),
          throwsA(isA<ApiException>()),
        );
        client.close();
      });
    });
  });
}


import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kitbase/flags.dart';
import 'package:test/test.dart';

void main() {
  group('KitbaseFlags', () {
    group('constructor', () {
      test('throws FlagsValidationException when token is empty', () {
        expect(
          () => KitbaseFlags(token: ''),
          throwsA(isA<FlagsValidationException>()),
        );
      });

      test('creates client with valid token', () {
        final client = KitbaseFlags(token: 'test-token');
        expect(client, isA<KitbaseFlags>());
        client.close();
      });
    });

    group('getSnapshot', () {
      test('successfully gets flag snapshot', () async {
        final mockResponse = {
          'projectId': 'proj-123',
          'environmentId': 'env-456',
          'evaluatedAt': '2024-01-15T10:30:00Z',
          'flags': [
            {
              'flagKey': 'dark-mode',
              'enabled': true,
              'valueType': 'boolean',
              'value': true,
              'reason': 'STATIC',
            },
          ],
        };

        final mockClient = MockClient((request) async {
          expect(request.url.toString(),
              'https://api.kitbase.dev/v1/feature-flags/snapshot');
          expect(request.method, 'POST');
          expect(request.headers['Authorization'], 'Bearer test-token');
          expect(request.headers['Content-Type'], 'application/json');
          return http.Response(jsonEncode(mockResponse), 200);
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.getSnapshot();

        expect(result.projectId, 'proj-123');
        expect(result.environmentId, 'env-456');
        expect(result.flags.length, 1);
        expect(result.flags[0].flagKey, 'dark-mode');
        expect(result.flags[0].value, true);
        client.close();
      });

      test('sends context with snapshot request', () async {
        Map<String, dynamic>? capturedBody;

        final mockClient = MockClient((request) async {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode({
              'projectId': 'proj-123',
              'environmentId': 'env-456',
              'evaluatedAt': '2024-01-15T10:30:00Z',
              'flags': [],
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        await client.getSnapshot(
          options: EvaluateOptions(
            context: EvaluationContext(
              targetingKey: 'user-123',
              attributes: {'plan': 'premium', 'country': 'US'},
            ),
          ),
        );

        expect(capturedBody, {
          'identityId': 'user-123',
          'context': {'plan': 'premium', 'country': 'US'},
        });
        client.close();
      });
    });

    group('evaluateFlag', () {
      test('throws FlagsValidationException when flagKey is empty', () async {
        final client = KitbaseFlags(token: 'test-token');
        expect(
          () => client.evaluateFlag(''),
          throwsA(isA<FlagsValidationException>()),
        );
        client.close();
      });

      test('successfully evaluates a flag', () async {
        final mockResponse = {
          'flagKey': 'dark-mode',
          'enabled': true,
          'valueType': 'boolean',
          'value': true,
          'variant': 'default-enabled',
          'reason': 'STATIC',
        };

        final mockClient = MockClient((request) async {
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          expect(body['flagKey'], 'dark-mode');
          return http.Response(jsonEncode(mockResponse), 200);
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.evaluateFlag('dark-mode');

        expect(result.flagKey, 'dark-mode');
        expect(result.enabled, true);
        expect(result.value, true);
        expect(result.variant, 'default-enabled');
        expect(result.reason, ResolutionReason.static_);
        client.close();
      });

      test('sends context and defaultValue', () async {
        Map<String, dynamic>? capturedBody;

        final mockClient = MockClient((request) async {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode({
              'flagKey': 'feature-x',
              'enabled': true,
              'valueType': 'boolean',
              'value': true,
              'reason': 'TARGETING_MATCH',
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        await client.evaluateFlag(
          'feature-x',
          context: EvaluationContext(
            targetingKey: 'user-123',
            attributes: {'plan': 'premium'},
          ),
          defaultValue: false,
        );

        expect(capturedBody, {
          'flagKey': 'feature-x',
          'identityId': 'user-123',
          'context': {'plan': 'premium'},
          'defaultValue': false,
        });
        client.close();
      });
    });

    group('getBooleanValue', () {
      test('returns boolean value', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'flagKey': 'dark-mode',
              'enabled': true,
              'valueType': 'boolean',
              'value': true,
              'reason': 'STATIC',
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.getBooleanValue('dark-mode', false);

        expect(result, true);
        client.close();
      });

      test('returns default value when flag is disabled', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'flagKey': 'dark-mode',
              'enabled': false,
              'valueType': 'boolean',
              'value': null,
              'reason': 'DISABLED',
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.getBooleanValue('dark-mode', true);

        expect(result, true);
        client.close();
      });

      test('throws TypeMismatchException for wrong type', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'flagKey': 'api-url',
              'enabled': true,
              'valueType': 'string',
              'value': 'https://api.example.com',
              'reason': 'STATIC',
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        expect(
          () => client.getBooleanValue('api-url', false),
          throwsA(isA<TypeMismatchException>()),
        );
        client.close();
      });
    });

    group('getStringValue', () {
      test('returns string value', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'flagKey': 'api-url',
              'enabled': true,
              'valueType': 'string',
              'value': 'https://api.example.com',
              'reason': 'STATIC',
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.getStringValue('api-url', 'default');

        expect(result, 'https://api.example.com');
        client.close();
      });
    });

    group('getNumberValue', () {
      test('returns number value', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'flagKey': 'max-items',
              'enabled': true,
              'valueType': 'number',
              'value': 100,
              'reason': 'STATIC',
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.getNumberValue('max-items', 50);

        expect(result, 100);
        client.close();
      });
    });

    group('getJsonValue', () {
      test('returns JSON value', () async {
        final jsonValue = {'theme': 'dark', 'fontSize': 14};
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'flagKey': 'ui-config',
              'enabled': true,
              'valueType': 'json',
              'value': jsonValue,
              'reason': 'STATIC',
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.getJsonValue<Map<String, dynamic>>(
          'ui-config',
          <String, dynamic>{},
        );

        expect(result, jsonValue);
        client.close();
      });
    });

    group('getBooleanDetails', () {
      test('returns full resolution details', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'flagKey': 'feature-x',
              'enabled': true,
              'valueType': 'boolean',
              'value': true,
              'variant': 'segment-abc123',
              'reason': 'TARGETING_MATCH',
              'flagMetadata': {'name': 'Feature X'},
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.getBooleanDetails(
          'feature-x',
          false,
          context: EvaluationContext(targetingKey: 'user-123'),
        );

        expect(result.value, true);
        expect(result.variant, 'segment-abc123');
        expect(result.reason, ResolutionReason.targetingMatch);
        expect(result.flagMetadata, {'name': 'Feature X'});
        client.close();
      });

      test('returns default value with error details for FLAG_NOT_FOUND',
          () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'flagKey': 'unknown-flag',
              'enabled': false,
              'valueType': 'boolean',
              'value': false,
              'reason': 'ERROR',
              'errorCode': 'FLAG_NOT_FOUND',
              'errorMessage': "Flag 'unknown-flag' not found",
            }),
            200,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        final result = await client.getBooleanDetails('unknown-flag', true);

        expect(result.value, true);
        expect(result.reason, ResolutionReason.error);
        expect(result.errorCode, ErrorCode.flagNotFound);
        client.close();
      });
    });

    group('error handling', () {
      test('throws FlagsAuthenticationException on 401', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Invalid API key'}),
            401,
          );
        });

        final client =
            KitbaseFlags(token: 'invalid-token', client: mockClient);
        expect(
          () => client.getSnapshot(),
          throwsA(isA<FlagsAuthenticationException>()),
        );
        client.close();
      });

      test('throws FlagsApiException on other HTTP errors', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({'message': 'Invalid request'}),
            400,
          );
        });

        final client = KitbaseFlags(token: 'test-token', client: mockClient);
        expect(
          () => client.getSnapshot(),
          throwsA(isA<FlagsApiException>()),
        );
        client.close();
      });
    });
  });
}

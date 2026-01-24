import 'package:kitbase_analytics/src/core/network/kitbase_http_client.dart';
import 'package:kitbase_analytics/src/core/network/kitbase_http_response.dart';
import 'package:kitbase_analytics/src/core/utils/kitbase_logger.dart';
import 'package:kitbase_analytics/src/domain/entities/log_payload.dart';
import 'package:kitbase_analytics/src/data/parsers/log_payload_parser.dart';

abstract class AnalyticsRemoteDataSource {
  Future<KitbaseHttpResponse> log(LogPayload payload);

  /// Sends the log payload and returns true if successful (2xx status code).
  /// Returns false for any other status code or exception.
  Future<bool> send(LogPayload payload);
}

class AnalyticsRemoteDataSourceImpl implements AnalyticsRemoteDataSource {
  const AnalyticsRemoteDataSourceImpl();

  @override
  Future<KitbaseHttpResponse> log(LogPayload payload) async {
    return KitbaseHttpClient.instance.post(
      path: '/sdk/v1/logs',
      data: LogPayloadParser.toJson(payload),
    );
  }

  @override
  Future<bool> send(LogPayload payload) async {
    try {
      final response = await log(payload);
      return response.isSuccess;
    } catch (e) {
      KitbaseLogger.error('Failed to send log: $e');
      return false;
    }
  }
}

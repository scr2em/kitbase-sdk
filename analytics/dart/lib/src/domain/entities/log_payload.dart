/// Internal request payload sent to the API
class LogPayload {
  final String channel;
  final String event;
  final String? userId;
  final String? anonymousId;
  final String? icon;
  final bool? notify;
  final String? description;
  final Map<String, dynamic>? tags;
  final int? timestamp;

  LogPayload({
    required this.channel,
    required this.event,
    this.userId,
    this.anonymousId,
    this.icon,
    this.notify,
    this.description,
    this.tags,
    this.timestamp,
  });
}

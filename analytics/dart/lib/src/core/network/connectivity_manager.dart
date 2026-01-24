import 'dart:async';

import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';

/// Interface for connectivity management to allow easy replacement/mocking
abstract interface class ConnectivityManager {
  /// Stream of connectivity changes (true = connected, false = disconnected)
  Stream<bool> get onConnectivityChanged;

  /// Current connectivity status
  bool get isConnected;

  /// Dispose resources
  void dispose();
}

/// Implementation using internet_connection_checker_plus
class ConnectivityManagerImpl implements ConnectivityManager {
  final InternetConnection _checker;
  StreamSubscription<InternetStatus>? _subscription;
  final _controller = StreamController<bool>.broadcast();

  bool _isConnected = false;

  ConnectivityManagerImpl([InternetConnection? checker])
      : _checker = checker ?? InternetConnection();

  void init() async {
    _isConnected = await _checker.hasInternetAccess;
    _subscription = _checker.onStatusChange.listen((status) {
      final isConnected = status == InternetStatus.connected;
      _controller.add(isConnected);
      _isConnected = isConnected;
    });
  }

  @override
  Stream<bool> get onConnectivityChanged {
    if (_subscription == null) init();
    return _controller.stream;
  }

  @override
  bool get isConnected => _isConnected;

  @override
  void dispose() {
    _subscription?.cancel();
    _controller.close();
  }
}

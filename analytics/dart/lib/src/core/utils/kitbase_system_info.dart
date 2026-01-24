import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:kitbase_analytics/src/core/utils/device_context_provider.dart';

/// Default implementation of [KitbaseDeviceContextProvider] using device_info_plus.
///
/// This class gathers system and device information from the platform.
class KitbaseSystemInfo implements KitbaseDeviceContextProvider {
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  Map<String, dynamic> _deviceContext = {};

  /// Get the cached device context
  @override
  Map<String, dynamic> get deviceContext => Map.unmodifiable(_deviceContext);

  /// Initialize system info (call once at app startup)
  @override
  Future<void> init() async {
    String os = 'unknown';
    String osVersion = 'unknown';
    String deviceModel = 'unknown';

    try {
      if (kIsWeb) {
        os = 'web';
        final webInfo = await _deviceInfo.webBrowserInfo;
        osVersion = webInfo.appVersion ?? 'unknown';
        deviceModel = webInfo.userAgent ?? 'unknown';
      } else {
        if (Platform.isAndroid) {
          os = 'android';
          final androidInfo = await _deviceInfo.androidInfo;
          osVersion = androidInfo.version.release;
          deviceModel = '${androidInfo.brand} ${androidInfo.model}';
        } else if (Platform.isIOS) {
          os = 'ios';
          final iosInfo = await _deviceInfo.iosInfo;
          osVersion = iosInfo.systemVersion;
          deviceModel = iosInfo.model;
        } else if (Platform.isMacOS) {
          os = 'macos';
          final macInfo = await _deviceInfo.macOsInfo;
          osVersion = macInfo.osRelease;
          deviceModel = macInfo.model;
        } else if (Platform.isWindows) {
          os = 'windows';
          final windowsInfo = await _deviceInfo.windowsInfo;
          osVersion = '${windowsInfo.majorVersion}.${windowsInfo.minorVersion}';
          deviceModel = windowsInfo.computerName;
        } else if (Platform.isLinux) {
          os = 'linux';
          final linuxInfo = await _deviceInfo.linuxInfo;
          osVersion = linuxInfo.versionId ?? 'unknown';
          deviceModel = linuxInfo.prettyName;
        }
      }
    } catch (e) {
      debugPrint('Failed to get device info: $e');
    }

    // Get App Version & Build Number
    String appVersion = 'unknown';
    String buildNumber = 'unknown';
    try {
      if (!kIsWeb) {
        final info = await PackageInfo.fromPlatform();
        appVersion = info.version;
        buildNumber = info.buildNumber;
      }
    } catch (_) {}

    _deviceContext = {
      '__os': os,
      '__os_version': osVersion,
      '__device': deviceModel,
      if (appVersion != 'unknown') '__app_version': appVersion,
      if (buildNumber != 'unknown') '__build_number': buildNumber,
    };
  }
}

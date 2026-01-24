/// Abstract interface for providing device context information.
///
/// Implement this interface to provide custom device context or for mocking in tests.
abstract class KitbaseDeviceContextProvider {
  /// Get the device context map containing platform information.
  ///
  /// Expected keys: `_os`, `_os_version`, `__device`, optionally `__app_version and __build_number`.
  Map<String, dynamic> get deviceContext;

  /// Initialize the provider (fetch device info, etc.)
  Future<void> init();
}

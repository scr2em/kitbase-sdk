import 'package:flutter/material.dart';
import 'package:kitbase_analytics/src/core/client/kitbase_analytics.dart';
import 'package:kitbase_analytics/src/domain/entities/page_view_options.dart';

/// A NavigatorObserver that automatically tracks page views.
///
/// Works with both Navigator 1.0 and Navigator 2.0 (GoRouter, auto_route, etc.)
///
/// Usage with MaterialApp:
/// ```dart
/// MaterialApp(
///   navigatorObservers: [KitbasePageTracker()],
///   // ...
/// )
/// ```
///
/// Usage with GoRouter:
/// ```dart
/// GoRouter(
///   observers: [KitbasePageTracker()],
///   routes: [...],
/// )
/// ```
class KitbasePageTracker extends NavigatorObserver {
  /// Optional callback to customize the screen name extraction
  final String Function(Route<dynamic> route)? screenNameExtractor;

  /// Last tracked route to avoid duplicate tracking
  String? _lastTrackedRoute;

  KitbasePageTracker({this.screenNameExtractor});

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _trackIfNew(route);
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    if (newRoute != null) {
      _trackIfNew(newRoute);
    }
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    // Track the previous route when popping back to it
    if (previousRoute != null) {
      _trackIfNew(previousRoute);
    }
  }

  @override
  void didRemove(Route<dynamic> route, Route<dynamic>? previousRoute) {
    // Track the previous route if the top route was removed
    if (previousRoute != null) {
      _trackIfNew(previousRoute);
    }
  }

  void _trackIfNew(Route<dynamic> route) {
    final name = _extractScreenName(route);
    if (name != _lastTrackedRoute && name != 'unknown') {
      _lastTrackedRoute = name;
      _trackPageView(route, name);
    }
  }

  void _trackPageView(Route<dynamic> route, String screenName) {
    KitbaseAnalytics.trackPageView(
      PageViewOptions(
        path: route.settings.name,
        title: screenName,
        tags: {
          'screen_class': route.runtimeType.toString(),
          'timestamp': DateTime.now().toIso8601String(),
        },
      ),
    );
  }

  String _extractScreenName(Route<dynamic> route) {
    // Use custom extractor if provided
    if (screenNameExtractor != null) {
      return screenNameExtractor!(route);
    }

    // Priority: explicit name > widget name > route type
    if (route.settings.name != null && route.settings.name != '/') {
      return route.settings.name!;
    }

    // Try to get widget class name for MaterialPageRoute
    if (route is MaterialPageRoute) {
      // Get the builder's result type
      final routeStr = route.toString();
      // Extract class name from route string if possible
      final match = RegExp(r'MaterialPageRoute<.*>\(.*\)').firstMatch(routeStr);
      if (match != null) {
        return 'MaterialPageRoute';
      }
    }

    // Fallback to route type
    if (route.settings.name == '/') {
      return 'Home';
    }

    return 'unknown';
  }
}

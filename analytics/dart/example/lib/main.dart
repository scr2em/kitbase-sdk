import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:kitbase_analytics/kitbase_analytics.dart';

// Pages
import 'screens/home_screen.dart';
import 'screens/product_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/debug_data_screen.dart';

void main() async {
  // Ensure Flutter binding is initialized before using plugins
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Analytics
  try {
    await KitbaseAnalytics.init(
      KitbaseConfig(
        token: '<YOUR_TOKEN>',
        debug: true, // Enable debug logging to see what's happening
      ),
    );
  } catch (e) {
    debugPrint('Failed to init analytics: $e');
  }

  runApp(const MyApp());
}

// Router Configuration
final _router = GoRouter(
  initialLocation: '/',
  observers: [KitbasePageTracker()], // Auto-track page views
  routes: [
    GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
    GoRoute(
      path: '/product/:id',
      builder: (context, state) =>
          ProductScreen(id: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/debug-data',
      builder: (context, state) => const DebugDataScreen(),
    ),
  ],
);

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Kitbase Analytics Example',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      routerConfig: _router,
    );
  }
}

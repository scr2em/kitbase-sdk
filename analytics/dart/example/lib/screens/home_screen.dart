import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:kitbase_analytics/kitbase_analytics.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Track page view
    KitbaseAnalytics.trackPageView(
      PageViewOptions(title: 'Home Screen', tags: {'platform': 'mobile'}),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kitbase Analytics Example')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Welcome!',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                // Identify User
                KitbaseAnalytics.identify(
                  IdentifyOptions(
                    userId: 'user_${DateTime.now().millisecondsSinceEpoch}',
                    traits: {'plan': 'free', 'source': 'example_app'},
                  ),
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('User Identified!')),
                );
              },
              child: const Text('Identify User (Login)'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                // Track Event
                KitbaseAnalytics.track(
                  TrackOptions(
                    channel: 'home',
                    event: 'Button Clicked',
                    tags: {'btn_name': 'test_event_btn'},
                  ),
                );
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(const SnackBar(content: Text('Event Tracked!')));
              },
              child: const Text('Track "Button Clicked"'),
            ),
            const SizedBox(height: 40),
            const Text('Navigate to Products:'),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              children: [
                ActionChip(
                  label: const Text('Product A'),
                  onPressed: () => context.push('/product/A'),
                ),
                ActionChip(
                  label: const Text('Product B'),
                  onPressed: () => context.push('/product/B'),
                ),
              ],
            ),
            const SizedBox(height: 40),
            ElevatedButton.icon(
              icon: const Icon(Icons.settings),
              label: const Text('Settings'),
              onPressed: () => context.push('/settings'),
            ),
          ],
        ),
      ),
    );
  }
}

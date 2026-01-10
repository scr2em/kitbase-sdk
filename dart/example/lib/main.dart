import 'package:flutter/material.dart';
import 'package:kitbase/kitbase.dart';

void main() {
  Kitbase.init(
    config: KitbaseConfig(
      token: 'YOUR_API_KEY', // Replace with your actual API key
      events: EventsConfig(),
    ),
  );

  runApp(const KitbaseExampleApp());
}

class KitbaseExampleApp extends StatelessWidget {
  const KitbaseExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kitbase Events Demo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kitbase Events Demo'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _SectionHeader(title: 'User Actions'),
          _TrackingCard(
            title: 'User Sign Up',
            description: 'Track when a new user registers',
            icon: Icons.person_add,
            channel: 'auth',
            event: 'User Sign Up',
            eventIcon: '👤',
            tags: {'method': 'email', 'source': 'mobile_app'},
          ),
          _TrackingCard(
            title: 'User Login',
            description: 'Track user login events',
            icon: Icons.login,
            channel: 'auth',
            event: 'User Login',
            eventIcon: '🔐',
            tags: {'method': 'password'},
          ),
          SizedBox(height: 24),
          _SectionHeader(title: 'E-Commerce'),
          _TrackingCard(
            title: 'Add to Cart',
            description: 'Track when items are added to cart',
            icon: Icons.add_shopping_cart,
            channel: 'shopping',
            event: 'Add to Cart',
            eventIcon: '🛒',
            tags: {'product_id': 'SKU-123', 'quantity': 1, 'price': 29.99},
          ),
          _TrackingCard(
            title: 'Purchase Complete',
            description: 'Track successful purchases',
            icon: Icons.payment,
            channel: 'payments',
            event: 'Purchase Complete',
            eventIcon: '💰',
            notify: true,
            tags: {'order_id': 'ORD-456', 'total': 99.99, 'currency': 'USD'},
          ),
          SizedBox(height: 24),
          _SectionHeader(title: 'Engagement'),
          _TrackingCard(
            title: 'Feature Used',
            description: 'Track feature usage',
            icon: Icons.touch_app,
            channel: 'engagement',
            event: 'Feature Used',
            eventIcon: '✨',
            tags: {'feature': 'dark_mode', 'enabled': true},
          ),
          _TrackingCard(
            title: 'Feedback Submitted',
            description: 'Track user feedback',
            icon: Icons.feedback,
            channel: 'feedback',
            event: 'Feedback Submitted',
            eventIcon: '📝',
            notify: true,
            eventDescription: 'User submitted app feedback',
            tags: {'rating': 5, 'category': 'feature_request'},
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}

class _TrackingCard extends StatefulWidget {
  final String title;
  final String description;
  final IconData icon;
  final String channel;
  final String event;
  final String? eventIcon;
  final String? eventDescription;
  final bool? notify;
  final Map<String, dynamic>? tags;

  const _TrackingCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.channel,
    required this.event,
    this.eventIcon,
    this.eventDescription,
    this.notify,
    this.tags,
  });

  @override
  State<_TrackingCard> createState() => _TrackingCardState();
}

class _TrackingCardState extends State<_TrackingCard> {
  bool _isLoading = false;
  String? _lastEventId;
  String? _error;

  Future<void> _trackEvent() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await Kitbase.events.track(
        channel: widget.channel,
        event: widget.event,
        userId: 'demo-user-123',
        icon: widget.eventIcon,
        description: widget.eventDescription,
        notify: widget.notify,
        tags: widget.tags,
      );

      setState(() {
        _lastEventId = response.id;
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Event tracked: ${response.id}'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } on KitbaseAuthenticationException catch (e) {
      setState(() {
        _error = 'Auth error: ${e.message}';
        _isLoading = false;
      });
    } on KitbaseConnectionException catch (e) {
      setState(() {
        _error = 'Connection error: ${e.message}';
        _isLoading = false;
      });
    } on KitbaseApiException catch (e) {
      setState(() {
        _error = 'API error: ${e.message}';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    widget.icon,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InfoRow(label: 'Channel', value: widget.channel),
                  _InfoRow(label: 'Event', value: widget.event),
                  if (widget.tags != null)
                    _InfoRow(label: 'Tags', value: widget.tags.toString()),
                ],
              ),
            ),
            if (_lastEventId != null) ...[
              const SizedBox(height: 8),
              Text(
                'Last Event ID: $_lastEventId',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.green),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(
                _error!,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.red),
              ),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _isLoading ? null : _trackEvent,
                icon: _isLoading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send),
                label: Text(_isLoading ? 'Tracking...' : 'Track Event'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              '$label:',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}

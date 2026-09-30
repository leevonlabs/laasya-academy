import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class TrainerNotificationsScreen extends StatefulWidget {
  const TrainerNotificationsScreen({super.key});

  @override
  State<TrainerNotificationsScreen> createState() => _TrainerNotificationsScreenState();
}

class _TrainerNotificationsScreenState extends State<TrainerNotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final data = await SupabaseService().getNotifications();
    if (mounted) {
      setState(() {
        _notifications = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        title: const Text('Faculty Notices & Updates'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = _notifications[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3E8EE),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.campaign_rounded, color: LaasyaColors.primary, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['title']!,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item['message']!,
                              style: const TextStyle(fontSize: 12, color: Colors.black87, height: 1.35),
                            ),
                            const SizedBox(height: 6),
                            Text(item['date']!, style: TextStyle(fontSize: 10.5, color: Colors.grey.shade500)),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

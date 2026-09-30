import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentNotificationsScreen extends StatefulWidget {
  const StudentNotificationsScreen({super.key});

  @override
  State<StudentNotificationsScreen> createState() => _StudentNotificationsScreenState();
}

class _StudentNotificationsScreenState extends State<StudentNotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    final data = await SupabaseService().getNotifications();
    if (mounted) {
      setState(() {
        _notifications = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _markRead(String id) async {
    await SupabaseService().markNotificationAsRead(id);
    setState(() {
      for (var n in _notifications) {
        if (n['id'] == id) n['is_read'] = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _notifications.where((n) {
      if (_selectedFilter == 'Unread') return n['is_read'] == false;
      if (_selectedFilter == 'Announcements') return n['type'] == 'announcement';
      if (_selectedFilter == 'Reminders') return n['type'] == 'reminder' || n['type'] == 'schedule_change';
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        title: const Text('Academy Notifications & Updates'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded),
            tooltip: 'Mark All Read',
            onPressed: () {
              setState(() {
                for (var n in _notifications) {
                  n['is_read'] = true;
                }
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All notifications marked as read')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['All', 'Unread', 'Announcements', 'Reminders'].map((f) {
                  final isSel = _selectedFilter == f;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(f),
                      selected: isSel,
                      selectedColor: LaasyaColors.primary,
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : LaasyaColors.textDark,
                        fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                        fontSize: 12,
                      ),
                      onSelected: (val) {
                        if (val) setState(() => _selectedFilter = f);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.notifications_off_outlined, size: 56, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            const Text(
                              'No notifications found',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black54),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'You are all caught up with academy notices!',
                              style: TextStyle(fontSize: 12, color: Colors.black38),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          final isUnread = item['is_read'] == false;
                          final type = item['type'] ?? 'general';

                          IconData iconData = Icons.notifications_rounded;
                          Color iconColor = LaasyaColors.primary;
                          if (type == 'announcement') {
                            iconData = Icons.campaign_rounded;
                            iconColor = const Color(0xFFD97706);
                          } else if (type == 'holiday') {
                            iconData = Icons.beach_access_rounded;
                            iconColor = const Color(0xFF2563EB);
                          } else if (type == 'schedule_change') {
                            iconData = Icons.schedule_rounded;
                            iconColor = const Color(0xFFDC2626);
                          }

                          return InkWell(
                            onTap: () => _markRead(item['id']),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isUnread ? const Color(0xFFFFF7F9) : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isUnread ? LaasyaColors.primary.withOpacity(0.3) : Colors.grey.shade200,
                                  width: isUnread ? 1.5 : 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.03),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: iconColor.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(iconData, color: iconColor, size: 22),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                item['title']!,
                                                style: TextStyle(
                                                  fontSize: 13.5,
                                                  fontWeight: isUnread ? FontWeight.bold : FontWeight.w600,
                                                  color: LaasyaColors.textDark,
                                                ),
                                              ),
                                            ),
                                            if (isUnread)
                                              Container(
                                                width: 8,
                                                height: 8,
                                                decoration: const BoxDecoration(
                                                  color: LaasyaColors.primary,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          item['message']!,
                                          style: const TextStyle(fontSize: 12, color: Colors.black87, height: 1.35),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          item['date']!,
                                          style: TextStyle(fontSize: 10.5, color: Colors.grey.shade500),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import 'student_messages_screen.dart';
import 'student_video_library_screen.dart';

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
    _notifications = SupabaseService().getCachedNotifications();
    _isLoading = _notifications.isEmpty;
    _loadNotifications();
  }

  Future<void> _loadNotifications({bool isRefresh = false}) async {
    if (!isRefresh && _notifications.isEmpty) {
      setState(() => _isLoading = true);
    }
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

  Future<void> _markAllRead() async {
    setState(() {
      for (var n in _notifications) {
        n['is_read'] = true;
        SupabaseService().markNotificationAsRead(n['id']?.toString() ?? '');
      }
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('All notifications marked as read'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _handleNotificationClick(Map<String, dynamic> item) {
    _markRead(item['id']?.toString() ?? '');
    final type = (item['type'] ?? 'general').toString().toLowerCase();
    final title = (item['title'] ?? '').toString().toLowerCase();
    final message = (item['message'] ?? '').toString().toLowerCase();

    // 1. Class Concluded Alert (Navigate to Attendance)
    if (type == 'class_alert' || type == 'alarm' || type == 'class_closed' ||
        title.contains('class completed') || title.contains('concluded') || message.contains('class completed')) {
      Navigator.pop(context, {'action': 'switch_tab', 'index': 3});
      return;
    }

    // 2. Attendance Redirection
    if (type == 'attendance' || title.contains('attendance') || message.contains('attendance')) {
      Navigator.pop(context, {'action': 'switch_tab', 'index': 3});
      return;
    }

    // 3. Announcements / Noticeboard Messages Redirection
    if (type == 'announcement' || type == 'message' || title.contains('announcement') || title.contains('notice') || title.contains('circular')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const StudentMessagesScreen()),
      );
      return;
    }

    // 4. Video Library Redirection
    if (type == 'video' || type == 'video_shared' || type == 'video_library' || title.contains('video') || message.contains('drive vault') || message.contains('youtube') || message.contains('learning video')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const StudentVideoLibraryScreen()),
      );
      return;
    }

    // 5. Payment / Tuition Fee Redirection
    if (type == 'payment' || type == 'fee' || title.contains('fee') || title.contains('receipt') || title.contains('payment') || message.contains('tuition')) {
      Navigator.pop(context, {'action': 'switch_tab', 'index': 0, 'view': 'tuition'});
      return;
    }

    // 6. Fallback / General Notice Details
    _showNotificationDetail(item);
  }

  void _showNotificationDetail(Map<String, dynamic> item) {
    _markRead(item['id']?.toString() ?? '');
    final type = (item['type'] ?? 'general').toString();
    final isAttendance = type == 'attendance';
    final isClassAlert = type == 'class_alert';
    final status = (item['status'] ?? '').toString().toUpperCase();
    final isPresent = status == 'PRESENT';

    Color themeColor = LaasyaColors.primary;
    IconData headerIcon = Icons.notifications_rounded;
    String typeLabel = 'Academy Notice';

    if (isAttendance) {
      themeColor = isPresent ? const Color(0xFF059669) : const Color(0xFFDC2626);
      headerIcon = isPresent ? Icons.verified_rounded : Icons.cancel_rounded;
      typeLabel = 'Attendance Record: $status';
    } else if (isClassAlert) {
      themeColor = const Color(0xFFEA580C);
      headerIcon = Icons.notifications_active_rounded;
      typeLabel = 'Class Concluded Alert';
    } else if (type == 'announcement') {
      themeColor = const Color(0xFFD97706);
      headerIcon = Icons.campaign_rounded;
      typeLabel = 'Official Announcement';
    } else if (type == 'reminder') {
      themeColor = const Color(0xFF4F46E5);
      headerIcon = Icons.alarm_rounded;
      typeLabel = 'Fee / Schedule Reminder';
    } else if (type == 'payment') {
      themeColor = const Color(0xFF0D9488);
      headerIcon = Icons.receipt_long_rounded;
      typeLabel = 'Fee Payment Receipt';
    }

    final rawAlert = item['raw_alert'];
    final actionLinks = (item['action_links'] as List?) ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: themeColor.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(headerIcon, color: themeColor, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: themeColor.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            typeLabel,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: themeColor,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          (item['date']?.toString() ?? 'Recent'),
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                (item['title']?.toString() ?? 'Notice'),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Text(
                  (item['message']?.toString() ?? ''),
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.5,
                    color: Color(0xFF334155),
                  ),
                ),
              ),
              if (rawAlert != null && rawAlert['batch_name'] != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.school_outlined, size: 16, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text(
                      'Course: ${rawAlert['course_title'] ?? ''} • ${rawAlert['batch_name'] ?? ''}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                    ),
                  ],
                ),
              ],
              if (actionLinks.isNotEmpty) ...[
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 8,
                  children: actionLinks.map<Widget>((link) {
                    final lMap = link is Map ? link : {};
                    final linkTitle = lMap['title']?.toString() ?? 'Open Link';
                    final linkUrl = lMap['url']?.toString() ?? '';
                    return ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: LaasyaColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      icon: const Icon(Icons.open_in_new_rounded, size: 16),
                      label: Text(linkTitle, style: const TextStyle(fontSize: 12)),
                      onPressed: () async {
                        if (linkUrl.isNotEmpty) {
                          final uri = Uri.parse(linkUrl);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri);
                          }
                        }
                      },
                    );
                  }).toList(),
                ),
              ],
              if (isAttendance) ...[
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: themeColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.verified_rounded, size: 18),
                    label: const Text('View Attendance Records', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pop(context, {'action': 'switch_tab', 'index': 3});
                    },
                  ),
                ),
              ] else if (isClassAlert) ...[
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC2410C),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.check_circle_rounded, size: 18),
                    label: const Text('View Attendance', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pop(context, {'action': 'switch_tab', 'index': 3});
                    },
                  ),
                ),
              ] else if (type == 'announcement' || type == 'message') ...[
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: themeColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.campaign_rounded, size: 18),
                    label: const Text('Open Noticeboard Messages', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentMessagesScreen()));
                    },
                  ),
                ),
              ] else if (type == 'video' || type == 'video_shared') ...[
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: LaasyaColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.video_library_rounded, size: 18),
                    label: const Text('Open Learning Video Library', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentVideoLibraryScreen()));
                    },
                  ),
                ),
              ] else if (type == 'payment' || type == 'fee') ...[
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0D9488),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.receipt_long_rounded, size: 18),
                    label: const Text('View Tuition Fee Status', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pop(context, {'action': 'switch_tab', 'index': 0, 'view': 'tuition'});
                    },
                  ),
                ),
              ],
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => n['is_read'] == false).length;
    final attendanceCount = _notifications.where((n) => n['type'] == 'attendance').length;
    final alertsCount = _notifications.where((n) => n['type'] == 'class_alert').length;
    final paymentsCount = _notifications.where((n) => n['type'] == 'payment').length;

    final filtered = _notifications.where((n) {
      if (_selectedFilter == 'Unread') return n['is_read'] == false;
      if (_selectedFilter == 'Attendance') return n['type'] == 'attendance';
      if (_selectedFilter == 'Class Alerts') return n['type'] == 'class_alert';
      if (_selectedFilter == 'Fee Receipts') return n['type'] == 'payment';
      if (_selectedFilter == 'Announcements') return n['type'] == 'announcement';
      if (_selectedFilter == 'Reminders') return n['type'] == 'reminder' || n['type'] == 'schedule_change';
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        title: const Text('Noticeboard & Updates'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded),
            tooltip: 'Mark All Read',
            onPressed: _markAllRead,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadNotifications(isRefresh: true),
        color: LaasyaColors.primary,
        child: Column(
          children: [
            // Elegant Classical Banner with Live Stats
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF800020), Color(0xFF4A0E17)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF800020).withOpacity(0.25),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFFBBF24).withOpacity(0.6), width: 1.5),
                    ),
                    child: const Icon(Icons.notifications_active_rounded, color: Color(0xFFFBBF24), size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Live Academy Feed',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Instant attendance reports, Guru alerts & academy announcements',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Live Metrics Strip
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  _buildMetricPill('Total', '${_notifications.length}', const Color(0xFF475569)),
                  const SizedBox(width: 6),
                  _buildMetricPill('Attendance', '$attendanceCount', const Color(0xFF059669)),
                  const SizedBox(width: 6),
                  _buildMetricPill('Alerts', '$alertsCount', const Color(0xFFEA580C)),
                  const SizedBox(width: 6),
                  _buildMetricPill('Fees', '$paymentsCount', const Color(0xFF0D9488)),
                  const SizedBox(width: 6),
                  _buildMetricPill('Unread', '$unreadCount', LaasyaColors.primary),
                ],
              ),
            ),

            // Filter Chips Carousel
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    'All',
                    'Attendance',
                    'Class Alerts',
                    'Fee Receipts',
                    'Announcements',
                    'Reminders',
                    'Unread',
                  ].map((f) {
                    final isSel = _selectedFilter == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(f),
                        selected: isSel,
                        selectedColor: LaasyaColors.primary,
                        backgroundColor: Colors.white,
                        side: BorderSide(
                          color: isSel ? LaasyaColors.primary : Colors.grey.shade300,
                        ),
                        labelStyle: TextStyle(
                          color: isSel ? Colors.white : LaasyaColors.textDark,
                          fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
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

            // Notifications List
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.notifications_off_outlined, size: 52, color: Colors.grey.shade400),
                              const SizedBox(height: 12),
                              const Text(
                                'No notifications found',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black54),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'All caught up with class notices & announcements!',
                                style: TextStyle(fontSize: 12, color: Colors.black38),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final item = filtered[index];
                            final isUnread = item['is_read'] == false;
                            final type = (item['type'] ?? 'general').toString();
                            final isAttendance = type == 'attendance';
                            final isClassAlert = type == 'class_alert';
                            final status = (item['status'] ?? '').toString().toUpperCase();
                            final isPresent = status == 'PRESENT';

                            Color accentColor = LaasyaColors.primary;
                            IconData iconData = Icons.notifications_rounded;
                            String badgeLabel = 'NOTICE';

                            if (isAttendance) {
                              accentColor = isPresent ? const Color(0xFF059669) : const Color(0xFFDC2626);
                              iconData = isPresent ? Icons.verified_rounded : Icons.cancel_rounded;
                              badgeLabel = 'ATTENDANCE • $status';
                            } else if (isClassAlert) {
                              accentColor = const Color(0xFFEA580C);
                              iconData = Icons.notifications_active_rounded;
                              badgeLabel = 'CLASS CONCLUDED';
                            } else if (type == 'announcement') {
                              accentColor = const Color(0xFFD97706);
                              iconData = Icons.campaign_rounded;
                              badgeLabel = 'ANNOUNCEMENT';
                            } else if (type == 'reminder') {
                              accentColor = const Color(0xFF4F46E5);
                              iconData = Icons.alarm_rounded;
                              badgeLabel = 'REMINDER';
                            } else if (type == 'payment') {
                              accentColor = const Color(0xFF0D9488);
                              iconData = Icons.receipt_long_rounded;
                              badgeLabel = 'FEE RECEIPT';
                            }

                            return Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () => _handleNotificationClick(item),
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: isUnread ? const Color(0xFFFFF9FA) : Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isUnread ? accentColor.withOpacity(0.35) : Colors.grey.shade200,
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
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: IntrinsicHeight(
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.stretch,
                                        children: [
                                          // Left Color Indicator Strip
                                          Container(
                                            width: 5,
                                            color: accentColor,
                                          ),
                                          Expanded(
                                            child: Padding(
                                              padding: const EdgeInsets.all(14),
                                              child: Row(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Container(
                                                    width: 38,
                                                    height: 38,
                                                    decoration: BoxDecoration(
                                                      color: accentColor.withOpacity(0.12),
                                                      borderRadius: BorderRadius.circular(10),
                                                    ),
                                                    child: Icon(iconData, color: accentColor, size: 20),
                                                  ),
                                                  const SizedBox(width: 12),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Row(
                                                          children: [
                                                            Container(
                                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                              decoration: BoxDecoration(
                                                                color: accentColor.withOpacity(0.12),
                                                                borderRadius: BorderRadius.circular(5),
                                                              ),
                                                              child: Text(
                                                                badgeLabel,
                                                                style: TextStyle(
                                                                  fontSize: 9.5,
                                                                  fontWeight: FontWeight.bold,
                                                                  color: accentColor,
                                                                ),
                                                              ),
                                                            ),
                                                            const Spacer(),
                                                            Text(
                                                              (item['date']?.toString() ?? 'Recent'),
                                                              style: TextStyle(fontSize: 10.5, color: Colors.grey.shade500),
                                                            ),
                                                            if (isUnread) ...[
                                                              const SizedBox(width: 6),
                                                              Container(
                                                                width: 7,
                                                                height: 7,
                                                                decoration: BoxDecoration(
                                                                  color: accentColor,
                                                                  shape: BoxShape.circle,
                                                                ),
                                                              ),
                                                            ],
                                                          ],
                                                        ),
                                                        const SizedBox(height: 6),
                                                        Text(
                                                          (item['title']?.toString() ?? 'Academy Update'),
                                                          style: TextStyle(
                                                            fontSize: 13.5,
                                                            fontWeight: isUnread ? FontWeight.bold : FontWeight.w600,
                                                            color: const Color(0xFF1E293B),
                                                          ),
                                                        ),
                                                        const SizedBox(height: 3),
                                                        Text(
                                                          (item['message']?.toString() ?? ''),
                                                          maxLines: 2,
                                                          overflow: TextOverflow.ellipsis,
                                                          style: TextStyle(
                                                            fontSize: 12,
                                                            color: Colors.grey.shade700,
                                                            height: 1.35,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricPill(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

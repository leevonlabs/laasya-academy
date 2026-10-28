import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../student/student_video_library_screen.dart';
import 'trainer_salaries_screen.dart';
import 'trainer_announcements_screen.dart';

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
    _notifications = SupabaseService().getCachedNotifications();
    _isLoading = _notifications.isEmpty;
    _load();
  }

  Future<void> _load({bool isRefresh = false}) async {
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

  void _handleNotificationClick(Map<String, dynamic> item) {
    final type = (item['type'] ?? 'general').toString().toLowerCase();
    final title = (item['title'] ?? '').toString().toLowerCase();
    final message = (item['message'] ?? '').toString().toLowerCase();

    // 1. Attendance Redirection
    if (type == 'attendance' || title.contains('attendance') || message.contains('attendance')) {
      Navigator.pop(context, {'action': 'switch_tab', 'index': 3});
      return;
    }

    // 2. Classes & Schedule Redirection
    if (type == 'classes' || type == 'schedule' || title.contains('class') || title.contains('schedule') || title.contains('timetable')) {
      Navigator.pop(context, {'action': 'switch_tab', 'index': 1});
      return;
    }

    // 3. Students Redirection
    if (type == 'students' || title.contains('student') || title.contains('disciple')) {
      Navigator.pop(context, {'action': 'switch_tab', 'index': 2});
      return;
    }

    // 4. Announcements / Messages Redirection
    // User requirement: Admin/Reception notices & announcements redirect to Guru Messages page
    final isOwnBroadcast = item['is_my_broadcast'] == true || item['created_by_me'] == true;
    if (isOwnBroadcast) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const TrainerAnnouncementsScreen(isMessagesMode: false)),
      );
      return;
    }
    if (type == 'announcement' ||
        type == 'message' ||
        type == 'broadcast' ||
        type == 'admin_alert' ||
        title.contains('announcement') ||
        title.contains('message') ||
        title.contains('notice') ||
        title.contains('circular') ||
        title.contains('holiday') ||
        title.contains('extra class') ||
        message.contains('announcement') ||
        title.contains('broadcast')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const TrainerAnnouncementsScreen(isMessagesMode: true)),
      );
      return;
    }

    // 5. Video Library Redirection
    if (type == 'video' || type == 'video_shared' || title.contains('video') || message.contains('drive vault') || message.contains('learning video')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const StudentVideoLibraryScreen(isTrainer: true)),
      );
      return;
    }

    // 6. Salaries Redirection
    if (type == 'salary' || type == 'salaries' || title.contains('salary') || message.contains('salary') || message.contains('stipend')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const TrainerSalariesScreen()),
      );
      return;
    }

    // 7. Fallback Detail View
    _showDetail(item);
  }

  void _showDetail(Map<String, dynamic> item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(22, 16, 22, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3E8EE),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.campaign_rounded, color: LaasyaColors.primary, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (item['title']?.toString() ?? 'Academy Notice'),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          (item['date']?.toString() ?? 'Recent'),
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Text(
                  (item['message']?.toString() ?? ''),
                  style: const TextStyle(fontSize: 13.5, height: 1.45, color: Color(0xFF334155)),
                ),
              ),
              Builder(
                builder: (context) {
                  final type = (item['type'] ?? 'general').toString().toLowerCase();
                  final title = (item['title'] ?? '').toString().toLowerCase();
                  final message = (item['message'] ?? '').toString().toLowerCase();

                  if (type == 'attendance' || title.contains('attendance') || message.contains('attendance')) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.fact_check_rounded, size: 18),
                          label: const Text('Go to Attendance Tab', style: TextStyle(fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.pop(context, {'action': 'switch_tab', 'index': 3});
                          },
                        ),
                      ),
                    );
                  } else if (type == 'classes' || type == 'schedule' || title.contains('class') || title.contains('schedule')) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: LaasyaColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.calendar_month_rounded, size: 18),
                          label: const Text('Go to My Classes & Schedule', style: TextStyle(fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.pop(context, {'action': 'switch_tab', 'index': 1});
                          },
                        ),
                      ),
                    );
                  } else if (type == 'students' || title.contains('student') || title.contains('disciple')) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4F46E5),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.groups_rounded, size: 18),
                          label: const Text('Go to Student Management', style: TextStyle(fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.pop(context, {'action': 'switch_tab', 'index': 2});
                          },
                        ),
                      ),
                    );
                  } else if (type == 'announcement' || title.contains('announcement') || type == 'broadcast') {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: LaasyaColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.campaign_rounded, size: 18),
                          label: const Text('Open Message / Notice', style: TextStyle(fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const TrainerAnnouncementsScreen(isMessagesMode: true)));
                          },
                        ),
                      ),
                    );
                  } else if (type == 'message' || title.contains('message') || title.contains('notice') || title.contains('circular')) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: LaasyaColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.mail_rounded, size: 18),
                          label: const Text('Open Messages', style: TextStyle(fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const TrainerAnnouncementsScreen(isMessagesMode: true)));
                          },
                        ),
                      ),
                    );
                  } else if (type == 'video' || type == 'video_shared' || title.contains('video')) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF92400E),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.video_library_rounded, size: 18),
                          label: const Text('Open Learning Video Library', style: TextStyle(fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentVideoLibraryScreen(isTrainer: true)));
                          },
                        ),
                      ),
                    );
                  } else if (type == 'salary' || type == 'salaries' || title.contains('salary')) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0D9488),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.payments_rounded, size: 18),
                          label: const Text('View Salary Records', style: TextStyle(fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const TrainerSalariesScreen()));
                          },
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
    final filtered = _notifications;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        title: const Text('Guru Notices & Updates'),
      ),
      body: RefreshIndicator(
        onRefresh: () => _load(isRefresh: true),
        color: LaasyaColors.primary,
        child: Column(
          children: [
            // Header Card
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF800020), Color(0xFF4A0E17)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF800020).withOpacity(0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.school_rounded, color: Color(0xFFFBBF24), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Faculty Noticeboard',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Official academy updates and administrative notices',
                          style: TextStyle(fontSize: 11.5, color: Colors.white.withOpacity(0.8)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.notifications_off_outlined, size: 48, color: Colors.grey.shade400),
                              const SizedBox(height: 10),
                              const Text('No notices available', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 6, 16, 20),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final item = filtered[index];
                            final isAnnouncement = item['type'] == 'announcement';
                            final accentColor = isAnnouncement ? const Color(0xFFD97706) : LaasyaColors.primary;

                            return InkWell(
                              onTap: () => _handleNotificationClick(item),
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.grey.shade200),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.02),
                                      blurRadius: 6,
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
                                        Container(width: 4, color: accentColor),
                                        Expanded(
                                          child: Padding(
                                            padding: const EdgeInsets.all(14),
                                            child: Row(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.all(10),
                                                  decoration: BoxDecoration(
                                                    color: accentColor.withOpacity(0.12),
                                                    borderRadius: BorderRadius.circular(12),
                                                  ),
                                                  child: Icon(
                                                    isAnnouncement ? Icons.campaign_rounded : Icons.info_outline_rounded,
                                                    color: accentColor,
                                                    size: 22,
                                                  ),
                                                ),
                                                const SizedBox(width: 14),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        (item['title']?.toString() ?? 'Academy Update'),
                                                        style: const TextStyle(
                                                          fontSize: 13.5,
                                                          fontWeight: FontWeight.bold,
                                                          color: LaasyaColors.textDark,
                                                        ),
                                                      ),
                                                      const SizedBox(height: 4),
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
                                                      const SizedBox(height: 6),
                                                      Text(
                                                        (item['date']?.toString() ?? 'Recent'),
                                                        style: TextStyle(fontSize: 10.5, color: Colors.grey.shade500),
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
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

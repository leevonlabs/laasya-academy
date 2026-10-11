import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../trainer/trainer_data_store.dart';
import 'student_dashboard_tab.dart';
import 'student_courses_tab.dart';
import 'student_schedule_tab.dart';
import 'student_attendance_tab.dart';
import 'student_settings_tab.dart';
import 'student_notifications_screen.dart';

class StudentMainScaffold extends StatefulWidget {
  const StudentMainScaffold({super.key});

  @override
  State<StudentMainScaffold> createState() => _StudentMainScaffoldState();
}

class _StudentMainScaffoldState extends State<StudentMainScaffold> {
  int _currentIndex = 0;
  Timer? _alertPollTimer;
  final Set<String> _processedAlertIds = {};
  bool _isPolling = false;

  @override
  void initState() {
    super.initState();
    TrainerDataStore.classClosedAlertNotifier.addListener(_onClassClosedAlert);
    _startNetworkAlertPolling();
  }

  @override
  void dispose() {
    _alertPollTimer?.cancel();
    TrainerDataStore.classClosedAlertNotifier.removeListener(_onClassClosedAlert);
    super.dispose();
  }

  void _startNetworkAlertPolling() {
    _alertPollTimer?.cancel();
    // Poll every 3 seconds for live class conclusion alerts from Gurus
    _alertPollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _pollSessionAlerts());
  }

  Future<void> _pollSessionAlerts() async {
    if (_isPolling || !mounted) return;
    _isPolling = true;
    try {
      final prof = SupabaseService().currentUserProfile;
      final enrolled = prof?['enrolled_courses'];
      String batchIdsParam = 'all';
      if (enrolled is List && enrolled.isNotEmpty) {
        final bIds = enrolled
            .map((e) => e is Map ? e['batch_id']?.toString() : null)
            .where((id) => id != null && id.isNotEmpty)
            .toList();
        if (bIds.isNotEmpty) {
          batchIdsParam = bIds.join(',');
        }
      }

      final uri = Uri.parse('${ApiConstants.baseUrl}/api/sessions/alerts?batchIds=$batchIdsParam&sinceSeconds=60');
      final res = await http.get(uri).timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['alerts'] is List) {
          final alerts = List<Map<String, dynamic>>.from(decoded['alerts']);
          for (var a in alerts) {
            final alertId = a['id']?.toString() ?? '';
            if (alertId.isNotEmpty && !_processedAlertIds.contains(alertId)) {
              _processedAlertIds.add(alertId);
              if (mounted) {
                _showClassClosedAttentionAlarm(a);
              }
              break;
            }
          }
        }
      }
    } catch (_) {
      // Ignore network hiccup
    } finally {
      _isPolling = false;
    }
  }

  void _onClassClosedAlert() {
    final alertData = TrainerDataStore.classClosedAlertNotifier.value;
    if (alertData == null || !mounted) return;

    // Reset notifier value so subsequent alarms trigger properly
    TrainerDataStore.classClosedAlertNotifier.value = null;

    _showClassClosedAttentionAlarm(alertData);
  }

  void _showClassClosedAttentionAlarm(Map<String, dynamic> alertData) {
    final courseTitle = alertData['course_title'] ?? 'Classical Dance';
    final batchName = alertData['batch_name'] ?? 'Class Session';

    int secondsRemaining = 5;
    Timer? ringTimer;

    // Trigger immediate alert sound and haptic vibration
    SystemSound.play(SystemSoundType.alert);
    HapticFeedback.heavyImpact();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            ringTimer ??= Timer.periodic(const Duration(seconds: 1), (timer) {
              SystemSound.play(SystemSoundType.alert);
              HapticFeedback.vibrate();
              if (secondsRemaining > 1) {
                if (ctx.mounted) {
                  setDialogState(() {
                    secondsRemaining--;
                  });
                }
              } else {
                timer.cancel();
                if (ctx.mounted && Navigator.canPop(ctx)) {
                  Navigator.pop(ctx);
                }
              }
            });

            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              elevation: 16,
              child: Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFF7ED), Colors.white],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  border: Border.all(color: const Color(0xFFF97316), width: 2),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Ringing Bell Icon with pulsing effect
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFED7AA),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFF97316).withOpacity(0.35),
                            blurRadius: 16,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.notifications_active_rounded,
                        color: Color(0xFFC2410C),
                        size: 44,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Title
                    const Text(
                      'CLASS COMPLETED!',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF9A3412),
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Countdown Ringing Notice
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEDD5),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFFDBA74)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.ring_volume_rounded, size: 14, color: Color(0xFFC2410C)),
                          const SizedBox(width: 6),
                          Text(
                            'Attention Alarm Ringing: ${secondsRemaining}s',
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF9A3412),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Detailed Message for Parents
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFFED7AA)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'The $courseTitle ($batchName) session has concluded.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.bold,
                              color: LaasyaColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Please come and take your child back from the academy hall safely.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12.5,
                              color: Colors.black87,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Stop Ringing Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          ringTimer?.cancel();
                          if (Navigator.canPop(ctx)) {
                            Navigator.pop(ctx);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFC2410C),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 3,
                        ),
                        icon: const Icon(Icons.volume_off_rounded, size: 20),
                        label: const Text(
                          'Stop Ringing',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ).then((_) {
      ringTimer?.cancel();
    });
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      StudentDashboardTab(
        onNavigateToCourses: () => setState(() => _currentIndex = 1),
        onNavigateToSchedule: () => setState(() => _currentIndex = 2),
        onNavigateToAttendance: () => setState(() => _currentIndex = 3),
      ),
      const StudentCoursesTab(),
      const StudentScheduleTab(),
      const StudentAttendanceTab(),
      const StudentSettingsTab(),
    ];

    final titles = [
      'Student Dashboard',
      'My Enrolled Courses',
      'Class Timetable',
      'Attendance Records',
      'Settings',
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        leadingWidth: 0,
        leading: const SizedBox.shrink(),
        title: Row(
          children: [
            Image.asset(
              'assets/images/header_logo.png',
              height: 38,
              fit: BoxFit.contain,
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: LaasyaColors.accentGold.withOpacity(0.18),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: LaasyaColors.accentGold, width: 1),
              ),
              child: Text(
                titles[_currentIndex],
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Stack(
              children: [
                Icon(Icons.notifications_outlined, color: Colors.white, size: 24),
                Positioned(
                  right: 0,
                  top: 0,
                  child: CircleAvatar(
                    radius: 5,
                    backgroundColor: LaasyaColors.accentGold,
                  ),
                ),
              ],
            ),
            tooltip: 'Academy Notifications',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const StudentNotificationsScreen()),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (idx) => setState(() => _currentIndex = idx),
          type: BottomNavigationBarType.fixed,
          selectedItemColor: LaasyaColors.primary,
          unselectedItemColor: Colors.grey.shade500,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_stories_outlined),
              activeIcon: Icon(Icons.auto_stories_rounded),
              label: 'Courses',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_month_outlined),
              activeIcon: Icon(Icons.calendar_month_rounded),
              label: 'Schedule',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.verified_outlined),
              activeIcon: Icon(Icons.verified_rounded),
              label: 'Attendance',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.settings_outlined),
              activeIcon: Icon(Icons.settings_rounded),
              label: 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}

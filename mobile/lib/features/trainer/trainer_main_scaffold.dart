import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../../core/services/permission_service.dart';
import 'trainer_dashboard_tab.dart';
import 'trainer_classes_tab.dart';
import 'trainer_students_tab.dart';
import 'trainer_attendance_tab.dart';
import 'trainer_settings_tab.dart';
import 'trainer_notifications_screen.dart';
import 'trainer_announcements_screen.dart';
import '../../core/services/alarm_service.dart';
import '../../core/services/push_notification_service.dart';

class TrainerMainScaffold extends StatefulWidget {
  const TrainerMainScaffold({super.key});

  @override
  State<TrainerMainScaffold> createState() => _TrainerMainScaffoldState();
}

class _TrainerMainScaffoldState extends State<TrainerMainScaffold> {
  int _currentIndex = 0;
  Timer? _alertPollTimer;
  static final Set<String> _globalProcessedAlertIds = {};
  bool _isFirstPoll = true;
  bool _isPolling = false;

  @override
  void initState() {
    super.initState();
    _startNetworkAlertPolling();
    _checkInitialNotificationRoute();
    AlarmService.setNotificationOpenedHandler(_handleNotificationOpened);
    PushNotificationService.setNotificationOpenedHandler(_handleNotificationOpened);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        PermissionService.promptRequiredPermissions(context, role: 'trainer');
        final prof = SupabaseService().currentUserProfile;
        final tId = (prof?['id'] ?? prof?['profile_id'])?.toString();
        PushNotificationService.registerDeviceToken(
          role: 'trainer',
          userId: tId,
        );
      }
    });
  }

  @override
  void dispose() {
    _alertPollTimer?.cancel();
    super.dispose();
  }

  void _startNetworkAlertPolling() {
    _alertPollTimer?.cancel();
    // Poll every 3 seconds for live circulars and administrative alerts
    _alertPollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _pollSessionAlerts());
  }

  Future<void> _pollSessionAlerts() async {
    if (_isPolling || !mounted) return;
    _isPolling = true;
    try {
      final prof = SupabaseService().currentUserProfile;
      final trainerId = (prof?['id'] ?? prof?['profile_id'] ?? '').toString();
      final trainerName = (prof?['full_name'] ?? 'Guru').toString();
      final phone = (prof?['phone'] ?? '').toString();

      final idEnc = Uri.encodeComponent(trainerId);
      final nameEnc = Uri.encodeComponent(trainerName);
      final phoneEnc = Uri.encodeComponent(phone);

      final uri = Uri.parse(
        '${ApiConstants.baseUrl}/api/sessions/alerts?batchIds=all&studentId=$idEnc&rollNumber=$idEnc&name=$nameEnc&phone=$phoneEnc&role=trainer&sinceSeconds=1800'
      );
      final res = await http.get(uri).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['alerts'] is List) {
          final alerts = List<Map<String, dynamic>>.from(decoded['alerts']);

          if (_isFirstPoll) {
            _isFirstPoll = false;
            final nowMs = DateTime.now().millisecondsSinceEpoch;
            for (var a in alerts) {
              final alertId = a['id']?.toString() ?? '';
              final createdAtMs = int.tryParse(a['created_at_ms']?.toString() ?? '') ?? 0;
              final isRecent = createdAtMs > 0 && (nowMs - createdAtMs).abs() < 180000;
              if (alertId.isNotEmpty && !isRecent) {
                _globalProcessedAlertIds.add(alertId);
                AlarmService.markAlertProcessed(alertId);
              }
            }
          }

          final List<Map<String, dynamic>> freshAlerts = [];
          for (var a in alerts) {
            final id = a['id']?.toString() ?? '';
            if (id.isEmpty) continue;
            if (_globalProcessedAlertIds.contains(id)) continue;

            final isProcessedInService = await AlarmService.isAlertProcessed(id);
            if (isProcessedInService) {
              _globalProcessedAlertIds.add(id);
              continue;
            }

            _globalProcessedAlertIds.add(id);
            AlarmService.markAlertProcessed(id);
            freshAlerts.add(a);
          }

          if (freshAlerts.isNotEmpty && mounted) {
            for (var alert in freshAlerts) {
              _showTrainerNoticeSnackBar(alert);
            }
          }
        }
      }
    } catch (_) {
    } finally {
      _isPolling = false;
    }
  }

  void _showTrainerNoticeSnackBar(Map<String, dynamic> alert) {
    SystemSound.play(SystemSoundType.alert);
    HapticFeedback.mediumImpact();

    final title = alert['course_title'] ?? alert['title'] ?? 'Academy Notice';
    final msg = alert['message'] ?? 'New administrative circular posted.';

    AlarmService.showNoticeNotification(title: title, message: msg);

    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: LaasyaColors.primaryDark,
        duration: const Duration(seconds: 6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: LaasyaColors.accentGold, width: 1.5),
        ),
        content: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: LaasyaColors.accentGold.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.campaign_rounded, color: LaasyaColors.accentGold, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    msg,
                    style: const TextStyle(fontSize: 11, color: Colors.white70),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        action: SnackBarAction(
          label: 'VIEW',
          textColor: LaasyaColors.accentGold,
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const TrainerAnnouncementsScreen()),
            );
          },
        ),
      ),
    );
  }

  void _handleNotificationOpened(Map<String, dynamic> data) {
    if (!mounted) return;
    final route = data['route']?.toString().toLowerCase();
    if (route == 'messages' || route == 'announcements') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const TrainerAnnouncementsScreen()),
      );
    } else if (route == 'attendance') {
      setState(() => _currentIndex = 3);
    }
  }

  Future<void> _checkInitialNotificationRoute() async {
    try {
      final data = await AlarmService.getPendingNotificationRoute();
      if (data != null && mounted) {
        _handleNotificationOpened(data);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      TrainerDashboardTab(
        onNavigateToClasses: () => setState(() => _currentIndex = 1),
        onNavigateToStudents: () => setState(() => _currentIndex = 2),
        onNavigateToAttendance: () => setState(() => _currentIndex = 3),
      ),
      const TrainerClassesTab(),
      const TrainerStudentsTab(),
      const TrainerAttendanceTab(),
      const TrainerSettingsTab(),
    ];

    final titles = [
      'Guru Dashboard',
      'My Classes & Schedule',
      'Student Management',
      'Attendance Management',
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
            icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 24),
            tooltip: 'Guru Notices',
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TrainerNotificationsScreen()),
              );
              if (result is Map && mounted) {
                if (result['action'] == 'switch_tab' && result['index'] is int) {
                  setState(() => _currentIndex = result['index']);
                }
              }
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
              icon: Icon(Icons.calendar_month_outlined),
              activeIcon: Icon(Icons.calendar_month_rounded),
              label: 'Classes',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.groups_outlined),
              activeIcon: Icon(Icons.groups_rounded),
              label: 'Students',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.fact_check_outlined),
              activeIcon: Icon(Icons.fact_check_rounded),
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

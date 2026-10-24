import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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
import '../../core/services/notification_service.dart';
import '../../core/services/fcm_service.dart';

class TrainerMainScaffold extends StatefulWidget {
  const TrainerMainScaffold({super.key});

  @override
  State<TrainerMainScaffold> createState() => _TrainerMainScaffoldState();
}

class _TrainerMainScaffoldState extends State<TrainerMainScaffold> {
  int _currentIndex = 0;
  Timer? _alertPollTimer;
  RealtimeChannel? _realtimeChannel;
  static final Set<String> _globalProcessedAlertIds = {};
  bool _isFirstPoll = true;
  bool _isPolling = false;

  @override
  void initState() {
    super.initState();
    _startBackgroundAlertService();
    _subscribeSupabaseRealtime();
    _startNetworkAlertPolling();
    _checkInitialNotificationRoute();
    AlarmService.setNotificationOpenedHandler(_handleNotificationOpened);
    NotificationService.setNotificationOpenedHandler(_handleNotificationOpened);
    FcmService.onNotificationTapped = _handleNotificationOpened;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        PermissionService.promptRequiredPermissions(context, role: 'trainer');
      }
    });
  }

  Future<void> _startBackgroundAlertService() async {
    try {
      final prof = SupabaseService().currentUserProfile;
      final trainerId = (prof?['id'] ?? prof?['profile_id'] ?? '').toString();
      final trainerName = (prof?['full_name'] ?? 'Guru').toString();
      final phone = (prof?['phone'] ?? '').toString();

      await AlarmService.startBackgroundAlertService(
        role: 'trainer',
        studentId: trainerId,
        rollNumber: trainerId,
        name: trainerName,
        phone: phone,
        batchIds: 'all',
      );

      final trainerBatches = SupabaseService().trainerBatches;
      final batchIds = trainerBatches
          .map((b) => (b['id'] ?? '').toString())
          .where((id) => id.isNotEmpty)
          .toList();
      FcmService.registerDeviceToken(
        userId: trainerId,
        role: 'trainer',
        batchIds: batchIds,
      );
    } catch (_) {}
  }

  void _subscribeSupabaseRealtime() {
    try {
      _realtimeChannel?.unsubscribe();
      _realtimeChannel = SupabaseService().client
          .channel('public:trainer_session_alerts_feed')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'session_alerts',
            callback: (payload) {
              final newRecord = payload.newRecord;
              if (newRecord.isNotEmpty && mounted) {
                _processIncomingRealtimeAlert(Map<String, dynamic>.from(newRecord));
              }
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('Trainer Realtime subscription notice: $e');
    }
  }

  void _processIncomingRealtimeAlert(Map<String, dynamic> alert) {
    final alertType = (alert['alert_type'] ?? '').toString();
    // Gurus ONLY receive admin announcements and circular notices
    // NEVER receive student pickup alarm, NEVER receive student class completed alerts, NEVER play any 10-second ring alert!
    if (alertType == 'message' ||
        alertType == 'announcement' ||
        alertType == 'admin_alert' ||
        alertType == 'holiday_alert' ||
        alertType == 'tally_class' ||
        alertType == 'session_cancellation' ||
        alertType == 'video_shared') {
      final id = alert['id']?.toString() ?? '';
      if (id.isNotEmpty && _globalProcessedAlertIds.contains(id)) return;
      if (id.isNotEmpty) {
        _globalProcessedAlertIds.add(id);
        AlarmService.markAlertProcessed(id);
      }
      _showTrainerNoticeSnackBar(alert);
    }
  }

  @override
  void dispose() {
    _realtimeChannel?.unsubscribe();
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
            // On startup, mark all existing past notices as already processed
            // so we NEVER trigger popup alerts simply by opening the app!
            for (var a in alerts) {
              final alertId = a['id']?.toString() ?? '';
              if (alertId.isNotEmpty) {
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

            // User requirement: If alert was sent by the Guru themselves, do not pop up self-notification
            final senderRole = (a['sender_role'] ?? '').toString().toLowerCase();
            final aTrainerId = (a['trainer_id'] ?? '').toString().trim();
            final aTrainerName = (a['trainer_name'] ?? a['created_by'] ?? '').toString().toLowerCase().trim();
            final isSelfSent = (aTrainerId.isNotEmpty && aTrainerId == trainerId) ||
                (senderRole.contains('trainer') && aTrainerName.isNotEmpty && trainerName.toLowerCase().contains(aTrainerName));
            if (isSelfSent) continue;

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

    final title = (alert['course_title'] ?? alert['title'] ?? 'Academy Notice').toString();
    final msg = (alert['message'] ?? 'New administrative circular posted.').toString();
    final alertType = (alert['alert_type'] ?? alert['type'] ?? alert['type_tag'] ?? '').toString().toLowerCase();
    final senderRole = (alert['sender_role'] ?? '').toString().toLowerCase();
    final titleLower = title.toLowerCase();
    final isAnnouncement = alertType == 'announcement' ||
        alertType == 'broadcast' ||
        titleLower.contains('announcement') ||
        titleLower.contains('broadcast') ||
        senderRole.contains('trainer') ||
        senderRole.contains('guru');

    AlarmService.showNoticeNotification(
      title: title,
      message: msg,
      route: isAnnouncement ? '/announcements' : '/messages',
    );

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
          label: isAnnouncement ? 'VIEW ANNOUNCEMENT' : 'VIEW MESSAGE',
          textColor: LaasyaColors.accentGold,
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => TrainerAnnouncementsScreen(isMessagesMode: !isAnnouncement),
              ),
            );
          },
        ),
      ),
    );
  }

  void _handleNotificationOpened(Map<String, dynamic> data) {
    if (!mounted) return;
    final rawRoute = data['route']?.toString().toLowerCase() ?? '';
    final cleanRoute = rawRoute.replaceAll('/', '').trim();
    final type = (data['alert_type'] ?? data['type'] ?? '').toString().toLowerCase();
    final title = (data['title'] ?? data['course_title'] ?? '').toString().toLowerCase();

    // When an Admin sends an announcement, circular, holiday alert, tally class, video, or message,
    // Gurus view it in their INBOX: TrainerAnnouncementsScreen(isMessagesMode: true)
    if (cleanRoute == 'announcements' ||
        cleanRoute == 'messages' ||
        type == 'announcement' ||
        type == 'message' ||
        type == 'holiday_alert' ||
        type == 'tally_class' ||
        type == 'session_cancellation' ||
        type == 'video_shared' ||
        type == 'admin_alert' ||
        type == 'broadcast' ||
        title.contains('announcement') ||
        title.contains('notice') ||
        title.contains('holiday') ||
        title.contains('class cancelled') ||
        title.contains('rescheduled')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const TrainerAnnouncementsScreen(isMessagesMode: true)),
      );
    } else if (cleanRoute == 'attendance') {
      setState(() => _currentIndex = 3);
    }
  }

  Future<void> _checkInitialNotificationRoute() async {
    try {
      if (FcmService.pendingNotificationData != null) {
        final data = FcmService.pendingNotificationData!;
        FcmService.pendingNotificationData = null;
        if (mounted) {
          _handleNotificationOpened(data);
          return;
        }
      }
      final data = await NotificationService.getPendingNotificationPayload();
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
          Builder(
            builder: (context) {
              final unreadMsg = SupabaseService().getUnreadMessagesCount();
              final unreadVid = SupabaseService().getUnreadVideosCount();
              final totalUnread = unreadMsg + unreadVid;
              return IconButton(
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.notifications_outlined, color: Colors.white, size: 24),
                    if (totalUnread > 0)
                      Positioned(
                        right: -4,
                        top: -3,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE53E3E),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.white, width: 1.2),
                          ),
                          constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                          child: Text(
                            totalUnread > 99 ? '99+' : '$totalUnread',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              height: 1,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
                tooltip: 'Guru Notices',
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const TrainerNotificationsScreen()),
                  );
                  if (mounted) setState(() {});
                  if (result is Map && mounted) {
                    if (result['action'] == 'switch_tab' && result['index'] is int) {
                      setState(() => _currentIndex = result['index']);
                    }
                  }
                },
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

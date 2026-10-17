import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/services/supabase_service.dart';
import '../../core/services/alarm_service.dart';
import '../../core/services/permission_service.dart';
import '../trainer/trainer_data_store.dart';
import 'student_dashboard_tab.dart';
import 'student_courses_tab.dart';
import 'student_schedule_tab.dart';
import 'student_attendance_tab.dart';
import 'student_settings_tab.dart';
import 'student_notifications_screen.dart';
import 'student_messages_screen.dart';

class StudentMainScaffold extends StatefulWidget {
  const StudentMainScaffold({super.key});

  @override
  State<StudentMainScaffold> createState() => _StudentMainScaffoldState();
}

class _StudentMainScaffoldState extends State<StudentMainScaffold> {
  int _currentIndex = 0;
  Timer? _alertPollTimer;
  RealtimeChannel? _realtimeChannel;
  // Global static set to ensure alerts are NEVER triggered repeatedly across rebuilds/polls
  static final Set<String> _globalProcessedAlertIds = {};
  bool _isFirstPoll = true;
  bool _isPolling = false;

  @override
  void initState() {
    super.initState();
    _startBackgroundAlertService();
    _subscribeSupabaseRealtime();
    TrainerDataStore.classClosedAlertNotifier.addListener(_onClassClosedAlert);
    _startNetworkAlertPolling();
    _checkInitialNotificationRoute();
    AlarmService.setNotificationOpenedHandler(_handleNotificationOpened);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        PermissionService.promptRequiredPermissions(context, role: 'student');
      }
    });
  }

  void _handleNotificationOpened(Map<String, dynamic> data) {
    if (!mounted) return;
    final route = data['route']?.toString().toLowerCase();
    if (route == 'messages' || route == '/messages' || route == 'announcements') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const StudentMessagesScreen()),
      );
    } else if (route == 'attendance' || route == '/attendance' || route == 'alarm') {
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

  Future<void> _startBackgroundAlertService() async {
    try {
      final prof = SupabaseService().currentUserProfile;
      final enrolled = prof?['enrolled_courses'];
      final studentId = (prof?['id'] ?? prof?['profile_id'] ?? '').toString();
      final rollNumber = (prof?['roll_number'] ?? '').toString();
      final studentName = (prof?['full_name'] ?? '').toString();
      final phone = (prof?['phone'] ?? '').toString();

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

      await AlarmService.startBackgroundAlertService(
        role: 'student',
        studentId: studentId,
        rollNumber: rollNumber,
        name: studentName,
        phone: phone,
        batchIds: batchIdsParam,
      );
    } catch (_) {}
  }

  @override
  void dispose() {
    _realtimeChannel?.unsubscribe();
    _alertPollTimer?.cancel();
    AlarmService.stopAlarmRing();
    TrainerDataStore.classClosedAlertNotifier.removeListener(_onClassClosedAlert);
    super.dispose();
  }

  void _subscribeSupabaseRealtime() {
    try {
      _realtimeChannel?.unsubscribe();
      _realtimeChannel = SupabaseService().client
          .channel('public:student_session_alerts_feed')
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
      debugPrint('Student Realtime subscription notice: $e');
    }
  }

  void _processIncomingRealtimeAlert(Map<String, dynamic> alert) {
    final id = alert['id']?.toString() ?? '';
    if (id.isNotEmpty && _globalProcessedAlertIds.contains(id)) return;

    final alertType = alert['alert_type']?.toString() ?? 'class_closed';

    if (alertType == 'class_closed') {
      final batchId = (alert['batch_id']?.toString() ?? '').toLowerCase();
      final prof = SupabaseService().currentUserProfile;
      final enrolled = prof?['enrolled_courses'];
      List<String> studentBatchIds = [];
      if (enrolled is List) {
        for (var e in enrolled) {
          if (e is Map && e['batch_id'] != null) {
            studentBatchIds.add(e['batch_id'].toString().toLowerCase());
          }
        }
      }
      final matchesBatch = batchId == 'all' || studentBatchIds.isEmpty || studentBatchIds.contains(batchId);
      if (!matchesBatch) return;

      if (id.isNotEmpty) {
        _globalProcessedAlertIds.add(id);
        AlarmService.markAlertProcessed(id);
      }

      final courseTitle = alert['course_title'] ?? 'Class Session';
      final batchName = alert['batch_name'] ?? 'Batch';
      final alertMsg = alert['message'] ?? 'The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely.';
      AlarmService.showClassCompletedNotification(
        courseTitle: courseTitle,
        batchName: batchName,
        message: alertMsg,
      );
      _showClassClosedBannerNotification(alert);
    } else if (alertType == 'attendance_marked') {
      final prof = SupabaseService().currentUserProfile;
      final myId = (prof?['id'] ?? prof?['profile_id'] ?? '').toString().toLowerCase();
      final myRoll = (prof?['roll_number'] ?? '').toString().toLowerCase();
      final myName = (prof?['full_name'] ?? '').toString().toLowerCase();
      final targetId = (alert['target_student_id'] ?? '').toString().toLowerCase();
      final targetRoll = (alert['target_roll_number'] ?? '').toString().toLowerCase();
      final targetName = (alert['target_student_name'] ?? '').toString().toLowerCase();

      final matchesMe = (myId.isNotEmpty && targetId == myId) || 
                        (myRoll.isNotEmpty && targetRoll == myRoll) ||
                        (myName.isNotEmpty && targetName.contains(myName));
      if (!matchesMe) return;

      if (id.isNotEmpty) {
        _globalProcessedAlertIds.add(id);
        AlarmService.markAlertProcessed(id);
      }

      SupabaseService().refreshNotifications();
      SupabaseService().notifyAttendanceUpdated();
      _showAttendanceStatusNotification(alert);
    } else if (alertType == 'message' || alertType == 'announcement') {
      if (id.isNotEmpty) {
        _globalProcessedAlertIds.add(id);
        AlarmService.markAlertProcessed(id);
      }
      SupabaseService().refreshNotifications();
      _showMessageNotification(alert);
    }
  }

  void _startNetworkAlertPolling() {
    _alertPollTimer?.cancel();
    // Poll every 3 seconds for live class conclusion & attendance status alerts
    _alertPollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _pollSessionAlerts());
  }

  Future<void> _pollSessionAlerts() async {
    if (_isPolling || !mounted) return;
    _isPolling = true;
    try {
      final prof = SupabaseService().currentUserProfile;
      if (prof?['role'] != 'student') return;
      final enrolled = prof?['enrolled_courses'];
      final studentId = (prof?['id'] ?? prof?['profile_id'] ?? '').toString();
      final rollNumber = (prof?['roll_number'] ?? '').toString();
      final studentName = (prof?['full_name'] ?? '').toString();
      final phone = (prof?['phone'] ?? '').toString();

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

      final sIdEnc = Uri.encodeComponent(studentId);
      final rollEnc = Uri.encodeComponent(rollNumber);
      final nameEnc = Uri.encodeComponent(studentName);
      final phoneEnc = Uri.encodeComponent(phone);

      final uri = Uri.parse(
        '${ApiConstants.baseUrl}/api/sessions/alerts?batchIds=$batchIdsParam&studentId=$sIdEnc&rollNumber=$rollEnc&name=$nameEnc&phone=$phoneEnc&sinceSeconds=1800'
      );
      final res = await http.get(uri).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['alerts'] is List) {
          final alerts = List<Map<String, dynamic>>.from(decoded['alerts']);

          if (_isFirstPoll) {
            _isFirstPoll = false;
            final nowMs = DateTime.now().millisecondsSinceEpoch;
            // On startup, mark only truly stale alerts (older than 30 minutes) as processed,
            // so recent alerts (e.g. within 30 mins) still notify if missed while closed!
            for (var a in alerts) {
              final alertId = a['id']?.toString() ?? '';
              final createdAtMs = int.tryParse(a['created_at_ms']?.toString() ?? '') ?? 0;
              final isVeryOld = createdAtMs > 0 && (nowMs - createdAtMs) > 1800000;
              if (alertId.isNotEmpty && isVeryOld) {
                _globalProcessedAlertIds.add(alertId);
                AlarmService.markAlertProcessed(alertId);
              }
            }
          }

          // Filter strictly fresh alerts not yet handled by Flutter or background service
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
            // Find if there is any class closed alert
            final classClosedAlert = freshAlerts.cast<Map<String, dynamic>?>().firstWhere(
              (a) => a?['alert_type'] == 'class_closed',
              orElse: () => null,
            );
            // Find if there is any attendance marked alert
            final attendanceAlert = freshAlerts.cast<Map<String, dynamic>?>().firstWhere(
              (a) => a?['alert_type'] == 'attendance_marked',
              orElse: () => null,
            );

            // Find if there is any message announcement alert
            final messageAlert = freshAlerts.cast<Map<String, dynamic>?>().firstWhere(
              (a) => a?['alert_type'] == 'message' || a?['alert_type'] == 'announcement',
              orElse: () => null,
            );

            if (attendanceAlert != null) {
              SupabaseService().refreshNotifications();
              SupabaseService().notifyAttendanceUpdated();
              _showAttendanceStatusNotification(attendanceAlert);
            }

            if (messageAlert != null) {
              SupabaseService().refreshNotifications();
              _showMessageNotification(messageAlert);
            }

            if (classClosedAlert != null) {
              final courseTitle = classClosedAlert['course_title'] ?? 'Class Session';
              final batchName = classClosedAlert['batch_name'] ?? 'Batch';
              final alertMsg = classClosedAlert['message'] ?? 'The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely.';
              AlarmService.showClassCompletedNotification(
                courseTitle: courseTitle,
                batchName: batchName,
                message: alertMsg,
              );
              _showClassClosedBannerNotification(classClosedAlert);
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

  void _showAttendanceStatusNotification(Map<String, dynamic> alertData) {
    final status = (alertData['student_status'] ?? 'present').toString().toUpperCase();
    final isPresent = status == 'PRESENT';
    final courseTitle = alertData['course_title'] ?? 'Class Session';
    final batchName = alertData['batch_name'] ?? 'Batch';
    final trainerName = alertData['trainer_name'] ?? 'Guru';

    // 1. Fire native Android System Notification (appears in notification bar even when user is outside app)
    AlarmService.showAttendanceNotification(
      title: isPresent ? 'Attendance Confirmed: PRESENT' : 'Attendance Alert: ABSENT',
      message: '$courseTitle • $batchName (Recorded by Guru $trainerName)',
      isPresent: isPresent,
    );

    // 2. Audible chime & haptic feedback
    SystemSound.play(SystemSoundType.alert);
    HapticFeedback.heavyImpact();

    // 3. Clear any existing snackbars to prevent queue pile-up
    ScaffoldMessenger.of(context).clearSnackBars();

    // 4. Floating in-app luxury arts notification card
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        elevation: 12,
        backgroundColor: Colors.transparent,
        padding: EdgeInsets.zero,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        duration: const Duration(seconds: 5),
        content: GestureDetector(
          onTap: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
            setState(() => _currentIndex = 3);
          },
          child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isPresent
                  ? [const Color(0xFF064E3B), const Color(0xFF022C22)] // Deep Emerald
                  : [const Color(0xFF7F1D1D), const Color(0xFF450A0A)], // Deep Crimson
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isPresent ? const Color(0xFF34D399) : const Color(0xFFF87171),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: (isPresent ? const Color(0xFF10B981) : const Color(0xFFEF4444)).withOpacity(0.35),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isPresent ? const Color(0xFF6EE7B7) : const Color(0xFFFCA5A5),
                    width: 1.5,
                  ),
                ),
                child: Icon(
                  isPresent ? Icons.verified_rounded : Icons.warning_amber_rounded,
                  color: isPresent ? const Color(0xFF6EE7B7) : const Color(0xFFFCA5A5),
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'ATTENDANCE ${isPresent ? 'PRESENT' : 'ABSENT'}',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.6,
                            color: isPresent ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'LIVE',
                            style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '$courseTitle • $batchName',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Recorded by Guru $trainerName',
                      style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.75)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  }

  void _showMessageNotification(Map<String, dynamic> alertData) {
    final title = (alertData['course_title'] ?? 'Academy Notice').toString();
    final msg = (alertData['message'] ?? 'New circular announcement received.').toString();

    // 1. Fire native Android System Notification
    AlarmService.showNoticeNotification(
      title: title,
      message: msg,
    );

    // 2. Sound & Haptic
    SystemSound.play(SystemSoundType.alert);
    HapticFeedback.lightImpact();

    // 3. Floating notice card
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        elevation: 10,
        backgroundColor: Colors.transparent,
        padding: EdgeInsets.zero,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        duration: const Duration(seconds: 5),
        content: GestureDetector(
          onTap: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const StudentMessagesScreen()),
            );
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF800020), Color(0xFF4A0E17)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFFBBF24), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF800020).withOpacity(0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFFBBF24), width: 1.5),
                  ),
                  child: const Icon(Icons.campaign_rounded, color: Color(0xFFFBBF24), size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        msg,
                        style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.85), height: 1.3),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _onClassClosedAlert() {
    final prof = SupabaseService().currentUserProfile;
    if (prof?['role'] != 'student') return;
    final alertData = TrainerDataStore.classClosedAlertNotifier.value;
    if (alertData == null || !mounted) return;

    // Reset notifier value so subsequent notifications trigger properly
    TrainerDataStore.classClosedAlertNotifier.value = null;

    final courseTitle = alertData['course_title'] ?? 'Class Session';
    final batchName = alertData['batch_name'] ?? 'Batch';
    final alertMsg = alertData['message'] ?? 'The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely.';
    AlarmService.showClassCompletedNotification(
      courseTitle: courseTitle,
      batchName: batchName,
      message: alertMsg,
    );
    _showClassClosedBannerNotification(alertData);
  }

  void _showClassClosedBannerNotification(Map<String, dynamic> alertData) {
    final courseTitle = alertData['course_title'] ?? 'Class Session';
    final batchName = alertData['batch_name'] ?? 'Batch';

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        elevation: 12,
        backgroundColor: Colors.transparent,
        padding: EdgeInsets.zero,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        duration: const Duration(seconds: 8),
        content: GestureDetector(
          onTap: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
            setState(() => _currentIndex = 3);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF7C2D12), Color(0xFF431407)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFFB923C), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFEA580C).withOpacity(0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFFDBA74), width: 1.5),
                  ),
                  child: const Icon(Icons.notifications_active_rounded, color: Color(0xFFFDBA74), size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'CLASS COMPLETED • PICKUP ALERT',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFFFED7AA), letterSpacing: 0.5),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '$courseTitle • $batchName',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Tap to view attendance & sessions',
                        style: TextStyle(fontSize: 11, color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
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
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const StudentNotificationsScreen()),
                  );
                  if (mounted) setState(() {});
                  if (result is Map && mounted) {
                    if (result['action'] == 'switch_tab' && result['index'] is int) {
                      setState(() => _currentIndex = result['index']);
                    } else if (result['action'] == 'alarm') { setState(() => _currentIndex = 3); }
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

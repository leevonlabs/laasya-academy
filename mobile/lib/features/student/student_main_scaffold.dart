import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../../core/services/alarm_service.dart';
import '../../core/services/permission_service.dart';
import '../../core/services/push_notification_service.dart';
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
  // Global static set to ensure alerts are NEVER triggered repeatedly across rebuilds/polls
  static final Set<String> _globalProcessedAlertIds = {};
  bool _isFirstPoll = true;
  bool _isPolling = false;

  @override
  void initState() {
    super.initState();
    _startBackgroundAlertService();
    TrainerDataStore.classClosedAlertNotifier.addListener(_onClassClosedAlert);
    _startNetworkAlertPolling();
    _checkInitialNotificationRoute();
    AlarmService.setNotificationOpenedHandler(_handleNotificationOpened);
    PushNotificationService.setNotificationOpenedHandler(_handleNotificationOpened);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        PermissionService.promptRequiredPermissions(context, role: 'student');
        _registerPushNotifications();
      }
    });
  }

  void _registerPushNotifications() {
    final prof = SupabaseService().currentUserProfile;
    final sId = (prof?['id'] ?? prof?['profile_id'])?.toString();
    List<String> bIds = [];
    if (prof?['enrolled_courses'] is List) {
      bIds = (prof!['enrolled_courses'] as List)
          .map((e) => e is Map ? e['batch_id']?.toString() : null)
          .whereType<String>()
          .toList();
    }
    PushNotificationService.registerDeviceToken(
      role: 'student',
      userId: sId,
      batchIds: bIds,
    );
  }

  void _handleNotificationOpened(Map<String, dynamic> data) {
    if (!mounted) return;
    final route = (data['route'] ?? '').toString().toLowerCase().replaceAll('/', '').trim();
    final alertType = (data['alert_type'] ?? '').toString().toLowerCase();

    debugPrint('Student scaffold handling notification tap: route=$route, alertType=$alertType, data=$data');

    if (route == 'messages' || route == 'announcements' || alertType == 'announcement' || alertType == 'message') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const StudentMessagesScreen()),
      );
    } else if (route == 'attendance' || route == 'alarm' || alertType == 'class_closed' || alertType == 'attendance_marked') {
      setState(() => _currentIndex = 3);
      if (alertType == 'class_closed' || route == 'alarm') {
        _showClassClosedAttentionAlarm(data);
      }
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
    _alertPollTimer?.cancel();
    AlarmService.stopAlarmRing();
    TrainerDataStore.classClosedAlertNotifier.removeListener(_onClassClosedAlert);
    super.dispose();
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
            // On startup, mark historical alerts (older than 3 minutes) as processed,
            // but preserve fresh alerts created recently so they sound when the app opens!
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
              AlarmService.startAlarmRing(
                durationSeconds: 10,
                title: 'CLASS COMPLETED: $courseTitle',
                message: 'The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely.',
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
    AlarmService.showAttendanceNotification(
      title: title,
      message: msg,
      isPresent: true,
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

    // Reset notifier value so subsequent alarms trigger properly
    TrainerDataStore.classClosedAlertNotifier.value = null;

    _showClassClosedAttentionAlarm(alertData);
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
        duration: const Duration(seconds: 10),
        content: GestureDetector(
          onTap: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
            AlarmService.stopAlarmRing();
            _showClassClosedAttentionAlarm(alertData);
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
                        'Tap to view pickup details',
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

  void _showClassClosedAttentionAlarm(Map<String, dynamic> alertData) {
    final prof = SupabaseService().currentUserProfile;
    if (prof?['role'] != 'student') return;
    final courseTitle = alertData['course_title'] ?? 'Classical Dance';
    final batchName = alertData['batch_name'] ?? 'Class Session';

    int secondsRemaining = 10;
    Timer? ringTimer;

    // Trigger Android hardware ALARM stream ringtone, alarm vibration pattern, and heads-up notification
    AlarmService.startAlarmRing(
      durationSeconds: 10,
      title: 'CLASS COMPLETED: $courseTitle',
      message: 'The $courseTitle ($batchName) session has concluded. Please come and take your child back safely.',
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            ringTimer ??= Timer.periodic(const Duration(seconds: 1), (timer) {
              if (secondsRemaining > 1) {
                if (ctx.mounted) {
                  setDialogState(() {
                    secondsRemaining--;
                  });
                }
              } else {
                timer.cancel();
                AlarmService.stopAlarmRing();
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
                          AlarmService.stopAlarmRing();
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
      AlarmService.stopAlarmRing();
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
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const StudentNotificationsScreen()),
              );
              if (result is Map && mounted) {
                if (result['action'] == 'switch_tab' && result['index'] is int) {
                  setState(() => _currentIndex = result['index']);
                } else if (result['action'] == 'alarm' && result['data'] is Map) {
                  _showClassClosedAttentionAlarm(Map<String, dynamic>.from(result['data']));
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

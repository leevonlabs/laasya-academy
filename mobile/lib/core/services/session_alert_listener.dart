import 'dart:async';
import 'dart:convert';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/api_constants.dart';
import 'alarm_service.dart';

/// Real-time and background-resilient listener for Class Completed pickup chimes
/// and live attendance alerts for Students & Parents.
class SessionAlertListener with WidgetsBindingObserver {
  static final SessionAlertListener _instance = SessionAlertListener._internal();
  factory SessionAlertListener() => _instance;
  SessionAlertListener._internal();

  String _studentId = '';
  String _rollNumber = '';
  String _name = '';
  String _phone = '';
  List<String> _batchIds = [];
  bool _isListening = false;

  Timer? _pollTimer;
  RealtimeChannel? _realtimeChannel;

  bool get isListening => _isListening;

  /// Starts listening for class completion and attendance alerts
  Future<void> startListening({
    required String studentId,
    required String rollNumber,
    required String name,
    required String phone,
    required List<String> batchIds,
  }) async {
    _studentId = studentId.trim();
    _rollNumber = rollNumber.trim();
    _name = name.trim();
    _phone = phone.trim();
    _batchIds = batchIds.map((b) => b.trim().toLowerCase()).toList();
    _isListening = true;

    // 1. Request notification permission (Android 13+ & iOS)
    await AlarmService.requestNotificationPermission();

    // 2. Register native background job config for closed-app periodic check
    await AlarmService.startBackgroundAlertService(
      studentId: _studentId,
      rollNumber: _rollNumber,
      name: _name,
      phone: _phone,
      batchIds: _batchIds.join(','),
    );

    // 3. Register lifecycle observer for instant resume polling
    WidgetsBinding.instance.removeObserver(this);
    WidgetsBinding.instance.addObserver(this);

    // 4. Subscribe to Supabase Realtime for sub-second alert broadcast
    _subscribeSupabaseRealtime();

    // 5. High-speed polling fallback every 3 seconds while app is in foreground for realtime alerts
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (_isListening) {
        _pollServerForAlerts();
      }
    });

    // Initial check immediately
    _pollServerForAlerts();
  }

  void _subscribeSupabaseRealtime() {
    try {
      final client = Supabase.instance.client;
      _realtimeChannel?.unsubscribe();

      _realtimeChannel = client.channel('public:session_alerts_feed')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'session_alerts',
            callback: (payload) {
              final newRecord = payload.newRecord;
              if (newRecord.isNotEmpty) {
                _processAlertMap(Map<String, dynamic>.from(newRecord));
              }
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('Supabase realtime subscription notice: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _isListening) {
      // Screen turned on or user switched back to app - check immediately
      _pollServerForAlerts();
    }
  }

  Future<void> _pollServerForAlerts() async {
    if (!_isListening) return;

    try {
      final cleanBatch = _batchIds.isEmpty ? 'all' : _batchIds.join(',');
      final uri = Uri.parse(
        '${ApiConstants.baseUrl}/api/sessions/alerts?batchIds=${Uri.encodeComponent(cleanBatch)}'
        '&studentId=${Uri.encodeComponent(_studentId)}'
        '&rollNumber=${Uri.encodeComponent(_rollNumber)}'
        '&name=${Uri.encodeComponent(_name)}'
        '&phone=${Uri.encodeComponent(_phone)}'
        '&sinceSeconds=180',
      );

      final resp = await http.get(uri).timeout(const Duration(seconds: 4));
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        if (data is Map && data['success'] == true && data['alerts'] is List) {
          final alerts = data['alerts'] as List;
          for (final alert in alerts) {
            if (alert is Map) {
              await _processAlertMap(Map<String, dynamic>.from(alert));
            }
          }
        }
      }
    } catch (_) {}
  }

  Future<void> _processAlertMap(Map<String, dynamic> alert) async {
    final alertId = alert['id']?.toString() ?? '';
    if (alertId.isEmpty) return;

    // Check if already processed
    final alreadyProcessed = await AlarmService.isAlertProcessed(alertId);
    if (alreadyProcessed) return;

    final alertType = alert['alert_type']?.toString() ?? 'class_closed';
    final batchId = (alert['batch_id']?.toString() ?? '').toLowerCase();

    if (alertType == 'class_closed') {
      // Check batch match
      final isMatch = _batchIds.isEmpty || _batchIds.contains(batchId) || batchId == 'all';
      if (!isMatch) return;

      // Mark processed
      await AlarmService.markAlertProcessed(alertId);

      final courseTitle = alert['course_title']?.toString() ?? 'Classical Class';
      final batchName = alert['batch_name']?.toString() ?? 'Session';
      final message = alert['message']?.toString() ??
          'Today\'s class for $courseTitle ($batchName) has concluded. Please come and collect your child.';

      // Normal phone system notification for class completion
      await AlarmService.showClassCompletedNotification(
        courseTitle: courseTitle,
        batchName: batchName,
        message: message,
      );
    } else if (alertType == 'attendance_marked') {
      final targetRoll = (alert['target_roll_number']?.toString() ?? '').toLowerCase();
      final targetId = (alert['target_student_id']?.toString() ?? '').toLowerCase();
      final targetName = (alert['target_student_name']?.toString() ?? '').toLowerCase();

      final targetDigits = targetRoll.replaceAll(RegExp(r'\D'), '');
      final myDigits = _rollNumber.replaceAll(RegExp(r'\D'), '');
      final rollMatches = (_rollNumber.isNotEmpty && (targetRoll == _rollNumber.toLowerCase() || targetRoll.contains(_rollNumber.toLowerCase()) || _rollNumber.toLowerCase().contains(targetRoll))) ||
          (targetDigits.isNotEmpty && myDigits.isNotEmpty && targetDigits == myDigits);

      final nameMatches = _name.isNotEmpty && targetName.isNotEmpty &&
          (targetName.contains(_name.toLowerCase()) || _name.toLowerCase().contains(targetName));

      final idMatches = _studentId.isNotEmpty && targetId == _studentId.toLowerCase();

      final matchesStudent = rollMatches || idMatches || nameMatches;

      if (matchesStudent) {
        await AlarmService.markAlertProcessed(alertId);
        final status = alert['student_status']?.toString().toUpperCase() ?? 'PRESENT';
        final isPresent = status == 'PRESENT';
        final courseTitle = alert['course_title']?.toString() ?? 'Class';
        final batchName = alert['batch_name']?.toString() ?? 'Batch';
        final guru = alert['trainer_name']?.toString() ?? 'Guru';

        await AlarmService.showAttendanceNotification(
          title: 'Attendance Recorded: $status',
          message: '$courseTitle ($batchName) • Marked by Guru $guru',
          isPresent: isPresent,
        );
      }
    }
  }

  /// Stops alert listening (upon student sign out)
  Future<void> stopListening() async {
    _isListening = false;
    _pollTimer?.cancel();
    _pollTimer = null;
    WidgetsBinding.instance.removeObserver(this);

    try {
      _realtimeChannel?.unsubscribe();
      _realtimeChannel = null;
    } catch (_) {}

    await AlarmService.stopBackgroundAlertService();
  }
}

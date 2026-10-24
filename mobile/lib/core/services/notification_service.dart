import 'dart:async';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Unified Clean System Notification Service for Laasya Cultural Academy.
/// Uses standard phone OS notifications with system ringtones and vibration.
/// All legacy alarms, looping audio, and battery nagging have been completely removed.
class NotificationService {
  static const MethodChannel _channel = MethodChannel('com.laasyaacademy.app/notifications');
  static Function(Map<String, dynamic> payload)? _onNotificationOpenedCallback;
  static Map<String, dynamic>? _pendingPayload;
  static bool _isInitialized = false;

  static void initialize() {
    if (_isInitialized) return;
    _isInitialized = true;

    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onNotificationOpened') {
        final data = call.arguments;
        if (data is Map) {
          final payload = Map<String, dynamic>.from(data);
          if (_onNotificationOpenedCallback != null) {
            _onNotificationOpenedCallback!(payload);
          } else {
            _pendingPayload = payload;
          }
        }
      }
    });
  }

  /// Sets a callback for when the user taps a system notification
  static void setNotificationOpenedHandler(Function(Map<String, dynamic> payload) handler) {
    _onNotificationOpenedCallback = handler;
    if (_pendingPayload != null) {
      final p = _pendingPayload!;
      _pendingPayload = null;
      Future.microtask(() => handler(p));
    }
  }

  /// Checks if the app was launched from a notification tap
  static Future<Map<String, dynamic>?> getPendingNotificationPayload() async {
    try {
      final res = await _channel.invokeMethod('getPendingNotificationRoute');
      if (res is Map) {
        return Map<String, dynamic>.from(res);
      }
    } catch (_) {}
    return null;
  }

  /// Backward-compatible alias
  static Future<String?> getPendingNotificationRoute() async {
    final payload = await getPendingNotificationPayload();
    return payload?['route']?.toString();
  }

  /// Normal phone system notification for class completion (Students only)
  static Future<void> showClassCompletedNotification({
    required String courseTitle,
    required String batchName,
    required String message,
  }) async {
    try {
      await _channel.invokeMethod('showNotification', {
        'id': 2001,
        'title': 'CLASS COMPLETED: $courseTitle',
        'message': message,
        'channelId': 'laasya_classes',
        'route': '/attendance',
      });
    } catch (_) {}
  }

  /// Normal phone system notification for individual attendance status (Students only)
  static Future<void> showAttendanceNotification({
    required String title,
    required String message,
    required bool isPresent,
  }) async {
    try {
      await _channel.invokeMethod('showNotification', {
        'id': 2002,
        'title': title,
        'message': message,
        'channelId': 'laasya_classes',
        'route': '/attendance',
      });
    } catch (_) {}
  }

  /// Normal phone system notification for circulars/announcements (Gurus and Students)
  static Future<void> showAnnouncementNotification({
    required String title,
    required String message,
    String route = '/announcements',
  }) async {
    try {
      await _channel.invokeMethod('showNotification', {
        'id': 2003,
        'title': title,
        'message': message,
        'channelId': 'laasya_announcements',
        'route': route,
      });
    } catch (_) {}
  }

  /// Requests runtime notification permission on Android 13+ (API 33+) and iOS
  static Future<void> requestNotificationPermission() async {
    try {
      await _channel.invokeMethod('requestNotificationPermission');
    } catch (_) {}
  }

  /// Starts the Android native background alert service with the active backend URL
  static Future<void> startBackgroundAlertService({
    String role = 'student',
    required String studentId,
    required String rollNumber,
    required String name,
    required String phone,
    required String batchIds,
    required String baseUrl,
  }) async {
    try {
      await _channel.invokeMethod('startBackgroundAlertService', {
        'role': role,
        'studentId': studentId,
        'rollNumber': rollNumber,
        'name': name,
        'phone': phone,
        'batchIds': batchIds,
        'baseUrl': baseUrl,
      });
    } catch (_) {}
  }

  /// Stops the background service
  static Future<void> stopBackgroundAlertService() async {
    try {
      await _channel.invokeMethod('stopBackgroundAlertService');
    } catch (_) {}
  }

  /// Checks if an alert was already processed
  static Future<bool> isAlertProcessed(String alertId) async {
    if (alertId.isEmpty) return false;
    try {
      final prefs = await SharedPreferences.getInstance();
      return (prefs.getBool('laasya_alert_seen_$alertId') ?? false) ||
             (prefs.getBool('laasya_notif_seen_$alertId') ?? false);
    } catch (_) {
      return false;
    }
  }

  /// Marks an alert as processed in SharedPreferences to prevent duplicate triggers
  static Future<void> markAlertProcessed(String alertId) async {
    if (alertId.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('laasya_alert_seen_$alertId', true);
      await prefs.setBool('laasya_notif_seen_$alertId', true);
    } catch (_) {}
  }
}

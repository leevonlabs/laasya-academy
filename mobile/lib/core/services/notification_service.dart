import 'dart:async';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  static const MethodChannel _channel = MethodChannel('com.laasyaacademy.app/notifications');
  static Function(String route)? _onNotificationOpenedCallback;
  static bool _isInitialized = false;

  static void initialize() {
    if (_isInitialized) return;
    _isInitialized = true;

    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onNotificationOpened') {
        final data = call.arguments;
        if (data is Map) {
          final route = data['route']?.toString() ?? '';
          if (route.isNotEmpty && _onNotificationOpenedCallback != null) {
            _onNotificationOpenedCallback!(route);
          }
        }
      }
    });
  }

  static void setNotificationTapHandler(Function(String route) handler) {
    _onNotificationOpenedCallback = handler;
  }

  static Future<String?> getPendingNotificationRoute() async {
    try {
      final res = await _channel.invokeMethod('getPendingNotificationRoute');
      if (res is Map) {
        return res['route']?.toString();
      }
    } catch (_) {}
    return null;
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

  /// Normal phone system notification for individual attendance status (Student only)
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
  }) async {
    try {
      await _channel.invokeMethod('showNotification', {
        'id': 2003,
        'title': title,
        'message': message,
        'channelId': 'laasya_announcements',
        'route': '/messages',
      });
    } catch (_) {}
  }

  static Future<bool> isAlertProcessed(String alertId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('laasya_notif_seen_$alertId') ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<void> markAlertProcessed(String alertId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('laasya_notif_seen_$alertId', true);
    } catch (_) {}
  }
}

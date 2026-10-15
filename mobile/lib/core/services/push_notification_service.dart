import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import 'supabase_service.dart';
import 'alarm_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  debugPrint('FCM background message received: ${message.messageId} | ${message.data}');
}

class PushNotificationService {
  static bool _initialized = false;
  static Function(Map<String, dynamic>)? onNotificationOpenedCallback;

  static Future<void> initialize() async {
    if (_initialized) return;
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // Handle foreground push messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        _handleForegroundMessage(message);
      });

      // Handle when user taps notification while app was backgrounded
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleNotificationTapped(message.data);
      });

      // Handle when user taps notification from fully closed (terminated) state
      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTapped(initialMessage.data);
      }

      _initialized = true;
      debugPrint('PushNotificationService initialized successfully.');
    } catch (e) {
      debugPrint('Failed to initialize Firebase Messaging: $e');
    }
  }

  static Map<String, dynamic>? _pendingNotificationData;

  static void setNotificationOpenedHandler(Function(Map<String, dynamic>) handler) {
    onNotificationOpenedCallback = handler;
    if (_pendingNotificationData != null) {
      final pending = _pendingNotificationData!;
      _pendingNotificationData = null;
      Future.delayed(const Duration(milliseconds: 350), () => handler(pending));
    }
    FirebaseMessaging.instance.getInitialMessage().then((msg) {
      if (msg != null && msg.data.isNotEmpty) {
        Future.delayed(const Duration(milliseconds: 350), () => handler(msg.data));
      }
    });
  }

  static void _handleNotificationTapped(Map<String, dynamic> data) {
    debugPrint('Push notification tapped with data: $data');
    if (onNotificationOpenedCallback != null) {
      onNotificationOpenedCallback!(data);
    } else {
      _pendingNotificationData = data;
    }
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final data = message.data;
    final alertType = (data['alert_type'] ?? '').toString();
    final prof = SupabaseService().currentUserProfile;
    final userRole = (prof?['role'] ?? '').toString().toLowerCase();

    debugPrint('Foreground FCM received: role=$userRole alertType=$alertType data=$data');

    // STRICT ROLE SEPARATION:
    if (userRole == 'student') {
      if (alertType == 'class_closed') {
        final courseTitle = data['course_title'] ?? message.notification?.title ?? 'Class Session';
        final batchName = data['batch_name'] ?? 'Batch';
        final alertMsg = data['message'] ?? message.notification?.body ?? 'The $courseTitle ($batchName) session has concluded. Please collect your child.';
        // Trigger high-priority vocal pickup chime and alarm stream
        AlarmService.startAlarmRing(
          durationSeconds: 10,
          title: 'CLASS COMPLETED: $courseTitle',
          message: alertMsg,
        );
      } else if (alertType == 'attendance_marked') {
        final status = (data['student_status'] ?? 'present').toString().toUpperCase();
        AlarmService.showAttendanceNotification(
          title: 'Attendance Confirmed: $status',
          message: data['message'] ?? 'Recorded by Guru',
          isPresent: status == 'PRESENT',
        );
      } else if (alertType == 'announcement' || alertType == 'message') {
        final title = data['title'] ?? data['course_title'] ?? message.notification?.title ?? 'Academy Notice';
        final msg = data['message'] ?? message.notification?.body ?? 'New announcement posted.';
        AlarmService.showNoticeNotification(title: title, message: msg);
      }
    } else if (userRole == 'trainer') {
      // GURUS NEVER HEAR STUDENT PICKUP RINGTONES OR CLASS-COMPLETED ALARMS:
      if (alertType == 'class_closed') {
        debugPrint('Ignoring class_closed chime on Guru login.');
        return;
      }
      if (alertType == 'announcement' || alertType == 'message') {
        final title = data['title'] ?? data['course_title'] ?? message.notification?.title ?? 'Academy Notice';
        final msg = data['message'] ?? message.notification?.body ?? 'New administrative circular posted.';
        AlarmService.showNoticeNotification(title: title, message: msg);
      }
    }
  }

  static Future<void> registerDeviceToken({
    required String role,
    required String? userId,
    List<String>? batchIds,
  }) async {
    try {
      if (!_initialized) {
        await initialize();
      }

      final notifSettings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        criticalAlert: true,
        provisional: false,
      );

      if (notifSettings.authorizationStatus == AuthorizationStatus.denied) {
        debugPrint('Push notifications denied by user.');
        return;
      }

      final fcmToken = await FirebaseMessaging.instance.getToken();
      if (fcmToken != null && fcmToken.isNotEmpty) {
        debugPrint('FCM Token obtained: ${fcmToken.substring(0, 15)}...');
        await _syncTokenWithServer(
          token: fcmToken,
          role: role,
          userId: userId,
          batchIds: batchIds,
        );
      }

      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
        debugPrint('FCM Token refreshed.');
        _syncTokenWithServer(
          token: newToken,
          role: role,
          userId: userId,
          batchIds: batchIds,
        );
      });
    } catch (e) {
      debugPrint('Error registering device push token: $e');
    }
  }

  static Future<void> _syncTokenWithServer({
    required String token,
    required String role,
    required String? userId,
    List<String>? batchIds,
  }) async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/notifications/register-token');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': userId,
          'role': role,
          'fcm_token': token,
          'platform': Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'unknown'),
          'batch_ids': batchIds ?? [],
        }),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        debugPrint('Successfully registered device token on backend.');
      } else {
        debugPrint('Failed to sync device token: ${res.statusCode} ${res.body}');
      }
    } catch (e) {
      debugPrint('Network error syncing device token: $e');
    }
  }
}

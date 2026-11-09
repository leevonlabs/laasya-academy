import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'core/theme/app_theme.dart';
import 'core/constants/api_constants.dart';
import 'core/services/supabase_service.dart';
import 'core/services/permission_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/fcm_service.dart';
import 'features/auth/portal_landing_screen.dart';
import 'features/trainer/trainer_main_scaffold.dart';
import 'features/student/student_main_scaffold.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService().initialize();
  await FcmService.initialize();
  NotificationService.initialize();
  runApp(const LaasyaAcademyApp());
}

class LaasyaAcademyApp extends StatelessWidget {
  const LaasyaAcademyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Laasya Cultural Academy',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _checking = true;
  Widget _targetScreen = const PortalLandingScreen();

  @override
  void initState() {
    super.initState();
    _checkAuthState();
    if (!kIsWeb) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        PermissionService.requestAppPermissions(context);
      });
    }
  }

  Future<void> _checkAuthState() async {
    try {
      final profile = await SupabaseService().getCurrentUserProfile();
      if (profile != null) {
        // Cryptographic session validation against backend server
        Map<String, dynamic>? serverUser;
        try {
          serverUser = await SupabaseService().validateSession();
        } catch (_) {}

        // Enforce role verified by session or cached profile
        final effectiveUser = serverUser ?? profile;
        final role = (effectiveUser['role'] ?? profile['role'] ?? 'student').toString();
        final userId = (effectiveUser['userId'] ?? profile['id'] ?? profile['profile_id'] ?? '').toString();

        List<String> batchIds = [];
        if (role == 'trainer') {
          try {
            final tb = SupabaseService().trainerBatches;
            batchIds = tb.map((b) => (b['id'] ?? '').toString()).where((id) => id.isNotEmpty).toList();
          } catch (_) {}
        } else {
          try {
            final enrolled = profile['enrolled_courses'];
            if (enrolled is List) {
              batchIds = enrolled
                  .map((e) => e is Map ? e['batch_id']?.toString() : null)
                  .where((id) => id != null && id.isNotEmpty)
                  .cast<String>()
                  .toList();
            }
          } catch (_) {}
        }
        if (!kIsWeb && userId.isNotEmpty) {
          try {
            await FcmService.registerDeviceToken(
              userId: userId,
              role: role,
              batchIds: batchIds.isNotEmpty ? batchIds : null,
            );
          } catch (_) {}
        }
        if (role == 'trainer') {
          _targetScreen = const TrainerMainScaffold();
        } else {
          _targetScreen = const StudentMainScaffold();
        }
      } else {
        _targetScreen = const PortalLandingScreen();
      }
    } catch (e) {
      debugPrint('Auth check error: $e');
      _targetScreen = const PortalLandingScreen();
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    return _targetScreen;
  }
}

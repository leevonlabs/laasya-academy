import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/services/supabase_service.dart';
import 'features/auth/portal_landing_screen.dart';
import 'features/trainer/trainer_main_scaffold.dart';
import 'features/student/student_main_scaffold.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService().initialize();
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
  }

  Future<void> _checkAuthState() async {
    try {
      final profile = await SupabaseService().getCurrentUserProfile();
      if (profile != null) {
        final role = profile['role'] ?? 'student';
        if (role == 'trainer') {
          _targetScreen = const TrainerMainScaffold();
        } else {
          _targetScreen = const StudentMainScaffold();
        }
      }
    } catch (e) {
      debugPrint('Auth check error: $e');
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

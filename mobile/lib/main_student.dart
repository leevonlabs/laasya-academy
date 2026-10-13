import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/services/supabase_service.dart';
import 'core/services/permission_service.dart';
import 'features/auth/student_login_screen.dart';
import 'features/student/student_main_scaffold.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService().initialize();
  runApp(const LaasyaStudentApp());
}

class LaasyaStudentApp extends StatelessWidget {
  const LaasyaStudentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Laasya Cultural Academy - Student Portal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const StudentAuthGate(),
    );
  }
}

class StudentAuthGate extends StatefulWidget {
  const StudentAuthGate({super.key});

  @override
  State<StudentAuthGate> createState() => _StudentAuthGateState();
}

class _StudentAuthGateState extends State<StudentAuthGate> {
  bool _checking = true;
  Widget _targetScreen = const StudentLoginScreen();

  @override
  void initState() {
    super.initState();
    _checkAuthState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      PermissionService.requestAppPermissions(context);
    });
  }

  Future<void> _checkAuthState() async {
    try {
      final profile = await SupabaseService().getCurrentUserProfile();
      if (profile != null) {
        final role = (profile['role'] ?? 'student').toString().toLowerCase();
        if (role == 'student') {
          _targetScreen = const StudentMainScaffold();
        } else {
          _targetScreen = const StudentLoginScreen();
        }
      } else {
        _targetScreen = const StudentLoginScreen();
      }
    } catch (e) {
      debugPrint('Student Auth check error: $e');
      _targetScreen = const StudentLoginScreen();
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

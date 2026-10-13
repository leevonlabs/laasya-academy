import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/services/supabase_service.dart';
import 'core/services/permission_service.dart';
import 'features/auth/trainer_login_screen.dart';
import 'features/trainer/trainer_main_scaffold.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService().initialize();
  runApp(const LaasyaGuruApp());
}

class LaasyaGuruApp extends StatelessWidget {
  const LaasyaGuruApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Laasya Cultural Academy - Guru Portal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const GuruAuthGate(),
    );
  }
}

class GuruAuthGate extends StatefulWidget {
  const GuruAuthGate({super.key});

  @override
  State<GuruAuthGate> createState() => _GuruAuthGateState();
}

class _GuruAuthGateState extends State<GuruAuthGate> {
  bool _checking = true;
  Widget _targetScreen = const TrainerLoginScreen();

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
        final role = (profile['role'] ?? '').toString().toLowerCase();
        if (role == 'trainer' || role == 'guru') {
          _targetScreen = const TrainerMainScaffold();
        } else {
          _targetScreen = const TrainerLoginScreen();
        }
      } else {
        _targetScreen = const TrainerLoginScreen();
      }
    } catch (e) {
      debugPrint('Guru Auth check error: $e');
      _targetScreen = const TrainerLoginScreen();
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

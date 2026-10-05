import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../student/student_main_scaffold.dart';
import '../trainer/trainer_main_scaffold.dart';

class PortalLandingScreen extends StatefulWidget {
  const PortalLandingScreen({super.key});

  @override
  State<PortalLandingScreen> createState() => _PortalLandingScreenState();
}

class _PortalLandingScreenState extends State<PortalLandingScreen> {
  bool _isStudent = true; // true = Student Login, false = Guru Login
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _switchRole(bool isStudent) {
    setState(() {
      _isStudent = isStudent;
      _errorMessage = null;
    });
  }

  void _fillAndLogin(String id, String pass, bool isStudent) {
    setState(() {
      _isStudent = isStudent;
      _identifierController.text = id;
      _passwordController.text = pass;
      _errorMessage = null;
    });
    _handleLogin();
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final id = _identifierController.text.trim();
      final pass = _passwordController.text.trim();

      if (id.isEmpty || pass.isEmpty) {
        throw Exception(
          'Please enter your ${_isStudent ? "mobile number" : "credentials"} and password.',
        );
      }

      final profile = await SupabaseService().signInWithPassword(
        email: id,
        password: pass,
      );

      if (profile == null) {
        throw Exception(
          'Invalid credentials. Tap a demo button below for quick access.',
        );
      }

      if (!mounted) return;

      if (_isStudent) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const StudentMainScaffold()),
          (route) => false,
        );
      } else {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const TrainerMainScaffold()),
          (route) => false,
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showForgotPasswordDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: LaasyaColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.help_outline_rounded, color: LaasyaColors.primary, size: 22),
            ),
            const SizedBox(width: 12),
            const Text(
              'Forgot Password?',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isStudent
                  ? 'Student accounts are issued directly by the Academy Administration office.'
                  : 'Guru accounts are issued and managed by the Academy Director.',
              style: const TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Academy Support Desk:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: LaasyaColors.textDark),
                  ),
                  SizedBox(height: 6),
                  Text('📞 Phone: +91 98480 12345', style: TextStyle(fontSize: 12, color: Colors.black87)),
                  SizedBox(height: 3),
                  Text('✉️ Email: helpdesk@laasyaacademy.com', style: TextStyle(fontSize: 12, color: Colors.black87)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Close',
              style: TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LaasyaColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Academy Brand Header
                  Center(
                    child: Image.asset(
                      'assets/images/header_logo.png',
                      height: 52,
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Laasya Cultural Academy',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: LaasyaColors.textDark,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Sign in to access your classes and updates',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: LaasyaColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 28),

                  // 2. Clean Segmented Role Selector
                  Container(
                    height: 46,
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1E4EC),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => _switchRole(true),
                            child: Container(
                              decoration: BoxDecoration(
                                color: _isStudent ? LaasyaColors.primary : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: _isStudent
                                    ? [
                                        BoxShadow(
                                          color: LaasyaColors.primary.withOpacity(0.25),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Center(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.school_rounded,
                                      size: 17,
                                      color: _isStudent ? Colors.white : LaasyaColors.textDark,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Student',
                                      style: TextStyle(
                                        color: _isStudent ? Colors.white : LaasyaColors.textDark,
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => _switchRole(false),
                            child: Container(
                              decoration: BoxDecoration(
                                color: !_isStudent ? LaasyaColors.primary : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: !_isStudent
                                    ? [
                                        BoxShadow(
                                          color: LaasyaColors.primary.withOpacity(0.25),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Center(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.person_rounded,
                                      size: 17,
                                      color: !_isStudent ? Colors.white : LaasyaColors.textDark,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Guru / Faculty',
                                      style: TextStyle(
                                        color: !_isStudent ? Colors.white : LaasyaColors.textDark,
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // 3. Error Banner (if any)
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDE8E8),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFF87171)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Color(0xFF991B1B), fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 4. Input Field 1: Phone or Email
                  Text(
                    _isStudent ? 'Mobile Number or Student ID' : 'Registered Email Address',
                    style: const TextStyle(
                      color: LaasyaColors.textDark,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _identifierController,
                    keyboardType: _isStudent ? TextInputType.phone : TextInputType.emailAddress,
                    style: const TextStyle(fontSize: 14.5, color: LaasyaColors.textDark),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: Icon(
                        _isStudent ? Icons.phone_android_rounded : Icons.alternate_email_rounded,
                        color: Colors.grey.shade600,
                        size: 19,
                      ),
                      hintText: _isStudent ? 'e.g. 9845012345 or LCA-6' : 'e.g. anusha@laasyaacademy.com',
                      hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13.5),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: LaasyaColors.primary, width: 1.6),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 5. Input Field 2: Password
                  const Text(
                    'Password',
                    style: TextStyle(
                      color: LaasyaColors.textDark,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: const TextStyle(fontSize: 14.5, color: LaasyaColors.textDark),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: Icon(
                        Icons.lock_outline_rounded,
                        color: Colors.grey.shade600,
                        size: 19,
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          color: Colors.grey.shade600,
                          size: 19,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                      hintText: 'Enter your password',
                      hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13.5),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: LaasyaColors.primary, width: 1.6),
                      ),
                    ),
                  ),

                  // 6. Forgot Password link
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _showForgotPasswordDialog,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Forgot Password?',
                        style: TextStyle(
                          color: LaasyaColors.primary,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  // 7. Primary Sign In Button
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: LaasyaColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 1,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.2),
                            )
                          : Text(
                              _isStudent ? 'Sign In as Student' : 'Sign In as Guru',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // 8. Clean, Compact Quick Demo Access
                  Row(
                    children: [
                      Expanded(child: Divider(color: Colors.grey.shade300)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'Quick Demo Access',
                          style: TextStyle(color: Colors.grey.shade500, fontSize: 11.5),
                        ),
                      ),
                      Expanded(child: Divider(color: Colors.grey.shade300)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _fillAndLogin('9845012345', 'student123', true),
                          icon: const Icon(Icons.school_outlined, size: 16),
                          label: const Text(
                            'Student Demo',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: LaasyaColors.primary,
                            side: const BorderSide(color: Color(0xFFF0D5E4)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            backgroundColor: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _fillAndLogin('anusha@laasyaacademy.com', 'Guru@123', false),
                          icon: const Icon(Icons.person_outline, size: 16),
                          label: const Text(
                            'Guru Demo',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: LaasyaColors.primary,
                            side: const BorderSide(color: Color(0xFFF0D5E4)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            backgroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

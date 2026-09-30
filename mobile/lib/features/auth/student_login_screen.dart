import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../student/student_main_scaffold.dart';

class StudentLoginScreen extends StatefulWidget {
  const StudentLoginScreen({super.key});

  @override
  State<StudentLoginScreen> createState() => _StudentLoginScreenState();
}

class _StudentLoginScreenState extends State<StudentLoginScreen> {
  final _identifierController = TextEditingController(text: '9912345678');
  final _passwordController = TextEditingController(text: 'Student@123');

  bool _obscurePassword = true;
  bool _rememberMe = true;
  bool _isLoading = false;
  String? _errorMessage;
  String _selectedId = 'st-1';

  final List<Map<String, String>> _demoStudents = [
    {
      'id': 'st-1',
      'name': 'Ananya Rao',
      'roll': 'LCA-10021',
      'mobile': '9912345678',
      'course': 'Bharathanatyam (Batch A)',
      'initials': 'AR',
      'password': 'Student@123',
    },
    {
      'id': 'st-2',
      'name': 'Sneha Reddy',
      'roll': 'LCA-10022',
      'mobile': '9912345680',
      'course': 'Bharathanatyam (Batch A)',
      'initials': 'SR',
      'password': 'Student@123',
    },
    {
      'id': 'st-3',
      'name': 'Meera Nambiar',
      'roll': 'LCA-10023',
      'mobile': '9912345682',
      'course': 'Carnatic Vocal Music',
      'initials': 'MN',
      'password': 'Student@123',
    },
    {
      'id': 'st-4',
      'name': 'Kiran Kumar',
      'roll': 'LCA-10024',
      'mobile': '9912345684',
      'course': 'Kuchipudi Classical Dance',
      'initials': 'KK',
      'password': 'Student@123',
    },
  ];

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _fillStudent(Map<String, String> stu) {
    setState(() {
      _selectedId = stu['id']!;
      _identifierController.text = stu['mobile']!;
      _passwordController.text = stu['password']!;
      _errorMessage = null;
    });
  }

  Future<void> _handleStudentLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final input = _identifierController.text.trim();
      final password = _passwordController.text.trim();

      if (input.isEmpty || password.isEmpty) {
        throw Exception('Please enter your mobile number / roll number and password.');
      }

      final profile = await SupabaseService().signInWithPassword(
        email: input,
        password: password,
      );

      if (profile == null) {
        throw Exception('Failed to sign in. Please verify your credentials.');
      }

      if (!mounted) return;

      // Navigate to dedicated Student Scaffold
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const StudentMainScaffold()),
        (route) => false,
      );
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.lock_reset_rounded, color: LaasyaColors.primary),
            SizedBox(width: 8),
            Text('Forgot Password?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Student accounts are created and managed securely by Laasya Cultural Academy.',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
            SizedBox(height: 12),
            Text(
              'To reset your password or retrieve your Roll Number:\n• Contact Academy Office: +91 98480 12345\n• Email: admissions@laasyaacademy.com\n• Or visit the Academy reception desk with your student ID.',
              style: TextStyle(fontSize: 12, color: Colors.black87, height: 1.5),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Understood', style: TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LaasyaColors.primaryDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Student Login',
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  children: [
                    Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: LaasyaColors.accentGold, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/crest_logo.png',
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'STUDENT & LEARNER ACCESS',
                      style: TextStyle(
                        color: LaasyaColors.accentGold,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Laasya Cultural Academy Student Portal',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              // White Card Form
              Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(32),
                    topRight: Radius.circular(32),
                  ),
                ),
                padding: const EdgeInsets.all(26),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sign in with Mobile or Roll No.',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.bold,
                        color: LaasyaColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Access your courses, schedule, and mark your class attendance.',
                      style: TextStyle(fontSize: 12.5, color: LaasyaColors.textMuted),
                    ),
                    const SizedBox(height: 20),

                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFCA5A5)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: LaasyaColors.error, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: LaasyaColors.error, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Registered Mobile or Roll Number Field
                    const Text(
                      'Registered Mobile Number or Roll No.',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _identifierController,
                      keyboardType: TextInputType.text,
                      decoration: const InputDecoration(
                        hintText: 'e.g. 9912345678 or LCA-10021',
                        prefixIcon: Icon(Icons.phone_android_rounded, color: LaasyaColors.primary, size: 20),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Password Field
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Password',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        GestureDetector(
                          onTap: _showForgotPasswordDialog,
                          child: const Text(
                            'Forgot Password?',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: LaasyaColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        hintText: 'Enter student password',
                        prefixIcon: const Icon(Icons.lock_outline_rounded, color: LaasyaColors.primary, size: 20),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            color: LaasyaColors.primary,
                            size: 20,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Remember Me
                    Row(
                      children: [
                        SizedBox(
                          width: 22,
                          height: 22,
                          child: Checkbox(
                            value: _rememberMe,
                            activeColor: LaasyaColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                            onChanged: (v) => setState(() => _rememberMe = v ?? true),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text('Remember on this phone', style: TextStyle(fontSize: 12, color: Colors.black87)),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleStudentLogin,
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Student Sign In', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward_rounded, size: 18, color: LaasyaColors.accentGold),
                                ],
                              ),
                      ),
                    ),

                    const SizedBox(height: 26),

                    // Quick Select Demo Students
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: LaasyaColors.background,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: LaasyaColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Select Enrolled Student Account',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primaryDark),
                              ),
                              Text(
                                '1-Tap to Load',
                                style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ..._demoStudents.map((stu) {
                            final isSel = _selectedId == stu['id'];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8.0),
                              child: InkWell(
                                onTap: () => _fillStudent(stu),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: isSel ? Colors.white : Colors.white.withOpacity(0.6),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isSel ? LaasyaColors.primary : const Color(0xFFE5D4DE),
                                      width: isSel ? 2 : 1,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 17,
                                        backgroundColor: isSel ? LaasyaColors.primary : Colors.grey.shade400,
                                        child: Text(
                                          stu['initials']!,
                                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              '${stu['name']} (${stu['roll']})',
                                              style: TextStyle(
                                                fontSize: 12.5,
                                                fontWeight: FontWeight.bold,
                                                color: isSel ? LaasyaColors.primaryDark : LaasyaColors.textDark,
                                              ),
                                            ),
                                            Text(
                                              '${stu['course']} • Mobile: ${stu['mobile']}',
                                              style: const TextStyle(fontSize: 10.5, color: LaasyaColors.textMuted),
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (isSel)
                                        const Icon(Icons.check_circle_rounded, color: LaasyaColors.primary, size: 18),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

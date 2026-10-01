import 'package:flutter/material.dart';
import '../../core/services/supabase_service.dart';
import '../student/student_main_scaffold.dart';
import '../trainer/trainer_main_scaffold.dart';

class PortalLandingScreen extends StatefulWidget {
  const PortalLandingScreen({super.key});

  @override
  State<PortalLandingScreen> createState() => _PortalLandingScreenState();
}

class _PortalLandingScreenState extends State<PortalLandingScreen> {
  bool _isStudent = true; // true = Student Login, false = Trainer Login
  final _identifierController = TextEditingController(text: '9845012345');
  final _passwordController = TextEditingController(text: 'student123');

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
      if (isStudent) {
        _identifierController.text = '9845012345';
        _passwordController.text = 'student123';
      } else {
        _identifierController.text = 'anusha@laasyaacademy.com';
        _passwordController.text = 'Guru@123';
      }
    });
  }

  void _autoFillDemo() {
    setState(() {
      _errorMessage = null;
      if (_isStudent) {
        _identifierController.text = '9845012345';
        _passwordController.text = 'student123';
      } else {
        _identifierController.text = 'anusha@laasyaacademy.com';
        _passwordController.text = 'Guru@123';
      }
    });
  }

  void _quickLoginWithAccount(String id, String pass) {
    setState(() {
      _identifierController.text = id;
      _passwordController.text = pass;
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
        throw Exception('Please enter your ${_isStudent ? "mobile number" : "credentials"} and password.');
      }

      final profile = await SupabaseService().signInWithPassword(
        email: id,
        password: pass,
      );

      if (profile == null) {
        throw Exception('Invalid credentials. Tap "Fill in" below to load demo access.');
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
        backgroundColor: const Color(0xFF2A031E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFEBB128), width: 1.5),
        ),
        title: Row(
          children: [
            const Icon(Icons.lock_reset_rounded, color: Color(0xFFEBB128)),
            const SizedBox(width: 10),
            Text(
              _isStudent ? 'Student Password Reset' : 'Guru Password Reset',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isStudent
                  ? 'Student accounts are created and registered by the Academy Office.'
                  : 'Guru accounts are authorized and managed by the Academy Director.',
              style: const TextStyle(fontSize: 13, color: Colors.white70, height: 1.4),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white12),
              ),
              child: const Text(
                '• Call Academy Helpdesk: +91 98480 12345\n• Email: helpdesk@laasyaacademy.com\n• Or visit the Academy reception desk',
                style: TextStyle(fontSize: 12, color: Colors.white, height: 1.5),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Understood',
              style: TextStyle(color: Color(0xFFEBB128), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF190010),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF960858), // Vibrant Berry Magenta from mockup
                  Color(0xFF7B0648),
                  Color(0xFF550332),
                  Color(0xFF350020),
                  Color(0xFF1D0012), // Deep dark plum/navy bottom
                ],
                stops: [0.0, 0.25, 0.55, 0.8, 1.0],
              ),
            ),
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 6),

                    // =========================================================
                    // 1. TOP LOGO (Image 2 - Crest + LAASYA CULTURAL ACADEMY)
                    // =========================================================
                    Image.asset(
                      'assets/images/header_logo.png',
                      width: 290,
                      height: 84,
                      fit: BoxFit.contain,
                    ),

                    const SizedBox(height: 6),

                    // =========================================================
                    // 2. TRANSPARENT CULTURAL BANNER (Image 3 - Students Art)
                    // =========================================================
                    SizedBox(
                      height: 165,
                      width: double.infinity,
                      child: Image.asset(
                        'assets/images/cultural_banner.png',
                        fit: BoxFit.contain,
                      ),
                    ),

                    const SizedBox(height: 8),

                    // =========================================================
                    // 3. MOTTO: "Unleash your talent"
                    // =========================================================
                    const Text(
                      'Unleash your talent',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFFEBB128),
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.4,
                      ),
                    ),

                    const SizedBox(height: 18),

                    // =========================================================
                    // 4. SEGMENTED ROLE SWITCHER (Student Login vs Trainer Login)
                    // =========================================================
                    Container(
                      height: 50,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6F1746).withOpacity(0.9),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          // Tab 1: Student Login
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _switchRole(true),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: _isStudent ? const Color(0xFFEBB128) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: _isStudent
                                      ? [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.2),
                                            blurRadius: 6,
                                            offset: const Offset(0, 2),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Center(
                                  child: Text(
                                    'Student Login',
                                    style: TextStyle(
                                      color: _isStudent ? const Color(0xFF260117) : Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),

                          // Tab 2: Guru Login
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _switchRole(false),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: !_isStudent ? const Color(0xFFEBB128) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: !_isStudent
                                      ? [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.2),
                                            blurRadius: 6,
                                            offset: const Offset(0, 2),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Center(
                                  child: Text(
                                    'Guru Login',
                                    style: TextStyle(
                                      color: !_isStudent ? const Color(0xFF260117) : Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Error Message Banner (if any)
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF4C081A),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE11D48)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: Color(0xFFFDA4AF), size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: Color(0xFFFDA4AF), fontSize: 11.5),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // =========================================================
                    // 5. INPUT FIELD 1 (Registered Mobile / Email)
                    // Clean White Capsule Entry Bar as in reference image!
                    // =========================================================
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _isStudent ? 'Registered mobile number' : 'Registered Guru email / mobile',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _identifierController,
                      keyboardType: _isStudent ? TextInputType.phone : TextInputType.emailAddress,
                      cursorColor: Colors.white,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15.5,
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFF220016),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                        border: OutlineInputBorder(
                           borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFEBB128), width: 1.8),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFEBB128), width: 1.8),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFFFD54F), width: 2.2),
                        ),
                        prefixIcon: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          child: Icon(
                            _isStudent ? Icons.phone_android_rounded : Icons.badge_outlined,
                            color: const Color(0xFFEBB128),
                            size: 20,
                          ),
                        ),
                        prefixIconConstraints: const BoxConstraints(minWidth: 48, minHeight: 24),
                        hintText: _isStudent ? 'e.g. 9845012345 or LCA-10021' : 'e.g. anusha@laasyaacademy.com',
                        hintStyle: const TextStyle(color: Colors.white38, fontSize: 13.5),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // =========================================================
                    // 6. INPUT FIELD 2 (Password)
                    // Matches Reference Image 2: Dark Background + Golden Border!
                    // =========================================================
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Password',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      cursorColor: Colors.white,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15.5,
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFF220016),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFEBB128), width: 1.8),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFEBB128), width: 1.8),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFFFD54F), width: 2.2),
                        ),
                        prefixIcon: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 14),
                          child: Icon(
                            Icons.lock_outline_rounded,
                            color: Color(0xFFEBB128),
                            size: 20,
                          ),
                        ),
                        prefixIconConstraints: const BoxConstraints(minWidth: 48, minHeight: 24),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            color: const Color(0xFFEBB128),
                            size: 20,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                        hintText: 'Enter your password',
                        hintStyle: const TextStyle(color: Colors.white38, fontSize: 13.5),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // =========================================================
                    // 7. GOLDEN ACTION BUTTON: "Log in as student" / "Log in as trainer"
                    // =========================================================
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEBB128), // Golden Yellow from mockup
                          foregroundColor: const Color(0xFF250216),
                          elevation: 3,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: _isLoading ? null : _handleLogin,
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Color(0xFF250216), strokeWidth: 2.2),
                              )
                            : Text(
                                _isStudent ? 'Log in as student' : 'Log in as Guru',
                                style: const TextStyle(
                                  fontSize: 15.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.2,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // =========================================================
                    // 8. "Forgot password?" LINK
                    // =========================================================
                    GestureDetector(
                      onTap: _showForgotPasswordDialog,
                      child: const Text(
                        'Forgot password?',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                          decorationColor: Colors.white,
                        ),
                      ),
                    ),

                    const SizedBox(height: 26),

                    const SizedBox(height: 24),

                    // =========================================================
                    // 9. QUICK DEMO ACCOUNTS (1-TAP SWITCH & LOGIN)
                    // =========================================================
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.28),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFEBB128).withOpacity(0.35)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _isStudent ? '⚡ Quick Student Accounts' : '⚡ Quick Guru Faculty Accounts',
                                style: const TextStyle(
                                  color: Color(0xFFEBB128),
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              GestureDetector(
                                onTap: _autoFillDemo,
                                child: const Text(
                                  'Autofill Default',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          if (_isStudent) ...[
                            _demoAccountTile(
                              name: 'Aditi Sundaram',
                              meta: 'Bharathanatyam • Age 16 • Room 101',
                              badge: 'Fee Paid',
                              badgeBg: const Color(0xFFDEF7EC),
                              badgeFg: const Color(0xFF03543F),
                              onTap: () => _quickLoginWithAccount('9845012345', 'student123'),
                            ),
                            const SizedBox(height: 6),
                            _demoAccountTile(
                              name: 'Ananya Rao',
                              meta: 'Bharathanatyam • Age 16 • Room 101',
                              badge: 'Partial Due: ₹1,000',
                              badgeBg: const Color(0xFFFEF3C7),
                              badgeFg: const Color(0xFF92400E),
                              onTap: () => _quickLoginWithAccount('9912345678', 'student123'),
                            ),
                            const SizedBox(height: 6),
                            _demoAccountTile(
                              name: 'Sneha Reddy',
                              meta: 'Bharathanatyam • Age 15 • Room 101',
                              badge: 'Due: ₹2,000',
                              badgeBg: const Color(0xFFFDE8E8),
                              badgeFg: const Color(0xFF9B1C1C),
                              onTap: () => _quickLoginWithAccount('9912345680', 'student123'),
                            ),
                            const SizedBox(height: 6),
                            _demoAccountTile(
                              name: 'Aryan Sharma',
                              meta: 'Art & Craft • Age 14 • Chitra Kala Bhavan',
                              badge: 'Fine Arts',
                              badgeBg: const Color(0xFFE1EFFE),
                              badgeFg: const Color(0xFF1E429F),
                              onTap: () => _quickLoginWithAccount('9845000014', 'student123'),
                            ),
                          ] else ...[
                            _demoAccountTile(
                              name: 'Smt. Anusha Sumesh',
                              meta: 'Head Dance Guru • Room 101 • ₹45k/mo',
                              badge: 'Salary Paid',
                              badgeBg: const Color(0xFFDEF7EC),
                              badgeFg: const Color(0xFF03543F),
                              onTap: () => _quickLoginWithAccount('anusha@laasyaacademy.com', 'Guru@123'),
                            ),
                            const SizedBox(height: 6),
                            _demoAccountTile(
                              name: 'Guru Amos P Ovung',
                              meta: 'Western Music & Violin • Hall 2 • ₹40k/mo',
                              badge: 'Salary Paid',
                              badgeBg: const Color(0xFFDEF7EC),
                              badgeFg: const Color(0xFF03543F),
                              onTap: () => _quickLoginWithAccount('amos@laasyaacademy.com', 'Amos@123'),
                            ),
                            const SizedBox(height: 6),
                            _demoAccountTile(
                              name: 'Shri H. Manikandan',
                              meta: 'Carnatic Music • Room 102 • ₹38k/mo',
                              badge: 'Salary Paid',
                              badgeBg: const Color(0xFFDEF7EC),
                              badgeFg: const Color(0xFF03543F),
                              onTap: () => _quickLoginWithAccount('manikandan@laasyaacademy.com', 'Mani@123'),
                            ),
                            const SizedBox(height: 6),
                            _demoAccountTile(
                              name: 'Sensei Vijay Kumar',
                              meta: 'Karate & Self Defense • Kalari • ₹32k/mo',
                              badge: 'Pending Due',
                              badgeBg: const Color(0xFFFDE8E8),
                              badgeFg: const Color(0xFF9B1C1C),
                              onTap: () => _quickLoginWithAccount('vijay@laasyaacademy.com', 'Vijay@123'),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _demoAccountTile({
    required String name,
    required String meta,
    required String badge,
    required Color badgeBg,
    required Color badgeFg,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withOpacity(0.09)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    meta,
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 10.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: badgeBg,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                badge,
                style: TextStyle(
                  color: badgeFg,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 6),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 11,
              color: Color(0xFFEBB128),
            ),
          ],
        ),
      ),
    );
  }
}

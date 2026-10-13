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
  bool _agreeToTerms = false;
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
          'Please enter your ${_isStudent ? "mobile number / student roll no" : "registered phone number"} and password.',
        );
      }

      if (!_agreeToTerms) {
        throw Exception(
          'Please agree to the Terms & Conditions and Privacy Policy to continue.',
        );
      }

      final profile = await SupabaseService().signInWithPassword(
        email: id,
        password: pass,
      );

      if (profile == null) {
        throw Exception(
          'Invalid credentials. Please verify your mobile number / roll number and password.',
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
                  const SizedBox(height: 14),

                  // Academy Cultural Heritage Artwork Banner (Classical Dance, Music & Arts)
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.55), width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: LaasyaColors.primaryDark.withOpacity(0.12),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.asset(
                        'assets/images/cultural_arts_hero.jpg',
                        height: 125,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

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

                  // 4. Input Field 1: Phone
                  Text(
                    _isStudent ? 'Mobile Number or Student Roll No' : 'Registered Phone Number',
                    style: const TextStyle(
                      color: LaasyaColors.textDark,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _identifierController,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(fontSize: 14.5, color: LaasyaColors.textDark),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: const Icon(
                        Icons.phone_android_rounded,
                        color: LaasyaColors.primary,
                        size: 19,
                      ),
                      hintText: _isStudent ? 'Enter mobile number or roll number' : 'Enter registered phone number',
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
                      hintText: 'Enter password',
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

                  const SizedBox(height: 12),

                  // Terms & Conditions and Privacy Policy Tickmark
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: Checkbox(
                          value: _agreeToTerms,
                          activeColor: LaasyaColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                          onChanged: (val) => setState(() => _agreeToTerms = val ?? false),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _agreeToTerms = !_agreeToTerms),
                          child: Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              const Text(
                                'I agree to the ',
                                style: TextStyle(fontSize: 12, color: LaasyaColors.textDark),
                              ),
                              GestureDetector(
                                onTap: () => _showPrivacyPolicyBottomSheet(context),
                                child: const Text(
                                  'Terms & Conditions',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: LaasyaColors.primary,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                              const Text(
                                ' and ',
                                style: TextStyle(fontSize: 12, color: LaasyaColors.textDark),
                              ),
                              GestureDetector(
                                onTap: () => _showPrivacyPolicyBottomSheet(context),
                                child: const Text(
                                  'Privacy Policy',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: LaasyaColors.primary,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

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

                  const SizedBox(height: 16),

                  // 8. Privacy Policy & Terms Link (Mandatory for Google Play & Apple App Store)
                  Center(
                    child: TextButton.icon(
                      onPressed: () => _showPrivacyPolicyBottomSheet(context),
                      icon: const Icon(Icons.privacy_tip_outlined, size: 14, color: Color(0xFF6B7280)),
                      label: const Text(
                        'Privacy Policy & Terms of Service',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF6B7280),
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showPrivacyPolicyBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 44,
              height: 4.5,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.shield_outlined, color: LaasyaColors.primary, size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Privacy Policy & Terms',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.grey),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(22, 14, 22, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Laasya Cultural Academy Privacy Policy',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Last Updated: October 2026 • Compliant with Google Play & Apple App Store Guidelines',
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 14),
                    _privacySectionTitle('1. Introduction'),
                    _privacyParagraph(
                      'Laasya Cultural Academy ("we", "our", or "the Academy") is committed to protecting the privacy of our disciples, parents, and faculty members. This Privacy Policy explains our data collection, usage, and protection practices for the Laasya Cultural Academy mobile application and web portal.',
                    ),
                    _privacySectionTitle('2. Information We Collect'),
                    _privacyParagraph(
                      'To operate our academy management and disciple safety services, we collect:\n'
                      '• Account Credentials: Student Roll Number, Registered Mobile Number, and secure login passwords.\n'
                      '• Disciple & Parent Profile: Full Name, Parent/Guardian Name, Phone Number, Age, Gender, and Course/Batch enrollment details.\n'
                      '• Attendance & Class Logs: Real-time class session timestamps, attendance check-in records marked by Gurus, and class completion alerts.\n'
                      '• Profile Imagery: Optional profile photos uploaded by students or Gurus for academy identification.\n'
                      '• Device Notifications: Push notification tokens and foreground service synchronization states to sound real-time attention alerts for child pickup.',
                    ),
                    _privacySectionTitle('3. How We Use Information'),
                    _privacyParagraph(
                      'We use collected information solely for legitimate educational and academy administrative purposes:\n'
                      '• To verify disciple enrollment and display personal schedules, batches, and course curriculum.\n'
                      '• To notify parents immediately when a class session ends so they can collect their children safely.\n'
                      '• To maintain accurate attendance audits, performance records, and fee receipts.\n'
                      '• To deliver official circulars, holiday notices, and learning video vault links.',
                    ),
                    _privacySectionTitle('4. Children\'s Privacy (COPPA & GDPR-K Compliance)'),
                    _privacyParagraph(
                      'Many of our classical arts disciples are children under 18 years of age. Accounts for minors are created and managed by or with the direct consent of their parents/guardians and academy management. We never display child contact information publicly, and we never use children\'s data for targeted marketing, profiling, or behavioral tracking.',
                    ),
                    _privacySectionTitle('5. Data Sharing & Third Parties'),
                    _privacyParagraph(
                      'We DO NOT sell, rent, trade, or monetize user data. Information is stored securely using enterprise encrypted databases (PostgreSQL/Supabase) hosted in protected cloud data centers with TLS/SSL encryption in transit and AES encryption at rest.',
                    ),
                    _privacySectionTitle('6. User Rights & Data Deletion'),
                    _privacyParagraph(
                      'Disciples and parents have the right to inspect, correct, or request the deletion of their personal data at any time. Upon leaving the academy, you may request complete account deletion by contacting the Academy Administration Desk.',
                    ),
                    _privacySectionTitle('7. Contact Us & Grievance Officer'),
                    _privacyParagraph(
                      'For privacy inquiries, data deletion requests, or support:\n'
                      'Laasya Cultural Academy Administration Desk\n'
                      'Email: privacy@laasyacademy.com / admin@laasyacademy.com\n'
                      'Phone: +91 81519 98899 / +91 98480 12345\n'
                      'Website: https://laasya-academy.vercel.app',
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: LaasyaColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('I Understand & Agree', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _privacySectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 4),
      child: Text(
        title,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
      ),
    );
  }

  Widget _privacyParagraph(String text) {
    return Text(
      text,
      style: const TextStyle(fontSize: 12, color: Colors.black87, height: 1.45),
    );
  }
}

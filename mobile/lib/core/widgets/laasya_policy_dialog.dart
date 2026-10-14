import 'package:flutter/material.dart';
import '../constants/colors.dart';

/// Modal dialog and bottom sheet displaying official Privacy Policy
/// and Terms & Conditions compliant with Google Play & Apple App Store guidelines.
class LaasyaPolicyDialog {
  static void showPrivacy(BuildContext context) {
    _showPolicySheet(context, initialTab: 0);
  }

  static void showTerms(BuildContext context) {
    _showPolicySheet(context, initialTab: 1);
  }

  static void _showPolicySheet(BuildContext context, {int initialTab = 0}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PolicySheetWidget(initialTab: initialTab),
    );
  }
}

class _PolicySheetWidget extends StatefulWidget {
  final int initialTab;
  const _PolicySheetWidget({required this.initialTab});

  @override
  State<_PolicySheetWidget> createState() => _PolicySheetWidgetState();
}

class _PolicySheetWidgetState extends State<_PolicySheetWidget> {
  late int _selectedTab; // 0 = Privacy Policy, 1 = Terms & Conditions

  @override
  void initState() {
    super.initState();
    _selectedTab = widget.initialTab;
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.88;

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 44,
            height: 4.5,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(3),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      _selectedTab == 0 ? Icons.privacy_tip_rounded : Icons.gavel_rounded,
                      color: LaasyaColors.primary,
                      size: 22,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _selectedTab == 0 ? 'Privacy Policy' : 'Terms & Conditions',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: LaasyaColors.textDark,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.grey),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Tab Switcher
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Container(
              height: 40,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedTab = 0),
                      child: Container(
                        decoration: BoxDecoration(
                          color: _selectedTab == 0 ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: _selectedTab == 0
                              ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4)]
                              : null,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'Privacy Policy',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: _selectedTab == 0 ? FontWeight.bold : FontWeight.w600,
                            color: _selectedTab == 0 ? LaasyaColors.primary : Colors.grey.shade600,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedTab = 1),
                      child: Container(
                        decoration: BoxDecoration(
                          color: _selectedTab == 1 ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: _selectedTab == 1
                              ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4)]
                              : null,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'Terms & Conditions',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: _selectedTab == 1 ? FontWeight.bold : FontWeight.w600,
                            color: _selectedTab == 1 ? LaasyaColors.primary : Colors.grey.shade600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const Divider(height: 16),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(22, 8, 22, 24),
              child: _selectedTab == 0 ? _buildPrivacyContent() : _buildTermsContent(),
            ),
          ),

          // Bottom Action
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: LaasyaColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => Navigator.pop(context),
                child: const Text('I Understand & Agree', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyContent() {
    return Column(
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

        _sectionTitle('1. Introduction & Institutional Scope'),
        _paragraph(
          'Laasya Cultural Academy ("we", "our", or "the Academy") is dedicated to classical performing arts and music education. This Privacy Policy governs our data handling practices for disciples, parents/guardians, and revered faculty across our mobile applications (Android and iOS) and web management systems.',
        ),

        _sectionTitle('2. Class Completion Audio Alerts & Notifications'),
        _paragraph(
          'Our mobile application provides time-critical notification services to ensure the safety and punctual pickup of students:\n'
          '• When a Guru marks a session as "Class Completed", our system broadcasts a real-time notification.\n'
          '• This notification is accompanied by a distinctive custom vocal chime ("Class is over, hooray hooray! Parents come and pick us today! Laasya kids are ready to go, come collect your child, hello!").\n'
          '• This audible alert notifies parents and guardians that their child\'s batch has concluded and they may collect their child from the academy premises.\n'
          '• Notifications do NOT require continuous foreground services or background battery-draining polling. The application respects OS notification and background execution limits set by Google Play and Apple App Store.',
        ),

        _sectionTitle('3. Child & Minor Disciple Privacy (COPPA & GDPR-K Compliance)'),
        _paragraph(
          'A significant portion of our classical arts disciples are children under 18 years of age:\n'
          '• Accounts for minor disciples are provisioned exclusively through authorized academy admission and registered parent/guardian telephone numbers.\n'
          '• Disciple personal details (full name, roll number, guardian phone, attendance timestamps, batch enrollment) are stored strictly for educational management and campus safety.\n'
          '• We do NOT sell, rent, license, or monetize any child or user data.\n'
          '• We do NOT engage in behavioral advertising, third-party user profiling, or ad tracking.',
        ),

        _sectionTitle('4. Information We Collect'),
        _paragraph(
          '• Credentials: Registered phone number or student roll number and secure access passwords.\n'
          '• Disciple Profile: Name, guardian contact number, age, enrolled discipline (Bharatanatyam, Kuchipudi, Carnatic Vocal, etc.), and assigned batch.\n'
          '• Attendance Logs: Class date, session status (Present/Absent), and roll call timestamps recorded by Gurus.\n'
          '• Profile Avatars: Optional photos uploaded by users for academy identification cards.',
        ),

        _sectionTitle('5. Device Permissions & Transparency'),
        _paragraph(
          'The application requests only necessary permissions:\n'
          '• Notifications (POST_NOTIFICATIONS on Android 13+ and iOS): For delivery of class completion audio alerts, attendance status updates, and emergency circulars.\n'
          '• Camera: Optional, used solely for attendance QR code verification or capturing profile photos.\n'
          '• Photos / Media Storage: Optional, used strictly for avatar uploads and invoice downloads.\n'
          '• No invasive permissions (such as permanent background location, permanent data-sync foreground services, or microphone recording) are requested or utilized.',
        ),

        _sectionTitle('6. Security & Data Protection'),
        _paragraph(
          'All communications between our mobile clients and database servers are protected with industry-standard TLS/SSL encryption in transit and AES-256 encryption at rest. Strict role-based row-level security (RLS) ensures disciples and parents only access records belonging to their registered family account.',
        ),

        _sectionTitle('7. Data Retention & Account Deletion'),
        _paragraph(
          'Parents and disciples retain the right to inspect, correct, or request complete deletion of their account records upon graduating or leaving the academy. To request data deletion, contact the Academy Office.',
        ),

        _sectionTitle('8. Grievance Officer & Contact'),
        _paragraph(
          'Laasya Cultural Academy\n'
          'VV Maple Hub, 2nd Floor, Kannamangala, Bengaluru - 560067\n'
          'Email: privacy@laasyaacademy.com • info@laasyaacademy.com\n'
          'Phone: +91 81519 98899 / +91 98480 12345\n'
          'Website: https://laasya-academy.vercel.app',
        ),
      ],
    );
  }

  Widget _buildTermsContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Laasya Cultural Academy Terms & Conditions',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
        ),
        const SizedBox(height: 4),
        Text(
          'Last Updated: October 2026 • Terms of Enrollment & Digital Service',
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 14),

        _sectionTitle('1. Acceptance of Terms'),
        _paragraph(
          'By logging into the Laasya Academy mobile application or web portal as a Disciple, Parent, or Guru, you agree to be bound by these Terms and Conditions and our Privacy Policy.',
        ),

        _sectionTitle('2. Role-Based Access & Authentication'),
        _paragraph(
          '• Disciple / Student Portal: Dedicated solely to enrolled students and parents to view class schedules, attendance records, circulars, fee receipts, and receive pickup alerts.\n'
          '• Guru / Trainer Portal: Strictly restricted to verified faculty members for taking roll calls, managing batch schedules, and publishing class completion alerts.\n'
          '• Sharing credentials or attempting unauthorized cross-role access is prohibited.',
        ),

        _sectionTitle('3. Class Attendance & Child Pickup Responsibility'),
        _paragraph(
          '• Gurus record daily roll calls at the start of each class and conclude sessions by triggering the "Class Completed" notification.\n'
          '• When the class conclusion chime plays, parents/guardians are expected to promptly collect their child from the academy premises.\n'
          '• While the Academy maintains high safety standards on campus, parents are responsible for timely child transportation following class conclusion.',
        ),

        _sectionTitle('4. Tuition Fees & Digital Invoices'),
        _paragraph(
          '• Course tuition fees must be remitted as per the academy\'s monthly schedule.\n'
          '• Official digital tax receipts and invoices are generated upon payment and available for PDF download within the student payments console.',
        ),

        _sectionTitle('5. Academic Content & Video Vault'),
        _paragraph(
          'Instructional videos, classical choreography, and performance recordings available in the Academy Video Vault are proprietary intellectual property of Laasya Cultural Academy and may not be redistributed without permission.',
        ),

        _sectionTitle('6. Code of Conduct & Revisions'),
        _paragraph(
          'Disciples and faculty members are expected to maintain the utmost reverence, discipline, and respect inherent in classical arts traditions. The Academy reserves the right to update these terms as needed.',
        ),
      ],
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 4),
      child: Text(
        title,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
      ),
    );
  }

  Widget _paragraph(String text) {
    return Text(
      text,
      style: const TextStyle(fontSize: 12, color: Colors.black87, height: 1.45),
    );
  }
}

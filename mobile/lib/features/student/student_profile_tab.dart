import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../auth/portal_landing_screen.dart';
import 'student_video_library_screen.dart';

class StudentProfileTab extends StatefulWidget {
  const StudentProfileTab({super.key});

  @override
  State<StudentProfileTab> createState() => _StudentProfileTabState();
}

class _StudentProfileTabState extends State<StudentProfileTab> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    final prof = await SupabaseService().getCurrentUserProfile();
    if (mounted) {
      setState(() {
        _profile = prof;
        _isLoading = false;
      });
    }
  }

  void _showChangePasswordDialog() {
    final oldPassCtrl = TextEditingController();
    final newPassCtrl = TextEditingController();
    final confirmPassCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.lock_reset_rounded, color: LaasyaColors.primary),
            SizedBox(width: 8),
            Text('Change Password', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: oldPassCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Current Password'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newPassCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'New Password (Min 6 chars)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: confirmPassCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Confirm New Password'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (newPassCtrl.text != confirmPassCtrl.text) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('New passwords do not match')),
                );
                return;
              }
              final nav = Navigator.of(ctx);
              final messenger = ScaffoldMessenger.of(context);
              await SupabaseService().changePassword(
                currentPassword: oldPassCtrl.text,
                newPassword: newPassCtrl.text,
              );
              nav.pop();
              messenger.showSnackBar(
                const SnackBar(content: Text('Password updated successfully!')),
              );
            },
            child: const Text('Update Password'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Confirm Sign Out', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to log out of your student portal session?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: LaasyaColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await SupabaseService().signOut();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const PortalLandingScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: LaasyaColors.primary));
    }

    final name = _profile?['full_name'] ?? 'Ananya Rao';
    final roll = _profile?['roll_number'] ?? 'LCA-10021';
    final phone = _profile?['phone'] ?? '+91 99123 45678';
    final parentName = _profile?['parent_name'] ?? 'Sri Ramesh Rao';
    final parentPhone = _profile?['parent_phone'] ?? '+91 99123 00001';
    final age = _profile?['age'] ?? 16;
    final gender = _profile?['gender'] ?? 'Female';
    final address = _profile?['address'] ?? 'No. 204, Gachibowli, Hyderabad';
    final course = _profile?['course'] ?? 'Bharathanatyam';
    final batch = _profile?['batch'] ?? 'Bharathanatyam - Batch A (Beginners)';
    final avatarUrl = _profile?['avatar_url'] as String?;

    // Fee attributes
    final totalFee = _profile?['total_monthly_fee'] ?? 2000;
    final advancePaid = _profile?['advance_paid'] ?? 1000;
    final dueAmount = _profile?['due_amount'] ?? 1000;
    final dueStatus = _profile?['due_status'] ?? 'yellow';

    Color dueBadgeBg;
    Color dueBadgeText;
    String dueLabel;

    if (dueStatus == 'green' || (dueAmount is num && dueAmount <= 0)) {
      dueBadgeBg = const Color(0xFFDEF7EC);
      dueBadgeText = const Color(0xFF03543F);
      dueLabel = 'Fee Cleared • No Dues';
    } else if (dueStatus == 'yellow' || (dueAmount is num && dueAmount < totalFee)) {
      dueBadgeBg = const Color(0xFFFEF3C7);
      dueBadgeText = const Color(0xFF92400E);
      dueLabel = 'Partial Paid: ₹$dueAmount Due';
    } else {
      dueBadgeBg = const Color(0xFFFDE8E8);
      dueBadgeText = const Color(0xFF9B1C1C);
      dueLabel = 'Tuition Due: ₹$dueAmount';
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // =================================================================
            // 1. EXECUTIVE DIGITAL STUDENT ID CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF8A064D), Color(0xFF590231)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.7), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.35),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.school_rounded, color: LaasyaColors.accentGold, size: 18),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'LAASYA CULTURAL ACADEMY',
                            style: TextStyle(
                              color: LaasyaColors.accentGold,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDEF7EC),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.verified_rounded, size: 12, color: Color(0xFF03543F)),
                            SizedBox(width: 4),
                            Text(
                              'VERIFIED STUDENT',
                              style: TextStyle(color: Color(0xFF03543F), fontSize: 9.5, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      // Avatar
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: LaasyaColors.accentGold, width: 2.2),
                          color: const Color(0xFF740340),
                        ),
                        child: ClipOval(
                          child: (avatarUrl != null && avatarUrl.isNotEmpty)
                              ? (avatarUrl.startsWith('data:')
                                  ? const Icon(Icons.person_rounded, color: Colors.white, size: 44)
                                  : Image.network(
                                      avatarUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.person_rounded, color: Colors.white, size: 44),
                                    ))
                              : const Icon(Icons.person_rounded, color: Colors.white, size: 44),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Roll No: $roll • $age Yrs ($gender)',
                              style: const TextStyle(color: LaasyaColors.accentGold, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              course,
                              style: const TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            Text(
                              'Batch: $batch',
                              style: const TextStyle(color: Colors.white60, fontSize: 10.5),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 2. DIRECTOR (ADMIN) EDITING PERMISSIONS NOTICE (RULE SATISFIED)
            // =================================================================
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF0D5E4)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF2F8),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFF0D5E4)),
                    ),
                    child: const Icon(Icons.admin_panel_settings_rounded, color: LaasyaColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Administrative Profile Control',
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Student profile data is maintained exclusively by the Academy Director. To request changes, please contact the academy office.',
                          style: TextStyle(fontSize: 10.5, color: Colors.black87, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 3. TUITION FEE & DUES STATUS CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF0D5E4)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.currency_rupee_rounded, color: LaasyaColors.primary, size: 20),
                          SizedBox(width: 6),
                          Text(
                            'Tuition Fee & Dues Status',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: dueBadgeBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          dueLabel,
                          style: TextStyle(color: dueBadgeText, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Monthly Fee', style: TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text('₹$totalFee', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Paid / Advance', style: TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text('₹$advancePaid', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Balance Due', style: TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text('₹$dueAmount', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: dueBadgeText)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 4. EVENT VIDEO LIBRARY (GOOGLE DRIVE LINKS)
            // =================================================================
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF590231), Color(0xFF8A064D)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.5)),
                            ),
                            child: const Icon(Icons.video_library_rounded, color: LaasyaColors.accentGold, size: 20),
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'Event Video Library',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDEF7EC),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'DRIVE VAULT',
                          style: TextStyle(color: Color(0xFF03543F), fontSize: 9.5, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Access official Google Drive event shoot folders, stage video recordings, and photography for your enrolled course ($course).',
                    style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: LaasyaColors.accentGold,
                        foregroundColor: const Color(0xFF4A0025),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => StudentVideoLibraryScreen(
                              studentCourse: course,
                              studentBatch: batch,
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.folder_shared_rounded, size: 18),
                      label: const Text(
                        'Open Video Library & Drive Links',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 5. PERSONAL & CONTACT DETAILS (READ ONLY)
            // =================================================================
            _sectionCard(
              title: 'Personal & Contact Information',
              children: [
                _infoRow(Icons.cake_outlined, 'Age & Gender', '$age Years • $gender'),
                _infoRow(Icons.phone_outlined, 'Student Mobile Phone', phone),
                _infoRow(Icons.location_on_outlined, 'Residential Address', address),
              ],
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 6. PARENT / GUARDIAN DETAILS
            // =================================================================
            _sectionCard(
              title: 'Parent & Guardian Information',
              children: [
                _infoRow(Icons.family_restroom_rounded, 'Parent / Guardian Name', parentName),
                _infoRow(Icons.contact_phone_outlined, 'Emergency Contact Phone', parentPhone),
              ],
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 7. SECURITY & SESSION SETTINGS
            // =================================================================
            _sectionCard(
              title: 'Account Security',
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.lock_reset_rounded, color: LaasyaColors.primary),
                  title: const Text('Change Password', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Update your personal login security password', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                  onTap: _showChangePasswordDialog,
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Secure Sign Out Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: LaasyaColors.error,
                  side: const BorderSide(color: LaasyaColors.error),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.logout_rounded, size: 18),
                label: const Text('Sign Out of Student Account', style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: _handleLogout,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _sectionCard({required String title, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF0D5E4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: LaasyaColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                const SizedBox(height: 1),
                Text(value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: LaasyaColors.textDark)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

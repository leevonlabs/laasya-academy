import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../auth/portal_landing_screen.dart';

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

  void _showEditProfileDialog() {
    final nameCtrl = TextEditingController(text: _profile?['full_name'] ?? '');
    final phoneCtrl = TextEditingController(text: _profile?['phone'] ?? '');
    final parentPhoneCtrl = TextEditingController(text: _profile?['parent_phone'] ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Edit Permitted Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Student Full Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneCtrl,
              decoration: const InputDecoration(labelText: 'Contact Phone Number'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: parentPhoneCtrl,
              decoration: const InputDecoration(labelText: 'Parent/Guardian Emergency Contact'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final nav = Navigator.of(ctx);
              final messenger = ScaffoldMessenger.of(context);
              await SupabaseService().updateProfile(
                fullName: nameCtrl.text.trim(),
                phone: phoneCtrl.text.trim(),
                emergencyContact: parentPhoneCtrl.text.trim(),
              );
              nav.pop();
              _loadProfile();
              messenger.showSnackBar(
                const SnackBar(content: Text('Profile details updated successfully!')),
              );
            },
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog() {
    final oldPassCtrl = TextEditingController();
    final newPassCtrl = TextEditingController();
    final confirmPassCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Change Password', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to log out of your student session?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: LaasyaColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Log Out'),
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
      return const Center(child: CircularProgressIndicator());
    }

    final name = _profile?['full_name'] ?? 'Ananya Rao';
    final roll = _profile?['roll_number'] ?? 'LCA-1';
    final phone = _profile?['phone'] ?? '+91 99123 45678';
    final parentName = _profile?['parent_name'] ?? 'Sri Ramesh Rao';
    final parentPhone = _profile?['parent_phone'] ?? '+91 99123 00001';
    final age = _profile?['age'] ?? 16;
    final gender = _profile?['gender'] ?? 'Female';
    final address = _profile?['address'] ?? 'No. 204, Gachibowli, Hyderabad';
    final course = _profile?['course'] ?? 'Bharathanatyam';
    final category = _profile?['course_category'] ?? 'Classical Dance';
    final batch = _profile?['batch'] ?? 'Bharathanatyam - Batch A (Beginners)';
    final room = _profile?['room_or_hall'] ?? 'Natya Mandapam (Room 101)';
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
      dueLabel = 'Fee Paid / No Due';
    } else if (dueStatus == 'yellow' || (dueAmount is num && dueAmount < totalFee)) {
      dueBadgeBg = const Color(0xFFFEF3C7);
      dueBadgeText = const Color(0xFF92400E);
      dueLabel = 'Partial Paid: ₹$dueAmount Due';
    } else {
      dueBadgeBg = const Color(0xFFFDE8E8);
      dueBadgeText = const Color(0xFF9B1C1C);
      dueLabel = 'Pending Due: ₹$dueAmount';
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // =================================================================
            // 1. DIGITAL STUDENT ID CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF8A064D), Color(0xFF590231)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.35),
                    blurRadius: 16,
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
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: LaasyaColors.accentGold, width: 1.5),
                            ),
                            child: ClipOval(
                              child: Image.asset('assets/images/crest_logo.png', fit: BoxFit.cover),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'LAASYA CULTURAL ACADEMY',
                                style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                              ),
                              Text(
                                'STUDENT IDENTITY CARD',
                                style: TextStyle(color: LaasyaColors.accentGold, fontSize: 9.5, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 36),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        width: 68,
                        height: 68,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: LaasyaColors.accentGold, width: 2.2),
                          color: const Color(0xFFD4AF37),
                        ),
                        child: ClipOval(
                          child: (avatarUrl != null && avatarUrl.isNotEmpty)
                              ? (avatarUrl.startsWith('data:') 
                                  ? const Icon(Icons.person, color: Colors.white, size: 40)
                                  : Image.network(
                                      avatarUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.person, color: Colors.white, size: 40),
                                    ))
                              : const Icon(Icons.person, color: Colors.white, size: 40),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Roll No: $roll • $age Yrs ($gender)',
                              style: const TextStyle(color: LaasyaColors.accentGold, fontSize: 12.5, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '$course ($category)',
                              style: const TextStyle(color: Colors.white70, fontSize: 11),
                            ),
                            Text(
                              '$batch • $room',
                              style: const TextStyle(color: Colors.white60, fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // =================================================================
            // 2. FEE STATUS & TUITION DUE SUMMARY
            // =================================================================
            Container(
              padding: const EdgeInsets.all(16),
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
                          Icon(Icons.currency_rupee_rounded, color: LaasyaColors.primary, size: 18),
                          SizedBox(width: 6),
                          Text(
                            'Tuition Fee & Dues Status',
                            style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
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
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Monthly Fee', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 2),
                              Text('₹$totalFee', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Paid / Advance', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 2),
                              Text('₹$advancePaid', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.green)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Balance Due', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 2),
                              Text('₹$dueAmount', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: dueBadgeText)),
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
            // 3. PERSONAL DETAILS CARD
            // =================================================================
            _sectionCard(
              title: 'Personal & Contact Details',
              trailing: TextButton.icon(
                icon: const Icon(Icons.edit_outlined, size: 16, color: LaasyaColors.primary),
                label: const Text('Edit', style: TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold)),
                onPressed: _showEditProfileDialog,
              ),
              children: [
                _infoRow(Icons.cake_outlined, 'Age & Gender', '$age Years • $gender'),
                _infoRow(Icons.phone_outlined, 'Student Mobile', phone),
                _infoRow(Icons.meeting_room_outlined, 'Assigned Room', room),
                _infoRow(Icons.location_on_outlined, 'Residence Address', address),
              ],
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 3. PARENT / GUARDIAN DETAILS
            // =================================================================
            _sectionCard(
              title: 'Parent / Guardian Contact',
              children: [
                _infoRow(Icons.family_restroom_rounded, 'Parent / Guardian Name', parentName),
                _infoRow(Icons.contact_phone_outlined, 'Emergency Contact', parentPhone),
              ],
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 4. SECURITY & SETTINGS
            // =================================================================
            _sectionCard(
              title: 'Account Security',
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.lock_reset_rounded, color: LaasyaColors.primary),
                  title: const Text('Change Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Update your personal login security credential', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                  onTap: _showChangePasswordDialog,
                ),
                const Divider(),
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.verified_user_outlined, color: Colors.green),
                  title: Text('Academy Verification Status', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: Text('Verified Academy Student • Active 2026 Batch', style: TextStyle(fontSize: 11)),
                  trailing: Icon(Icons.check_circle_rounded, color: Colors.green, size: 18),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Secure Logout Button
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
                label: const Text('Log Out of Student Account', style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: _handleLogout,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _sectionCard({required String title, Widget? trailing, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark)),
              if (trailing != null) trailing,
            ],
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 18, color: LaasyaColors.primary),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          const Spacer(),
          Text(val, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
        ],
      ),
    );
  }
}

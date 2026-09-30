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
    final roll = _profile?['roll_number'] ?? 'LCA-10021';
    final phone = _profile?['phone'] ?? '+91 99123 45678';
    final parentName = _profile?['parent_name'] ?? 'Sri Ramesh Rao';
    final parentPhone = _profile?['parent_phone'] ?? '+91 99123 00001';
    final age = _profile?['age'] ?? 16;
    final address = _profile?['address'] ?? 'No. 204, Gachibowli, Hyderabad';
    final course = _profile?['course'] ?? 'Bharathanatyam';
    final batch = _profile?['batch'] ?? 'Batch A (Beginners)';

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
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: LaasyaColors.accentGold, width: 2),
                          color: const Color(0xFFD4AF37),
                        ),
                        child: const Icon(Icons.person, color: Colors.white, size: 38),
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
                              'Roll No: $roll',
                              style: const TextStyle(color: LaasyaColors.accentGold, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$course • $batch',
                              style: const TextStyle(color: Colors.white70, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // =================================================================
            // 2. PERSONAL DETAILS CARD
            // =================================================================
            _sectionCard(
              title: 'Personal & Contact Details',
              trailing: TextButton.icon(
                icon: const Icon(Icons.edit_outlined, size: 16, color: LaasyaColors.primary),
                label: const Text('Edit', style: TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold)),
                onPressed: _showEditProfileDialog,
              ),
              children: [
                _infoRow(Icons.cake_outlined, 'Age', '$age Years'),
                _infoRow(Icons.phone_outlined, 'Student Mobile', phone),
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

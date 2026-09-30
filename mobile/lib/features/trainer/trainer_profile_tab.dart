import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../auth/portal_landing_screen.dart';

class TrainerProfileTab extends StatefulWidget {
  const TrainerProfileTab({super.key});

  @override
  State<TrainerProfileTab> createState() => _TrainerProfileTabState();
}

class _TrainerProfileTabState extends State<TrainerProfileTab> {
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
    final bioCtrl = TextEditingController(text: _profile?['specialization'] ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Edit Faculty Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Faculty Full Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneCtrl,
              decoration: const InputDecoration(labelText: 'Contact Phone Number'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: bioCtrl,
              decoration: const InputDecoration(labelText: 'Specialization / Bio'),
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
                bio: bioCtrl.text.trim(),
              );
              nav.pop();
              _loadProfile();
              messenger.showSnackBar(
                const SnackBar(content: Text('Faculty details updated successfully!')),
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
        content: const Text('Are you sure you want to log out of your faculty account?'),
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

    final name = _profile?['full_name'] ?? 'Guru Smt. Radhika Sharma';
    final email = _profile?['email'] ?? 'radhika.dance@laasyaacademy.com';
    final phone = _profile?['phone'] ?? '+91 98480 11111';
    final designation = _profile?['designation'] ?? 'Senior Guru & Choreographer';
    final specialization = _profile?['specialization'] ?? 'Bharathanatyam Classical Dance';

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // =================================================================
            // 1. GURU FACULTY CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF590231), Color(0xFF8A064D)],
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
                            width: 36,
                            height: 36,
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
                                'FACULTY PROFILE',
                                style: TextStyle(color: LaasyaColors.accentGold, fontSize: 9.5, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const Icon(Icons.verified_rounded, color: LaasyaColors.accentGold, size: 28),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        width: 66,
                        height: 66,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: LaasyaColors.accentGold, width: 2),
                          color: const Color(0xFFD4AF37),
                        ),
                        child: const Icon(Icons.person, color: Colors.white, size: 40),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              designation,
                              style: const TextStyle(color: LaasyaColors.accentGold, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              specialization,
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
            // 2. CONTACT DETAILS CARD
            // =================================================================
            _sectionCard(
              title: 'Faculty Contact Details',
              trailing: TextButton.icon(
                icon: const Icon(Icons.edit_outlined, size: 16, color: LaasyaColors.primary),
                label: const Text('Edit', style: TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold)),
                onPressed: _showEditProfileDialog,
              ),
              children: [
                _infoRow(Icons.email_outlined, 'Official Email', email),
                _infoRow(Icons.phone_outlined, 'Faculty Phone', phone),
                _infoRow(Icons.auto_stories_outlined, 'Discipline Focus', specialization),
              ],
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 3. ASSIGNED BATCHES SUMMARY
            // =================================================================
            _sectionCard(
              title: 'Teaching Responsibilities',
              children: [
                _infoRow(Icons.groups_rounded, 'Active Assigned Batches', '3 Batches'),
                _infoRow(Icons.school_rounded, 'Total Students Mentored', '42 Students'),
                _infoRow(Icons.location_city_rounded, 'Primary Studio Hall', 'Natya Mandapam (Room 101)'),
              ],
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 4. SECURITY & PASSWORDS
            // =================================================================
            _sectionCard(
              title: 'Faculty Security',
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.lock_reset_rounded, color: LaasyaColors.primary),
                  title: const Text('Change Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Update your faculty portal login password', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                  onTap: _showChangePasswordDialog,
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
                label: const Text('Log Out of Trainer Account', style: TextStyle(fontWeight: FontWeight.bold)),
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

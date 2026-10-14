import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../../core/widgets/laasya_avatar.dart';
import '../auth/portal_landing_screen.dart';
import 'student_profile_details_screen.dart';
import 'student_video_library_screen.dart';
import 'student_messages_screen.dart';
import 'student_payments_screen.dart';
import '../../core/services/alarm_service.dart';
import '../../core/services/permission_service.dart';
import '../../core/widgets/laasya_policy_dialog.dart';

class StudentSettingsTab extends StatefulWidget {
  const StudentSettingsTab({super.key});

  @override
  State<StudentSettingsTab> createState() => _StudentSettingsTabState();
}

class _StudentSettingsTabState extends State<StudentSettingsTab> {
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
            style: ElevatedButton.styleFrom(
              backgroundColor: LaasyaColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              if (newPassCtrl.text.trim().length < 6) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Password must be at least 6 characters')),
                );
                return;
              }
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
                const SnackBar(
                  content: Text('Password updated successfully!'),
                  backgroundColor: Color(0xFF03543F),
                ),
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
            style: ElevatedButton.styleFrom(
              backgroundColor: LaasyaColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AlarmService.stopBackgroundAlertService();
      await SupabaseService().signOut();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const PortalLandingScreen()),
        (route) => false,
      );
    }
  }

  Widget _buildAvatarWidget(String? avatarUrl, {double size = 60, VoidCallback? onTap}) {
    return LaasyaAvatar(
      avatarUrl: avatarUrl,
      size: size,
      onTap: onTap,
    );
  }

  void _showFullPhotoDialog(BuildContext context, String? avatarUrl, String name, String subtitle) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.92),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.4), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (subtitle.isNotEmpty)
                            Text(
                              subtitle,
                              style: const TextStyle(
                                color: LaasyaColors.accentGold,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white70, size: 24),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(color: Colors.white12, height: 1),
              ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
                child: Container(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.65,
                    minHeight: 280,
                  ),
                  width: double.infinity,
                  color: Colors.black,
                  child: InteractiveViewer(
                    minScale: 1.0,
                    maxScale: 3.5,
                    child: _buildFullPhotoWidget(avatarUrl),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFullPhotoWidget(String? avatarUrl) {
    if (avatarUrl != null && avatarUrl.trim().isNotEmpty) {
      final trimmed = avatarUrl.trim();
      if (trimmed.startsWith('data:image')) {
        try {
          final bytes = base64Decode(trimmed.split(',').last);
          return Image.memory(bytes, fit: BoxFit.contain, gaplessPlayback: true);
        } catch (_) {}
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return Image.network(
          trimmed,
          fit: BoxFit.contain,
          gaplessPlayback: true,
          loadingBuilder: (context, child, progress) {
            if (progress == null) return child;
            return const Center(child: CircularProgressIndicator(color: LaasyaColors.accentGold));
          },
          errorBuilder: (_, __, ___) => _buildPlaceholderPhoto(),
        );
      } else if (trimmed.startsWith('assets/')) {
        return Image.asset(trimmed, fit: BoxFit.contain, gaplessPlayback: true);
      }
    }
    return _buildPlaceholderPhoto();
  }

  Widget _buildPlaceholderPhoto() {
    return Container(
      padding: const EdgeInsets.all(32),
      color: const Color(0xFF590231),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 48,
            backgroundColor: Colors.white24,
            child: Icon(Icons.person_rounded, size: 54, color: Colors.white70),
          ),
          SizedBox(height: 12),
          Text(
            'Official Academy Profile Photo',
            style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: LaasyaColors.primary));
    }

    final name = _profile?['full_name'] ?? 'Aditi Sundaram';
    final roll = _profile?['roll_number'] ?? 'LCA-6';
    final course = _profile?['course'] ?? 'Bharathanatyam';
    final batch = _profile?['batch'] ?? 'Batch A (Beginners)';
    final avatarUrl = _profile?['avatar_url'] as String? ?? _profile?['photo_url'] as String? ?? _profile?['image_url'] as String?;

    return RefreshIndicator(
      onRefresh: _loadProfile,
      color: LaasyaColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. TOP STUDENT ACCOUNT SUMMARY CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF590231), Color(0xFF8A064D)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.25),
                    blurRadius: 14,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Avatar with golden border (Tap to view full length photo)
                  _buildAvatarWidget(
                    avatarUrl,
                    onTap: () => _showFullPhotoDialog(context, avatarUrl, name, '$roll • $course'),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.4)),
                          ),
                          child: const Text(
                            'STUDENT PORTAL SETTINGS',
                            style: TextStyle(
                              color: LaasyaColors.accentGold,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Roll No: $roll • $course',
                          style: const TextStyle(color: Colors.white70, fontSize: 11.5),
                        ),
                        Text(
                          batch,
                          style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // =================================================================
            // 2. SETTINGS SECTION: ACCOUNT & ACADEMICS
            // =================================================================
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                'ACCOUNT & ACADEMIC SERVICES',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: Color(0xFF8A064D),
                ),
              ),
            ),
            const SizedBox(height: 10),

            Container(
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
                children: [
                  // 1. Profile Option
                  _settingsTile(
                    icon: Icons.person_rounded,
                    iconBg: const Color(0xFFFFF2F8),
                    iconColor: LaasyaColors.primary,
                    title: 'Profile',
                    subtitle: 'Digital Student ID Card, personal & guardian details',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => StudentProfileDetailsScreen(initialProfile: _profile),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1, indent: 64),

                  // 2. Video Library Option
                  _settingsTile(
                    icon: Icons.video_library_rounded,
                    iconBg: const Color(0xFFFEF3C7),
                    iconColor: const Color(0xFF92400E),
                    title: 'Video Library',
                    subtitle: 'Official event shoot Google Drive vaults & footage',
                    badgeText: SupabaseService().getUnreadVideosCount() > 0
                        ? '${SupabaseService().getUnreadVideosCount()}'
                        : null,
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => StudentVideoLibraryScreen(
                            studentCourse: course,
                            studentBatch: batch,
                          ),
                        ),
                      );
                      setState(() {});
                    },
                  ),
                  const Divider(height: 1, indent: 64),

                  // 3. Messages Option (Official Broadcast Channel)
                  _settingsTile(
                    icon: Icons.chat_bubble_rounded,
                    iconBg: const Color(0xFFDEF7EC),
                    iconColor: const Color(0xFF075E54),
                    title: 'Messages',
                    subtitle: 'Official academy notices, circulars & announcements',
                    badgeText: SupabaseService().getUnreadMessagesCount() > 0
                        ? '${SupabaseService().getUnreadMessagesCount()}'
                        : null,
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const StudentMessagesScreen(),
                        ),
                      );
                      setState(() {});
                    },
                  ),
                  const Divider(height: 1, indent: 64),

                  // 4. Payments Option (Includes all payments done with invoice download)
                  _settingsTile(
                    icon: Icons.receipt_long_rounded,
                    iconBg: const Color(0xFFDEF7EC),
                    iconColor: const Color(0xFF03543F),
                    title: 'Payments',
                    subtitle: 'Payment history, fee receipts & invoice download (PDF)',
                    badgeText: 'INVOICES',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => StudentPaymentsScreen(studentProfile: _profile),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // =================================================================
            // 3. SETTINGS SECTION: SECURITY & PREFERENCES
            // =================================================================
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                'SECURITY & PREFERENCES',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: Color(0xFF8A064D),
                ),
              ),
            ),
            const SizedBox(height: 10),

            Container(
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
                children: [
                  // 1. App Permissions Management
                  _settingsTile(
                    icon: Icons.security_rounded,
                    iconBg: const Color(0xFFDEF7EC),
                    iconColor: const Color(0xFF03543F),
                    title: 'App Permissions',
                    subtitle: 'Notifications, alarms, battery & camera access',
                    onTap: () => PermissionService.showPermissionsDialog(context),
                  ),
                  const Divider(height: 1, indent: 64),

                  // 2. Change Password Option
                  _settingsTile(
                    icon: Icons.lock_reset_rounded,
                    iconBg: const Color(0xFFE1EFFE),
                    iconColor: const Color(0xFF1E429F),
                    title: 'Change Password',
                    subtitle: 'Update your student account login credentials',
                    onTap: _showChangePasswordDialog,
                  ),
                  const Divider(height: 1, indent: 64),

                  // 3. Privacy Policy Option
                  _settingsTile(
                    icon: Icons.privacy_tip_rounded,
                    iconBg: const Color(0xFFF3E8FF),
                    iconColor: const Color(0xFF6B21A8),
                    title: 'Privacy Policy',
                    subtitle: 'Child safety, data protection & pickup chimes disclosure',
                    onTap: () => LaasyaPolicyDialog.showPrivacy(context),
                  ),
                  const Divider(height: 1, indent: 64),

                  // 4. Terms & Conditions Option
                  _settingsTile(
                    icon: Icons.gavel_rounded,
                    iconBg: const Color(0xFFFEF3C7),
                    iconColor: const Color(0xFF92400E),
                    title: 'Terms & Conditions',
                    subtitle: 'Academy rules, attendance policies & disciple guidelines',
                    onTap: () => LaasyaPolicyDialog.showTerms(context),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // =================================================================
            // 4. SIGN OUT BUTTON (PROMINENT ACTION)
            // =================================================================
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: LaasyaColors.error,
                  side: const BorderSide(color: Color(0xFFF8B4B4), width: 1.3),
                  backgroundColor: const Color(0xFFFDF2F2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.logout_rounded, size: 19),
                label: const Text(
                  'Sign Out of Student Account',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                ),
                onPressed: _handleLogout,
              ),
            ),

            const SizedBox(height: 20),

            // Academy Version Footer
            Center(
              child: Column(
                children: [
                  Text(
                    'Laasya Cultural Academy • Student Mobile Portal',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'v2.4.0 • Built with Impeccable Design System',
                    style: TextStyle(fontSize: 10, color: Colors.grey.shade400),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _settingsTile({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    String? badgeText,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.bold,
                          color: LaasyaColors.textDark,
                        ),
                      ),
                      if (badgeText != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDEF7EC),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            badgeText,
                            style: const TextStyle(
                              color: Color(0xFF03543F),
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: Colors.black54,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}

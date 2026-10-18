import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../../core/widgets/laasya_avatar.dart';
import '../auth/portal_landing_screen.dart';
import '../student/student_messages_screen.dart';
import '../student/student_video_library_screen.dart';
import 'trainer_announcements_screen.dart';
import 'trainer_profile_details_screen.dart';
import 'trainer_salaries_screen.dart';
import 'trainer_share_video_screen.dart';
import '../../core/services/alarm_service.dart';
import '../../core/services/permission_service.dart';
import '../../core/widgets/laasya_policy_dialog.dart';
import '../settings/support_screen.dart';

class TrainerSettingsTab extends StatefulWidget {
  const TrainerSettingsTab({super.key});

  @override
  State<TrainerSettingsTab> createState() => _TrainerSettingsTabState();
}

class _TrainerSettingsTabState extends State<TrainerSettingsTab> {
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
        content: const Text('Are you sure you want to log out of your Guru portal session?'),
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
          return Image.memory(bytes, fit: BoxFit.contain);
        } catch (_) {}
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return Image.network(
          trimmed,
          fit: BoxFit.contain,
          loadingBuilder: (context, child, progress) {
            if (progress == null) return child;
            return const Center(child: CircularProgressIndicator(color: LaasyaColors.accentGold));
          },
          errorBuilder: (_, __, ___) => _buildPlaceholderPhoto(),
        );
      } else if (trimmed.startsWith('assets/')) {
        return Image.asset(trimmed, fit: BoxFit.contain);
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
            'Official Academy Faculty Profile Photo',
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

    final name = _profile?['full_name'] ?? 'Smt. Anusha Sumesh';
    final designation = _profile?['designation'] ?? 'Founder & Head Guru';
    final specialization = _profile?['specialization'] ?? 'Bharatanatyam Classical Dance';
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
            // Top Faculty Account Summary Card
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
                    onTap: () => _showFullPhotoDialog(context, avatarUrl, name, '$designation • $specialization'),
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
                            'GURU FACULTY SETTINGS',
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
                          designation,
                          style: const TextStyle(color: Colors.white70, fontSize: 11.5),
                        ),
                        Text(
                          specialization,
                          style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Settings Section: Services & Payroll
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                'FACULTY & ACADEMIC SERVICES',
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
                    title: 'Guru Profile',
                    subtitle: 'Master Faculty ID Card, discipline & assignment info',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TrainerProfileDetailsScreen(initialProfile: _profile),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1, indent: 64),

                  // 2. Announcements Broadcasts (Faculty Broadcasts to assigned courses/batches)
                  _settingsTile(
                    icon: Icons.campaign_rounded,
                    iconBg: const Color(0xFFE8F5E9),
                    iconColor: const Color(0xFF2E7D32),
                    title: 'Announcements',
                    subtitle: 'Broadcast notices & circulars to your enrolled students',
                    badgeText: 'BROADCAST',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TrainerAnnouncementsScreen(trainerProfile: _profile),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1, indent: 64),

                  // 3. Share Video (Share YouTube / Drive links with enrolled students)
                  _settingsTile(
                    icon: Icons.video_call_rounded,
                    iconBg: const Color(0xFFFCE7F3),
                    iconColor: const Color(0xFF9D174D),
                    title: 'Share Video',
                    subtitle: 'Share YouTube & Drive links with your enrolled batches',
                    badgeText: 'MEDIA SHARE',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TrainerShareVideoScreen(trainerProfile: _profile),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1, indent: 64),

                  // 4. Video Library Option (View Academy Wide Vaults)
                  _settingsTile(
                    icon: Icons.video_library_rounded,
                    iconBg: const Color(0xFFFEF3C7),
                    iconColor: const Color(0xFF92400E),
                    title: 'Video Library',
                    subtitle: 'Academy event shoot Google Drive vaults & footage',
                    badgeText: SupabaseService().getUnreadVideosCount() > 0
                        ? '${SupabaseService().getUnreadVideosCount()}'
                        : null,
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => StudentVideoLibraryScreen(
                            studentCourse: specialization,
                            studentBatch: 'All Batches',
                            isTrainer: true,
                          ),
                        ),
                      );
                      setState(() {});
                    },
                  ),
                  const Divider(height: 1, indent: 64),

                  // 5. Pay Slips
                  _settingsTile(
                    icon: Icons.receipt_long_rounded,
                    iconBg: const Color(0xFFDEF7EC),
                    iconColor: const Color(0xFF03543F),
                    title: 'Pay Slips',
                    subtitle: 'Monthly salary disbursements & downloadable pay slips (PDF)',
                    badgeText: null,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TrainerSalariesScreen(trainerProfile: _profile),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1, indent: 64),

                  // 6. Messages
                  _settingsTile(
                    icon: Icons.chat_bubble_rounded,
                    iconBg: const Color(0xFFE8F4FD),
                    iconColor: const Color(0xFF0284C7),
                    title: 'Messages',
                    subtitle: 'Official broadcasts, parent circulars & academy notices',
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

                  // 7. Support & Academy Helpdesk
                  _settingsTile(
                    icon: Icons.contact_support_rounded,
                    iconBg: const Color(0xFFFCE7F3),
                    iconColor: const Color(0xFF8A064D),
                    title: 'Support & Helpdesk',
                    subtitle: 'Campus contacts, director email & Google Maps location',
                    badgeText: 'HELP',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const SupportScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Security Section
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
                    subtitle: 'Notifications and camera access',
                    onTap: () => PermissionService.showPermissionsDialog(context),
                  ),
                  const Divider(height: 1, indent: 64),

                  // 2. Change Password Option
                  _settingsTile(
                    icon: Icons.lock_reset_rounded,
                    iconBg: const Color(0xFFE1EFFE),
                    iconColor: const Color(0xFF1E429F),
                    title: 'Change Password',
                    subtitle: 'Update your faculty account login credentials',
                    onTap: _showChangePasswordDialog,
                  ),
                  const Divider(height: 1, indent: 64),

                  // 3. Privacy Policy & Terms & Conditions Option (Single combined button)
                  _settingsTile(
                    icon: Icons.verified_user_rounded,
                    iconBg: const Color(0xFFF3E8FF),
                    iconColor: const Color(0xFF6B21A8),
                    title: 'Privacy Policy & Terms',
                    subtitle: 'Child safety, data protection, terms of service & academy guidelines',
                    onTap: () => LaasyaPolicyDialog.showPrivacy(context),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Sign Out Button
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
                  'Sign Out of Guru Account',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                ),
                onPressed: _handleLogout,
              ),
            ),

            const SizedBox(height: 20),

            Center(
              child: Column(
                children: [
                  Text(
                    'Laasya Cultural Academy • Faculty Portal',
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

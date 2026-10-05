import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentProfileDetailsScreen extends StatefulWidget {
  final Map<String, dynamic>? initialProfile;

  const StudentProfileDetailsScreen({
    super.key,
    this.initialProfile,
  });

  @override
  State<StudentProfileDetailsScreen> createState() => _StudentProfileDetailsScreenState();
}

class _StudentProfileDetailsScreenState extends State<StudentProfileDetailsScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _profile = widget.initialProfile;
    if (_profile == null) {
      _loadProfile();
    } else {
      _isLoading = false;
    }
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFFBF8FA),
        body: Center(child: CircularProgressIndicator(color: LaasyaColors.primary)),
      );
    }

    final name = _profile?['full_name'] ?? 'Aditi Sundaram';
    final roll = _profile?['roll_number'] ?? 'LCA-6';
    final phone = _profile?['phone'] ?? '+91 98450 12345';
    final parentName = _profile?['parent_name'] ?? 'Sri Sundaram V.';
    final parentPhone = _profile?['parent_phone'] ?? '+91 98450 00006';
    final age = _profile?['age'] ?? 16;
    final gender = _profile?['gender'] ?? 'Female';
    final address = _profile?['address'] ?? 'Flat 402, Shanthi Vihar, Bangalore';
    final course = _profile?['course'] ?? 'Bharathanatyam';
    final batch = _profile?['batch'] ?? 'Bharathanatyam - Batch A (Beginners)';
    final avatarUrl = _profile?['avatar_url'] as String?;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Student Profile & ID',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
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
                  // Top Academy Branding
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
                              batch,
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
            // 2. DIRECTOR (ADMIN) EDITING PERMISSIONS NOTICE
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
            // 3. PERSONAL & CONTACT DETAILS
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
            // 4. PARENT / GUARDIAN DETAILS
            // =================================================================
            _sectionCard(
              title: 'Parent & Guardian Information',
              children: [
                _infoRow(Icons.family_restroom_rounded, 'Parent / Guardian Name', parentName),
                _infoRow(Icons.contact_phone_outlined, 'Emergency Contact Phone', parentPhone),
              ],
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

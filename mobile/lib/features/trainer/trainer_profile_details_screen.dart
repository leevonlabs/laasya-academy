import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class TrainerProfileDetailsScreen extends StatefulWidget {
  final Map<String, dynamic>? initialProfile;

  const TrainerProfileDetailsScreen({
    super.key,
    this.initialProfile,
  });

  @override
  State<TrainerProfileDetailsScreen> createState() => _TrainerProfileDetailsScreenState();
}

class _TrainerProfileDetailsScreenState extends State<TrainerProfileDetailsScreen> {
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

    final name = _profile?['full_name'] ?? 'Smt. Anusha Sumesh';
    final email = _profile?['email'] ?? 'anusha@laasyaacademy.com';
    final phone = _profile?['phone'] ?? '+91 98765 00004';
    final specialization = _profile?['specialization'] ?? 'Bharatanatyam Classical Dance';
    final designation = _profile?['designation'] ?? 'Founder & Head Guru (Guruvayoor Arangetram)';
    final age = _profile?['age'] ?? 36;
    final gender = _profile?['gender'] ?? 'Female';
    final room = _profile?['assigned_room'] ?? 'Natya Mandapam (Room 101)';
    final avatarUrl = _profile?['avatar_url'] as String?;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Faculty Guru Profile & ID',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Master Faculty ID Card
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
                              'VERIFIED GURU',
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
                                  ? const Icon(Icons.person, color: Colors.white, size: 44)
                                  : Image.network(
                                      avatarUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.person, color: Colors.white, size: 44),
                                    ))
                              : const Icon(Icons.person, color: Colors.white, size: 44),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(color: Colors.white, fontSize: 18.5, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              designation,
                              style: const TextStyle(color: LaasyaColors.accentGold, fontSize: 11.5, fontWeight: FontWeight.bold),
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

            const SizedBox(height: 16),

            // Administrative Faculty Record Notice
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
              child: const Row(
                children: [
                  Icon(Icons.admin_panel_settings_rounded, color: LaasyaColors.primary, size: 22),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Administrative Faculty Credential',
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Faculty profile details, assigned rooms, and compensation rates are managed exclusively by the Academy Director.',
                          style: TextStyle(fontSize: 10.5, color: Colors.black87, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Contact & Discipline Details
            _sectionCard(
              title: 'Faculty Contact & Assignment Details',
              children: [
                _infoRow(Icons.phone_outlined, 'Official Mobile Phone', phone),
                _infoRow(Icons.email_outlined, 'Academy Email', email),
                _infoRow(Icons.meeting_room_outlined, 'Assigned Rehearsal Room', room),
                _infoRow(Icons.cake_outlined, 'Age & Gender', '$age Years • $gender'),
              ],
            ),

            const SizedBox(height: 14),

            // Artistic Bio
            _sectionCard(
              title: 'Artistic Credentials & Profile Bio',
              children: [
                Text(
                  'Renowned practitioner and revered guru of $specialization. Conducts foundational adavus, abhinaya masterclasses, and stage choreographies for disciples across beginner, intermediate, and advanced arangetram batches.',
                  style: const TextStyle(fontSize: 12.5, color: Colors.black87, height: 1.45),
                ),
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

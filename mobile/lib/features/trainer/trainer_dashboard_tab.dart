import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class TrainerDashboardTab extends StatefulWidget {
  final VoidCallback onNavigateToClasses;
  final VoidCallback onNavigateToStudents;
  final VoidCallback onNavigateToAttendance;

  const TrainerDashboardTab({
    super.key,
    required this.onNavigateToClasses,
    required this.onNavigateToStudents,
    required this.onNavigateToAttendance,
  });

  @override
  State<TrainerDashboardTab> createState() => _TrainerDashboardTabState();
}

class _TrainerDashboardTabState extends State<TrainerDashboardTab> {
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _todaySessions = [];
  List<Map<String, dynamic>> _batches = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final prof = await SupabaseService().getCurrentUserProfile();
    final sess = await SupabaseService().getTrainerTodaySessions();
    final btc = await SupabaseService().getTrainerBatches();

    if (mounted) {
      setState(() {
        _profile = prof;
        _todaySessions = sess;
        _batches = btc;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final name = _profile?['full_name'] ?? 'Smt. Anusha Sumesh';
    final designation = _profile?['designation'] ?? 'Head Guru & Choreographer';
    final specialization = _profile?['specialization'] ?? 'Bharatanatyam Classical Dance';
    final age = _profile?['age'] ?? 36;
    final gender = _profile?['gender'] ?? 'Female';
    final avatarUrl = _profile?['avatar_url'] as String?;
    final monthlySalary = _profile?['monthly_salary'] ?? 45000;
    final salaryPaymentStatus = (_profile?['salary_payment_status'] ?? 'paid').toString().toLowerCase();
    final bool isPaid = salaryPaymentStatus == 'paid';
    final batchCount = _profile?['assigned_batches_count'] ?? _batches.length;
    final studentCount = _profile?['total_students_count'] ?? 42;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. GURU WELCOME PROFILE CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF590231), Color(0xFF8A064D)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 62,
                    height: 62,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: LaasyaColors.accentGold, width: 2.5),
                      color: const Color(0xFFD4AF37),
                    ),
                    child: ClipOval(
                      child: (avatarUrl != null && avatarUrl.isNotEmpty)
                          ? (avatarUrl.startsWith('data:')
                              ? const Icon(Icons.person, color: Colors.white, size: 36)
                              : Image.network(
                                  avatarUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Icon(Icons.person, color: Colors.white, size: 36),
                                ))
                          : const Icon(Icons.person, color: Colors.white, size: 36),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Guru Portal',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '$designation • $specialization • $age Yrs ($gender)',
                          style: const TextStyle(
                            color: LaasyaColors.accentGold,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                              decoration: BoxDecoration(
                                color: isPaid ? const Color(0xFF03543F).withOpacity(0.4) : const Color(0xFF9B1C1C).withOpacity(0.4),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isPaid ? const Color(0xFF31C48D) : const Color(0xFFF98080),
                                  width: 0.8,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isPaid ? Icons.check_circle_rounded : Icons.pending_actions_rounded,
                                    size: 11,
                                    color: isPaid ? const Color(0xFFBCF0DA) : const Color(0xFFFFD2D2),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '₹$monthlySalary/mo • ${isPaid ? "Salary Paid" : "Pending"}',
                                    style: TextStyle(
                                      color: isPaid ? const Color(0xFFBCF0DA) : const Color(0xFFFFD2D2),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // =================================================================
            // 2. METRIC KPI SUMMARY ROW
            // =================================================================
            Row(
              children: [
                Expanded(
                  child: _kpiCard(
                    title: 'Assigned Batches',
                    value: '$batchCount Batches',
                    icon: Icons.groups_rounded,
                    color: LaasyaColors.primary,
                    onTap: widget.onNavigateToClasses,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _kpiCard(
                    title: 'Total Students',
                    value: '$studentCount Enrolled',
                    icon: Icons.school_rounded,
                    color: const Color(0xFF03543F),
                    onTap: widget.onNavigateToStudents,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _kpiCard(
                    title: 'Today Attendance',
                    value: '94% Present',
                    icon: Icons.check_circle_rounded,
                    color: const Color(0xFFB45309),
                    onTap: widget.onNavigateToAttendance,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 22),

            // =================================================================
            // 3. TODAY'S SCHEDULED SESSIONS & ACTIVE PIN
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Today\'s Class Sessions',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                ),
                GestureDetector(
                  onTap: widget.onNavigateToAttendance,
                  child: const Text(
                    'Manage Attendance →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (_todaySessions.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: const Text('No classes scheduled for today.'),
              )
            else
              ..._todaySessions.map((sess) {
                final batch = sess['batches'];
                final pin = sess['check_in_code'] ?? '482910';

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF0D5E4)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3E8EE),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              batch?['courses']?['title'] ?? 'Bharathanatyam',
                              style: const TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFFDE68A)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.key_rounded, size: 13, color: Color(0xFF92400E)),
                                const SizedBox(width: 4),
                                Text(
                                  'Active PIN: $pin',
                                  style: const TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.bold, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        batch?['name'] ?? 'Bharathanatyam - Batch A',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Room: ${batch?['room_or_hall']} • Time: ${sess['start_time']} - ${sess['end_time']}',
                        style: const TextStyle(fontSize: 12, color: LaasyaColors.textMuted),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: widget.onNavigateToAttendance,
                              icon: const Icon(Icons.playlist_add_check_rounded, size: 18),
                              label: const Text('Start & Take Attendance', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }),

            const SizedBox(height: 20),

            // =================================================================
            // 4. ASSIGNED COURSES & BATCHES OVERVIEW
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Assigned Batches & Capacity',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                ),
                GestureDetector(
                  onTap: widget.onNavigateToClasses,
                  child: const Text(
                    'All Classes →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            ..._batches.take(2).map((b) {
              final enrolled = b['enrolled_count'] ?? 14;
              final maxCap = b['max_capacity'] ?? 20;
              final pct = enrolled / maxCap;

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      b['name']!,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${b['room_or_hall']} • ${b['start_time']} - ${b['end_time']}',
                      style: const TextStyle(fontSize: 11.5, color: LaasyaColors.textMuted),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: pct,
                              backgroundColor: Colors.grey.shade200,
                              color: LaasyaColors.primary,
                              minHeight: 6,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          '$enrolled / $maxCap Students',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _kpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(fontSize: 10, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }
}

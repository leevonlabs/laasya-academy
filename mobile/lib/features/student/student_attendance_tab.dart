import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentAttendanceTab extends StatefulWidget {
  const StudentAttendanceTab({super.key});

  @override
  State<StudentAttendanceTab> createState() => _StudentAttendanceTabState();
}

class _StudentAttendanceTabState extends State<StudentAttendanceTab> {
  List<Map<String, dynamic>> _attendanceHistory = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    final history = await SupabaseService().getStudentAttendanceHistory();
    if (mounted) {
      setState(() {
        _attendanceHistory = history;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalClasses = _attendanceHistory.length;
    final presentCount = _attendanceHistory.where((a) => a['status'] == 'present').length;
    final lateCount = _attendanceHistory.where((a) => a['status'] == 'late').length;
    final absentCount = _attendanceHistory.where((a) => a['status'] == 'absent').length;
    final rate = totalClasses == 0 ? 100.0 : ((presentCount + (lateCount * 0.5)) / totalClasses * 100);

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : RefreshIndicator(
              onRefresh: _loadHistory,
              color: LaasyaColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ===========================================================
                    // 1. MONTHLY ATTENDANCE SUMMARY CARD
                    // ===========================================================
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF590231), Color(0xFF8A064D)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.5), width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: LaasyaColors.primaryDark.withOpacity(0.3),
                            blurRadius: 14,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Attendance Overview',
                                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.3),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6)),
                                ),
                                child: const Text(
                                  'Academic Year 2026',
                                  style: TextStyle(color: LaasyaColors.accentGold, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),
                          Row(
                            children: [
                              // Circular Percentage Display
                              Container(
                                width: 76,
                                height: 76,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: LaasyaColors.accentGold, width: 4.5),
                                ),
                                child: Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        '${rate.toStringAsFixed(0)}%',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 19,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const Text(
                                        'Present',
                                        style: TextStyle(color: LaasyaColors.accentGold, fontSize: 9, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 18),
                              Expanded(
                                child: Column(
                                  children: [
                                    _metricStat('Present Sessions', '$presentCount classes', const Color(0xFFDEF7EC), const Color(0xFF03543F)),
                                    const SizedBox(height: 6),
                                    _metricStat('Late Arrivals', '$lateCount classes', const Color(0xFFFEF08A), const Color(0xFF854D0E)),
                                    const SizedBox(height: 6),
                                    _metricStat('Absent', '$absentCount classes', const Color(0xFFFDE8E8), const Color(0xFF991B1B)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // ===========================================================
                    // 2. GURU-MANAGED ATTENDANCE POLICY CARD (NO SELF-MARKING)
                    // ===========================================================
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
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF2F8),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFF0D5E4)),
                            ),
                            child: const Icon(Icons.verified_user_rounded, color: LaasyaColors.primary, size: 22),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Trainer-Managed Attendance',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Class attendance is marked and verified directly by your Guru/Trainer during class roll-call. Students cannot self-mark or modify attendance.',
                                  style: TextStyle(fontSize: 11.5, color: Colors.black87, height: 1.4),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF03543F)),
                                      SizedBox(width: 4),
                                      Text(
                                        'Official Academy Roll-Call System',
                                        style: TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 22),

                    // ===========================================================
                    // 3. DETAILED ATTENDANCE AUDIT HISTORY
                    // ===========================================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Class Attendance Records',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        Text(
                          '$totalClasses Sessions Logged',
                          style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    if (_attendanceHistory.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.fact_check_outlined, size: 40, color: Colors.grey),
                            SizedBox(height: 10),
                            Text(
                              'No attendance entries recorded yet.',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Your Guru will record attendance when classes commence.',
                              style: TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _attendanceHistory.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = _attendanceHistory[index];
                          final status = (item['status'] ?? 'present').toString().toLowerCase();

                          Color badgeColor;
                          Color badgeText;
                          IconData statusIcon;
                          String statusLabel;

                          if (status == 'present') {
                            badgeColor = const Color(0xFFDEF7EC);
                            badgeText = const Color(0xFF03543F);
                            statusIcon = Icons.check_circle_rounded;
                            statusLabel = 'Present';
                          } else if (status == 'late') {
                            badgeColor = const Color(0xFFFEF08A);
                            badgeText = const Color(0xFF854D0E);
                            statusIcon = Icons.schedule_rounded;
                            statusLabel = 'Late';
                          } else {
                            badgeColor = const Color(0xFFFDE8E8);
                            badgeText = const Color(0xFF991B1B);
                            statusIcon = Icons.cancel_rounded;
                            statusLabel = 'Absent';
                          }

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFF0D5E4)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: badgeColor,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(statusIcon, color: badgeText, size: 20),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item['course'] ?? 'Classical Dance Batch',
                                        style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        '${item['date']} • ${item['time'] ?? 'Regular Batch'}',
                                        style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Verified by ${item['trainer'] ?? 'Class Guru'}',
                                        style: const TextStyle(fontSize: 10.5, color: LaasyaColors.primary, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: badgeColor,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    statusLabel,
                                    style: TextStyle(color: badgeText, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _metricStat(String label, String value, Color bgColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 11, color: textColor, fontWeight: FontWeight.w600)),
          Text(value, style: TextStyle(fontSize: 11, color: textColor, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentDashboardTab extends StatefulWidget {
  final VoidCallback onNavigateToCourses;
  final VoidCallback onNavigateToSchedule;
  final VoidCallback onNavigateToCheckIn;

  const StudentDashboardTab({
    super.key,
    required this.onNavigateToCourses,
    required this.onNavigateToSchedule,
    required this.onNavigateToCheckIn,
  });

  @override
  State<StudentDashboardTab> createState() => _StudentDashboardTabState();
}

class _StudentDashboardTabState extends State<StudentDashboardTab> {
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _courses = [];
  List<Map<String, dynamic>> _schedule = [];
  List<Map<String, dynamic>> _attendance = [];
  List<Map<String, dynamic>> _announcements = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final prof = await SupabaseService().getCurrentUserProfile();
    final crs = await SupabaseService().getStudentEnrolledCourses();
    final sch = await SupabaseService().getStudentSchedule();
    final att = await SupabaseService().getStudentAttendanceHistory();
    final notifs = await SupabaseService().getNotifications();

    if (mounted) {
      setState(() {
        _profile = prof;
        _courses = crs;
        _schedule = sch;
        _attendance = att;
        _announcements = notifs.where((n) => n['type'] == 'announcement').toList();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final name = _profile?['full_name'] ?? 'Ananya Rao';
    final roll = _profile?['roll_number'] ?? 'LCA-10021';
    final todaySchedule = _schedule.where((s) => s['is_today'] == true).toList();

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. STUDENT PROFILE WELCOME HERO CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [LaasyaColors.primaryDark, LaasyaColors.primary],
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
                  // Student Avatar
                  Container(
                    width: 62,
                    height: 62,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: LaasyaColors.accentGold, width: 2.5),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const CircleAvatar(
                      backgroundColor: Color(0xFFD4AF37),
                      child: Icon(Icons.person, size: 36, color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Welcome back,',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.5)),
                          ),
                          child: Text(
                            'Roll No: $roll • Active Learner',
                            style: const TextStyle(
                              color: LaasyaColors.accentGold,
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // =================================================================
            // 2. TODAY'S CLASS SCHEDULE BANNER (with Check-in Action)
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Today\'s Class Schedule',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                ),
                GestureDetector(
                  onTap: widget.onNavigateToSchedule,
                  child: const Text(
                    'Full Timetable →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (todaySchedule.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.event_available_rounded, color: Colors.green, size: 24),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'No classes scheduled for today. Enjoy your practice session!',
                        style: TextStyle(fontSize: 12, color: Colors.black87),
                      ),
                    ),
                  ],
                ),
              )
            else
              ...todaySchedule.map((sch) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFF0D5E4)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: LaasyaColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.access_time_filled_rounded, color: LaasyaColors.primary, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  sch['course']!,
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${sch['batch']} • ${sch['trainer']}',
                                  style: const TextStyle(fontSize: 11.5, color: LaasyaColors.textMuted),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    const Icon(Icons.room_rounded, color: LaasyaColors.primary, size: 13),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${sch['room']} • ${sch['time']}',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: ElevatedButton.icon(
                          onPressed: widget.onNavigateToCheckIn,
                          icon: const Icon(Icons.pin_outlined, size: 18, color: Colors.black),
                          label: const Text(
                            'Check In for This Class (Enter PIN)',
                            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: LaasyaColors.accentGold,
                            foregroundColor: Colors.black,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),

            const SizedBox(height: 20),

            // =================================================================
            // 3. ENROLLED COURSES CAROUSEL
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Enrolled Courses',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                ),
                GestureDetector(
                  onTap: widget.onNavigateToCourses,
                  child: const Text(
                    'View All →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _courses.map((c) {
                  return Container(
                    width: 260,
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFF0D5E4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3E8EE),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                c['category']!,
                                style: const TextStyle(color: LaasyaColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDEF7EC),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                c['status']!,
                                style: const TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          c['title']!,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        Text(
                          c['telugu_name']!,
                          style: const TextStyle(fontSize: 12, color: LaasyaColors.primary, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Guru: ${c['trainer_name']}',
                          style: const TextStyle(fontSize: 11.5, color: LaasyaColors.textMuted),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: (c['attendance_rate'] as int) / 100,
                                  backgroundColor: Colors.grey.shade200,
                                  color: LaasyaColors.primary,
                                  minHeight: 6,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${c['attendance_rate']}% Attendance',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 24),

            // =================================================================
            // 4. RECENT ATTENDANCE & STATUS
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Attendance History',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                ),
                GestureDetector(
                  onTap: widget.onNavigateToCheckIn,
                  child: const Text(
                    'Full Record →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            ..._attendance.take(3).map((att) {
              final isPresent = att['status'] == 'present';
              final isLate = att['status'] == 'late';
              Color badgeBg = isPresent ? const Color(0xFFDEF7EC) : (isLate ? const Color(0xFFFEF08A) : const Color(0xFFFDE8E8));
              Color badgeText = isPresent ? const Color(0xFF03543F) : (isLate ? const Color(0xFF854D0E) : const Color(0xFF9B1C1C));

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    Icon(
                      isPresent ? Icons.check_circle_rounded : (isLate ? Icons.alarm_on_rounded : Icons.cancel_rounded),
                      color: badgeText,
                      size: 22,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            att['course_title']!,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                          ),
                          Text(
                            '${att['date']} • ${att['time']}',
                            style: const TextStyle(fontSize: 11, color: LaasyaColors.textMuted),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        att['status']!.toUpperCase(),
                        style: TextStyle(color: badgeText, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 24),

            // =================================================================
            // 5. ACADEMY ANNOUNCEMENTS CARD
            // =================================================================
            const Text(
              'Academy Announcements',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
            const SizedBox(height: 10),

            ..._announcements.map((ann) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.campaign_rounded, color: Color(0xFFD97706), size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ann['title']!,
                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: Color(0xFF78350F)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            ann['message']!,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF92400E), height: 1.35),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

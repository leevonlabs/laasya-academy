import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import 'trainer_data_store.dart';
import 'trainer_take_attendance_screen.dart';

class TrainerAttendanceTab extends StatefulWidget {
  const TrainerAttendanceTab({super.key});

  @override
  State<TrainerAttendanceTab> createState() => _TrainerAttendanceTabState();
}

class _TrainerAttendanceTabState extends State<TrainerAttendanceTab> {
  final TrainerDataStore _store = TrainerDataStore();

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dayOfWeek = DateFormat('EEEE').format(now);
    final formattedDate = DateFormat('d MMMM yyyy').format(now);
    final todayClasses = _store.getTodayClasses();

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() {});
        },
        color: LaasyaColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // =================================================================
              // 1. CURRENT DATE ON TOP (TODAY'S SCHEDULE & ATTENDANCE)
              // =================================================================
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
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
                      color: const Color(0xFF590231).withOpacity(0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, color: LaasyaColors.accentGold, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              'TODAY\'S ATTENDANCE CONSOLE',
                              style: TextStyle(
                                color: LaasyaColors.accentGold.withOpacity(0.95),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.4)),
                          ),
                          child: const Text(
                            'LIVE TODAY',
                            style: TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '$dayOfWeek, $formattedDate',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Guru can manage attendance for the current day only. The schedule will automatically refresh tomorrow.',
                      style: TextStyle(fontSize: 12, color: Colors.white70, height: 1.35),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.schedule_rounded, color: LaasyaColors.accentGold, size: 14),
                          const SizedBox(width: 6),
                          Text(
                            '${todayClasses.length} Scheduled Classes for Today',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // =================================================================
              // 2. TODAY'S AVAILABLE CLASSES HEADER
              // =================================================================
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Today\'s Available Classes',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: LaasyaColors.textDark,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3E8EE),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${todayClasses.length} ACTIVE',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: LaasyaColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Tap on any course name to open the roll-call page and record attendance.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),

              const SizedBox(height: 14),

              // =================================================================
              // 3. AVAILABLE CLASSES LIST (CLICKABLE TO OPEN NEW ATTENDANCE PAGE)
              // =================================================================
              if (todayClasses.isEmpty)
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFF0D5E4)),
                  ),
                  child: const Center(
                    child: Text(
                      'No classes scheduled for today.',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ),
                )
              else
                ...todayClasses.map((item) {
                  final status = _store.getSessionStatus(item['batch_id']);
                  final cColor = item['course_color'] as Color;
                  final students = item['students'] as List;
                  final isSubmitted = status == 'submitted';
                  final isInProgress = status == 'in_progress';

                  return GestureDetector(
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TrainerTakeAttendanceScreen(classInfo: item),
                        ),
                      );
                      setState(() {});
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSubmitted ? const Color(0xFF31C48D).withOpacity(0.5) : const Color(0xFFF0D5E4),
                          width: isSubmitted ? 1.5 : 1.2,
                        ),
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
                          // Card Header strip with Course Title & Status badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: cColor.withOpacity(0.07),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                            ),
                            child: Row(
                              children: [
                                Icon(item['course_icon'] as IconData, size: 20, color: cColor),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    item['course_title'] as String,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: cColor,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: isSubmitted
                                        ? const Color(0xFFDEF7EC)
                                        : (isInProgress ? const Color(0xFFFEF3C7) : const Color(0xFFF3E8EE)),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    isSubmitted
                                        ? 'SUBMITTED'
                                        : (isInProgress ? 'IN PROGRESS' : 'NOT STARTED'),
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.bold,
                                      color: isSubmitted
                                          ? const Color(0xFF03543F)
                                          : (isInProgress ? const Color(0xFF92400E) : LaasyaColors.primary),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Card Body
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item['batch_name'] as String,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                              color: LaasyaColors.textDark,
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            '${item['batch_number']} • ${item['room']}',
                                            style: const TextStyle(fontSize: 11.5, color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFFF9FC),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: const Color(0xFFF0D5E4)),
                                      ),
                                      child: Text(
                                        '${students.length} Disciples',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: LaasyaColors.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 12),

                                // Timings Highlight Row
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF9F5F8),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.access_time_rounded, size: 16, color: LaasyaColors.primary),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Class Timings: ${item['timings']}',
                                        style: const TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.bold,
                                          color: LaasyaColors.textDark,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 14),

                                // Action Row
                                Row(
                                  children: [
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        onPressed: () async {
                                          await Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => TrainerTakeAttendanceScreen(classInfo: item),
                                            ),
                                          );
                                          setState(() {});
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: isSubmitted ? const Color(0xFF03543F) : cColor,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          padding: const EdgeInsets.symmetric(vertical: 11),
                                          elevation: 1,
                                        ),
                                        icon: Icon(
                                          isSubmitted ? Icons.edit_outlined : Icons.how_to_reg_rounded,
                                          size: 16,
                                          color: Colors.white,
                                        ),
                                        label: Text(
                                          isSubmitted
                                              ? 'Edit Attendance (Today)'
                                              : (isInProgress ? 'Continue Attendance' : 'Start Attendance'),
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                        ),
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
                  );
                }),

              const SizedBox(height: 16),

              // Info card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_clock_rounded, color: LaasyaColors.primary, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Attendance changes are locked at midnight. Past records can be audited in Admin reports.',
                        style: TextStyle(fontSize: 11.5, color: Colors.black87),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

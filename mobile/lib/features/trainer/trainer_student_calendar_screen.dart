import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import 'trainer_data_store.dart';

class TrainerStudentCalendarScreen extends StatefulWidget {
  final Map<String, dynamic> student;

  const TrainerStudentCalendarScreen({
    super.key,
    required this.student,
  });

  @override
  State<TrainerStudentCalendarScreen> createState() => _TrainerStudentCalendarScreenState();
}

class _TrainerStudentCalendarScreenState extends State<TrainerStudentCalendarScreen> {
  final TrainerDataStore _store = TrainerDataStore();
  late DateTime _selectedMonth;
  int _selectedEnrollmentIndex = 0;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedMonth = DateTime(now.year, now.month, 1);
  }

  void _previousMonth() {
    setState(() {
      _selectedMonth = DateTime(_selectedMonth.year, _selectedMonth.month - 1, 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _selectedMonth = DateTime(_selectedMonth.year, _selectedMonth.month + 1, 1);
    });
  }

  void _showMonthYearPicker() async {
    final now = DateTime.now();
    final List<int> years = [now.year - 1, now.year, now.year + 1];
    final List<String> monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    int tempYear = _selectedMonth.year;
    int tempMonth = _selectedMonth.month;

    await showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Select Month & Year',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              const Text('Academic Year', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
              const SizedBox(height: 6),
              Row(
                children: years.map((yr) {
                  final isSelected = yr == tempYear;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('$yr'),
                      selected: isSelected,
                      selectedColor: LaasyaColors.primary,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.bold,
                      ),
                      onSelected: (val) {
                        if (val) setModalState(() => tempYear = yr);
                      },
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 14),

              const Text('Month', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: List.generate(12, (idx) {
                  final mIdx = idx + 1;
                  final isSelected = mIdx == tempMonth;
                  return ChoiceChip(
                    label: Text(monthNames[idx].substring(0, 3)),
                    selected: isSelected,
                    selectedColor: LaasyaColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    onSelected: (val) {
                      if (val) setModalState(() => tempMonth = mIdx);
                    },
                  );
                }),
              ),

              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _selectedMonth = DateTime(tempYear, tempMonth, 1);
                    });
                    Navigator.pop(ctx);
                  },
                  child: const Text('Apply Selection', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final stu = widget.student;
    final enrollments = List<Map<String, dynamic>>.from(stu['enrollments'] ?? []);

    // Active enrollment
    final activeEnrollment = (enrollments.isNotEmpty && _selectedEnrollmentIndex < enrollments.length)
        ? enrollments[_selectedEnrollmentIndex]
        : stu;

    final themeColor = activeEnrollment['course_color'] as Color? ?? (stu['course_color'] as Color? ?? LaasyaColors.primary);
    final courseShortTitle = activeEnrollment['course_short_title'] ?? stu['course_short_title'] ?? 'Course';
    final batchName = activeEnrollment['batch_name'] ?? stu['batch_name'] ?? 'Batch';
    final batchNumber = activeEnrollment['batch_number'] ?? stu['batch_number'] ?? 'Batch #1';
    final batchSchedule = activeEnrollment['batch_schedule_display'] ?? stu['batch_schedule_display'] ?? 'Mon, Wed, Fri';

    final year = _selectedMonth.year;
    final month = _selectedMonth.month;
    final monthName = DateFormat('MMMM yyyy').format(_selectedMonth);

    // Merge active enrollment details for monthly attendance lookup
    final mergedStudent = {
      ...stu,
      ...activeEnrollment,
    };

    final attendanceMap = _store.getStudentMonthAttendance(
      student: mergedStudent,
      year: year,
      month: month,
    );

    int presentCount = 0;
    int absentCount = 0;
    attendanceMap.forEach((day, status) {
      if (status == 'present') presentCount++;
      if (status == 'absent') absentCount++;
    });
    final totalHeld = presentCount + absentCount;
    final int monthRate = totalHeld > 0 ? ((presentCount / totalHeld) * 100).round() : 0;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        title: const Text('Student Attendance Calendar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.date_range_rounded),
            tooltip: 'Pick Month & Year',
            onPressed: _showMonthYearPicker,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. STUDENT HEADER CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [themeColor, themeColor.withOpacity(0.85)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: themeColor.withOpacity(0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white,
                    child: Text(
                      stu['name'].toString().substring(0, 1),
                      style: TextStyle(color: themeColor, fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          stu['name']!,
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${stu['roll']} • $courseShortTitle',
                          style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$batchNumber: $batchName',
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Faculty: Smt. Anusha Sumesh • Schedule: $batchSchedule',
                          style: TextStyle(color: LaasyaColors.accentGold.withOpacity(0.95), fontSize: 10.5, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // If student is registered for multiple courses with this trainer, show switcher tabs
            if (enrollments.length > 1) ...[
              const SizedBox(height: 12),
              const Text(
                'Switch Enrolled Discipline for Calendar View:',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
              const SizedBox(height: 6),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: List.generate(enrollments.length, (idx) {
                    final enr = enrollments[idx];
                    final isSelected = _selectedEnrollmentIndex == idx;
                    final eColor = enr['course_color'] as Color;

                    return GestureDetector(
                      onTap: () => setState(() => _selectedEnrollmentIndex = idx),
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? eColor : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isSelected ? eColor : const Color(0xFFF0D5E4)),
                          boxShadow: [
                            if (isSelected)
                              BoxShadow(color: eColor.withOpacity(0.25), blurRadius: 6, offset: const Offset(0, 2)),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              enr['course_short_title'],
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isSelected ? Colors.white : LaasyaColors.textDark,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '(${enr['batch_number']})',
                              style: TextStyle(
                                fontSize: 10.5,
                                color: isSelected ? Colors.white70 : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],

            const SizedBox(height: 16),

            // =================================================================
            // 2. MONTH & YEAR SELECTOR BAR
            // =================================================================
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF0D5E4)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded, color: LaasyaColors.primary, size: 28),
                    onPressed: _previousMonth,
                    tooltip: 'Previous Month',
                  ),
                  GestureDetector(
                    onTap: _showMonthYearPicker,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.calendar_month_rounded, color: LaasyaColors.primary, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          monthName,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_drop_down, color: LaasyaColors.primary, size: 20),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded, color: LaasyaColors.primary, size: 28),
                    onPressed: _nextMonth,
                    tooltip: 'Next Month',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 3. CALENDAR FORMAT GRID
            // =================================================================
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF0D5E4)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2)),
                ],
              ),
              child: Column(
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _WeekdayHeader(day: 'Mon'),
                      _WeekdayHeader(day: 'Tue'),
                      _WeekdayHeader(day: 'Wed'),
                      _WeekdayHeader(day: 'Thu'),
                      _WeekdayHeader(day: 'Fri'),
                      _WeekdayHeader(day: 'Sat'),
                      _WeekdayHeader(day: 'Sun'),
                    ],
                  ),
                  const Divider(height: 20, color: Color(0xFFF3E8EE)),

                  _buildMonthGrid(year, month, attendanceMap),

                  const SizedBox(height: 16),
                  const Divider(height: 1, color: Color(0xFFF3E8EE)),
                  const SizedBox(height: 12),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _legendItem(
                        color: const Color(0xFFDEF7EC),
                        borderColor: const Color(0xFF31C48D),
                        textColor: const Color(0xFF03543F),
                        label: 'Present',
                      ),
                      _legendItem(
                        color: const Color(0xFFFDE8E8),
                        borderColor: const Color(0xFFF98080),
                        textColor: const Color(0xFF991B1B),
                        label: 'Absent',
                      ),
                      _legendItem(
                        color: Colors.transparent,
                        borderColor: Colors.grey.shade300,
                        textColor: Colors.grey.shade700,
                        label: 'Plain (No Class)',
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 4. MONTHLY METRICS SUMMARY CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF9FC),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFF0D5E4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Monthly Attendance Summary ($monthName)',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: LaasyaColors.textDark),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: monthRate >= 85 ? const Color(0xFFDEF7EC) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '$monthRate% RATE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: monthRate >= 85 ? const Color(0xFF03543F) : const Color(0xFF92400E),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _statSummaryBox('Held Classes', '$totalHeld', LaasyaColors.primary),
                      _statSummaryBox('Present', '$presentCount', const Color(0xFF03543F)),
                      _statSummaryBox('Absent', '$absentCount', const Color(0xFF991B1B)),
                      _statSummaryBox('Attendance %', '$monthRate%', const Color(0xFF590231)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 5. SESSION LOG LIST FOR THE MONTH
            // =================================================================
            Text(
              'Session Details for $monthName',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
            const SizedBox(height: 8),

            if (totalHeld == 0)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: const Center(
                  child: Text(
                    'No class sessions recorded for this month.',
                    style: TextStyle(color: Colors.grey, fontSize: 12.5),
                  ),
                ),
              )
            else
              ..._buildSessionList(year, month, attendanceMap, activeEnrollment),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildMonthGrid(int year, int month, Map<int, String?> attendanceMap) {
    final firstDayOfMonth = DateTime(year, month, 1);
    final daysInMonth = DateUtils.getDaysInMonth(year, month);
    final startWeekday = firstDayOfMonth.weekday;

    final List<Widget> dayWidgets = [];

    for (int i = 1; i < startWeekday; i++) {
      dayWidgets.add(const SizedBox(width: 36, height: 38));
    }

    for (int day = 1; day <= daysInMonth; day++) {
      final status = attendanceMap[day];

      Widget cell;
      if (status == 'present') {
        cell = Container(
          width: 36,
          height: 38,
          decoration: BoxDecoration(
            color: const Color(0xFFDEF7EC),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFF31C48D), width: 1.5),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$day',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF03543F)),
              ),
              const Icon(Icons.check, size: 10, color: Color(0xFF03543F)),
            ],
          ),
        );
      } else if (status == 'absent') {
        cell = Container(
          width: 36,
          height: 38,
          decoration: BoxDecoration(
            color: const Color(0xFFFDE8E8),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFF98080), width: 1.5),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$day',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
              ),
              const Icon(Icons.close, size: 10, color: Color(0xFF991B1B)),
            ],
          ),
        );
      } else {
        cell = Container(
          width: 36,
          height: 38,
          alignment: Alignment.center,
          child: Text(
            '$day',
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade600,
            ),
          ),
        );
      }

      dayWidgets.add(cell);
    }

    return Wrap(
      spacing: 6,
      runSpacing: 8,
      alignment: WrapAlignment.start,
      children: dayWidgets,
    );
  }

  List<Widget> _buildSessionList(
    int year,
    int month,
    Map<int, String?> attendanceMap,
    Map<String, dynamic> enr,
  ) {
    final List<Widget> list = [];
    final daysInMonth = DateUtils.getDaysInMonth(year, month);

    for (int day = 1; day <= daysInMonth; day++) {
      final status = attendanceMap[day];
      if (status == null) continue;

      final date = DateTime(year, month, day);
      final dateFormatted = DateFormat('EEE, d MMM yyyy').format(date);
      final isPresent = status == 'present';

      list.add(
        Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isPresent ? const Color(0xFF31C48D).withOpacity(0.3) : const Color(0xFFF98080).withOpacity(0.4),
            ),
          ),
          child: Row(
            children: [
              Icon(
                isPresent ? Icons.check_circle_rounded : Icons.cancel_rounded,
                color: isPresent ? const Color(0xFF03543F) : const Color(0xFF991B1B),
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dateFormatted,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: LaasyaColors.textDark),
                    ),
                    Text(
                      '${enr['batch_name'] ?? 'Class Session'} (${enr['batch_timings'] ?? ''})',
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                decoration: BoxDecoration(
                  color: isPresent ? const Color(0xFFDEF7EC) : const Color(0xFFFDE8E8),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isPresent ? 'PRESENT' : 'ABSENT',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                    color: isPresent ? const Color(0xFF03543F) : const Color(0xFF991B1B),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return list;
  }

  Widget _legendItem({
    required Color color,
    required Color borderColor,
    required Color textColor,
    required String label,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: borderColor, width: 1.2),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textColor),
        ),
      ],
    );
  }

  Widget _statSummaryBox(String title, String val, Color color) {
    return Column(
      children: [
        Text(val, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 2),
        Text(title, style: const TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _WeekdayHeader extends StatelessWidget {
  final String day;
  const _WeekdayHeader({required this.day});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 36,
      child: Center(
        child: Text(
          day,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: LaasyaColors.textMuted),
        ),
      ),
    );
  }
}

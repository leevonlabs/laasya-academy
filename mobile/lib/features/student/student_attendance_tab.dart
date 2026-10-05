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

  // Status Filter: 'all', 'present', 'absent'
  String _statusFilter = 'all';

  // Standard Website Date Range Filter State
  // Default to This Month: October 2026 (Academic calendar active month)
  String _activePreset = 'This Month';
  DateTime? _startDate = DateTime(2026, 10, 1);
  DateTime? _endDate = DateTime(2026, 10, 31, 23, 59, 59);
  String _displayMonthYear = 'October 2026';

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

  DateTime? _parseRecordDate(Map<String, dynamic> item) {
    final iso = item['date_iso']?.toString();
    if (iso != null && iso.isNotEmpty) {
      try {
        return DateTime.parse(iso);
      } catch (_) {}
    }
    final d = item['date']?.toString();
    if (d != null && d.isNotEmpty) {
      try {
        return DateTime.parse(d);
      } catch (_) {}
    }
    return null;
  }

  void _applyPreset(String preset) {
    final now = DateTime(2026, 10, 5); // Base reference anchor
    DateTime? sDate;
    DateTime? eDate;
    String monthYear = 'October 2026';

    switch (preset) {
      case 'This Month':
        sDate = DateTime(2026, 10, 1);
        eDate = DateTime(2026, 10, 31, 23, 59, 59);
        monthYear = 'October 2026';
        break;
      case 'Last Month':
        sDate = DateTime(2026, 9, 1);
        eDate = DateTime(2026, 9, 30, 23, 59, 59);
        monthYear = 'September 2026';
        break;
      case 'Last 30 Days':
        sDate = now.subtract(const Duration(days: 30));
        eDate = now;
        monthYear = 'Sep - Oct 2026';
        break;
      case 'Last 7 Days':
        sDate = now.subtract(const Duration(days: 7));
        eDate = now;
        monthYear = 'Oct 2026 (Last 7 Days)';
        break;
      case 'All Time':
        sDate = null;
        eDate = null;
        monthYear = 'All Sessions (Academic Year 2026)';
        break;
      default:
        break;
    }

    setState(() {
      _activePreset = preset;
      _startDate = sDate;
      _endDate = eDate;
      _displayMonthYear = monthYear;
      // Reset status filter to all on date change for fresh view
      _statusFilter = 'all';
    });
  }

  void _openDateFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Select Date Range',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: LaasyaColors.textDark,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Text(
                'Filter attendance records by time period',
                style: TextStyle(fontSize: 12, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 12),

              _presetTile(
                ctx,
                label: 'This Month (October 2026)',
                presetKey: 'This Month',
                badgeText: 'Default',
              ),
              _presetTile(
                ctx,
                label: 'Last Month (September 2026)',
                presetKey: 'Last Month',
              ),
              _presetTile(
                ctx,
                label: 'Last 30 Days',
                presetKey: 'Last 30 Days',
              ),
              _presetTile(
                ctx,
                label: 'Last 7 Days',
                presetKey: 'Last 7 Days',
              ),
              _presetTile(
                ctx,
                label: 'All Time (Full Year)',
                presetKey: 'All Time',
              ),

              const SizedBox(height: 10),
              // Custom Date Range Picker
              OutlinedButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  final picked = await showDateRangePicker(
                    context: context,
                    firstDate: DateTime(2025, 1, 1),
                    lastDate: DateTime(2027, 12, 31),
                    initialDateRange: _startDate != null && _endDate != null
                        ? DateTimeRange(start: _startDate!, end: _endDate!)
                        : DateTimeRange(start: DateTime(2026, 10, 1), end: DateTime(2026, 10, 31)),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: const ColorScheme.light(
                            primary: LaasyaColors.primary,
                            onPrimary: Colors.white,
                            onSurface: LaasyaColors.textDark,
                          ),
                        ),
                        child: child!,
                      );
                    },
                  );

                  if (picked != null) {
                    setState(() {
                      _activePreset = 'Custom';
                      _startDate = picked.start;
                      _endDate = picked.end.add(const Duration(hours: 23, minutes: 59, seconds: 59));
                      _displayMonthYear = '${picked.start.day}/${picked.start.month}/${picked.start.year} - ${picked.end.day}/${picked.end.month}/${picked.end.year}';
                      _statusFilter = 'all';
                    });
                  }
                },
                icon: const Icon(Icons.date_range_rounded, size: 18),
                label: const Text('Custom Date Range...'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: LaasyaColors.primary,
                  side: const BorderSide(color: Color(0xFFF0D5E4)),
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _presetTile(
    BuildContext ctx, {
    required String label,
    required String presetKey,
    String? badgeText,
  }) {
    final isSelected = _activePreset == presetKey;
    return InkWell(
      onTap: () {
        Navigator.pop(ctx);
        _applyPreset(presetKey);
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFF2F8) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? LaasyaColors.primary : Colors.grey.shade200,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                  color: isSelected ? LaasyaColors.primary : Colors.grey.shade400,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected ? LaasyaColors.primaryDark : Colors.black87,
                  ),
                ),
              ],
            ),
            if (badgeText != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFDEF7EC),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badgeText,
                  style: const TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Filter by Date Range
    final dateFilteredRecords = _attendanceHistory.where((item) {
      if (_startDate == null || _endDate == null) return true;
      final dt = _parseRecordDate(item);
      if (dt == null) return true;
      return dt.isAfter(_startDate!.subtract(const Duration(seconds: 1))) &&
          dt.isBefore(_endDate!.add(const Duration(seconds: 1)));
    }).toList();

    // Calculate Summary Numbers for the selected date range
    final totalClassesDone = dateFilteredRecords.length;
    final presentCount = dateFilteredRecords.where((a) {
      final s = (a['status'] ?? 'present').toString().toLowerCase();
      return s != 'absent';
    }).length;
    final absentCount = dateFilteredRecords.where((a) {
      final s = (a['status'] ?? 'present').toString().toLowerCase();
      return s == 'absent';
    }).length;

    // 2. Filter by Status (Total Classes / Present / Absent)
    final displayedRecords = dateFilteredRecords.where((item) {
      final s = (item['status'] ?? 'present').toString().toLowerCase();
      if (_statusFilter == 'present') {
        return s != 'absent';
      } else if (_statusFilter == 'absent') {
        return s == 'absent';
      }
      return true; // 'all'
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : RefreshIndicator(
              onRefresh: _loadHistory,
              color: LaasyaColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // =========================================================
                    // 1. MONTH & YEAR ON TOP + STANDARD DATE FILTER BUTTON
                    // =========================================================
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFF0D5E4)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.calendar_month_rounded, size: 20, color: LaasyaColors.primary),
                                      const SizedBox(width: 8),
                                      Text(
                                        _displayMonthYear,
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: LaasyaColors.textDark,
                                          letterSpacing: -0.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  const Text(
                                    'Student Attendance Overview',
                                    style: TextStyle(fontSize: 11.5, color: LaasyaColors.textMuted),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDEF7EC),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'AY 2026',
                                  style: TextStyle(
                                    color: Color(0xFF03543F),
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          // Standard Date Filter Bar (Matching Website DateRangeQuickFilter)
                          InkWell(
                            onTap: _openDateFilterSheet,
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF9FB),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFE5C0D7)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.date_range_rounded, size: 16, color: LaasyaColors.primary),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Date Filter: $_activePreset',
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w600,
                                        color: LaasyaColors.primaryDark,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: const Color(0xFFF0D5E4)),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Change',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: LaasyaColors.primary,
                                          ),
                                        ),
                                        SizedBox(width: 4),
                                        Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: LaasyaColors.primary),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // =========================================================
                    // 2. SUMMARY NUMBER CARDS (TAPPABLE FILTERS)
                    // Total Classes Done | Present | Absent
                    // =========================================================
                    Row(
                      children: [
                        // Card 1: Total Classes Done
                        Expanded(
                          child: _summaryNumberCard(
                            title: 'Total Classes',
                            subtitle: 'Done',
                            count: totalClassesDone,
                            isActive: _statusFilter == 'all',
                            activeColor: LaasyaColors.primary,
                            activeBgColor: const Color(0xFFFFF2F8),
                            borderColor: const Color(0xFFF0D5E4),
                            icon: Icons.school_rounded,
                            onTap: () {
                              setState(() => _statusFilter = 'all');
                            },
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Card 2: Present
                        Expanded(
                          child: _summaryNumberCard(
                            title: 'Present',
                            subtitle: 'Attended',
                            count: presentCount,
                            isActive: _statusFilter == 'present',
                            activeColor: const Color(0xFF03543F),
                            activeBgColor: const Color(0xFFDEF7EC),
                            borderColor: const Color(0xFFB7E4C7),
                            icon: Icons.check_circle_rounded,
                            onTap: () {
                              setState(() {
                                _statusFilter = _statusFilter == 'present' ? 'all' : 'present';
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Card 3: Absent
                        Expanded(
                          child: _summaryNumberCard(
                            title: 'Absent',
                            subtitle: 'Missed',
                            count: absentCount,
                            isActive: _statusFilter == 'absent',
                            activeColor: const Color(0xFF991B1B),
                            activeBgColor: const Color(0xFFFDE8E8),
                            borderColor: const Color(0xFFF8B4B4),
                            icon: Icons.cancel_rounded,
                            onTap: () {
                              setState(() {
                                _statusFilter = _statusFilter == 'absent' ? 'all' : 'absent';
                              });
                            },
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Active Filter Indicator Pill (if filtered)
                    if (_statusFilter != 'all')
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: _statusFilter == 'present'
                              ? const Color(0xFFDEF7EC)
                              : const Color(0xFFFDE8E8),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _statusFilter == 'present'
                                ? const Color(0xFF31C48D)
                                : const Color(0xFFF98080),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _statusFilter == 'present' ? Icons.filter_alt_rounded : Icons.filter_alt_rounded,
                              size: 14,
                              color: _statusFilter == 'present'
                                  ? const Color(0xFF03543F)
                                  : const Color(0xFF991B1B),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                _statusFilter == 'present'
                                    ? 'Filtering: Showing Present Only ($presentCount records)'
                                    : 'Filtering: Showing Absent Only ($absentCount records)',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: _statusFilter == 'present'
                                      ? const Color(0xFF03543F)
                                      : const Color(0xFF991B1B),
                                ),
                              ),
                            ),
                            InkWell(
                              onTap: () => setState(() => _statusFilter = 'all'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'Clear',
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.bold,
                                    color: _statusFilter == 'present'
                                        ? const Color(0xFF03543F)
                                        : const Color(0xFF991B1B),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // =========================================================
                    // 3. ATTENDANCE RECORDS LIST
                    // =========================================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Attendance Entries (${displayedRecords.length})',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: LaasyaColors.textDark,
                          ),
                        ),
                        if (_statusFilter == 'all')
                          Text(
                            '$totalClassesDone total in period',
                            style: const TextStyle(fontSize: 11.5, color: Colors.grey),
                          ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    if (displayedRecords.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.event_note_rounded, size: 42, color: Colors.grey.shade400),
                            const SizedBox(height: 10),
                            Text(
                              _statusFilter == 'absent'
                                  ? 'No absent records found!'
                                  : 'No attendance records in this period.',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black54),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _statusFilter == 'absent'
                                  ? 'Great job maintaining consistent attendance!'
                                  : 'Try changing the date filter above.',
                              style: const TextStyle(fontSize: 11.5, color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: displayedRecords.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = displayedRecords[index];
                          final isAbsent = (item['status'] ?? 'present').toString().toLowerCase() == 'absent';
                          final courseTitle = item['course_title'] ?? item['course'] ?? 'Class Session';
                          final batchName = item['batch_name'] ?? item['batch'] ?? 'Batch';
                          final trainerName = item['trainer_name'] ?? item['trainer'] ?? 'Assigned Guru';
                          final dateText = item['date'] ?? '';
                          final timeText = item['time'] ?? '';

                          final badgeBg = isAbsent ? const Color(0xFFFDE8E8) : const Color(0xFFDEF7EC);
                          final badgeText = isAbsent ? const Color(0xFF991B1B) : const Color(0xFF03543F);
                          final badgeIcon = isAbsent ? Icons.cancel_rounded : Icons.check_circle_rounded;
                          final statusLabel = isAbsent ? 'Absent' : 'Present';

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isAbsent ? const Color(0xFFFED7D7) : const Color(0xFFF0D5E4),
                                width: 1.1,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Top row: Date/Time + Status Badge (Strictly Present or Absent)
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.calendar_today_rounded, size: 13, color: Colors.grey.shade600),
                                        const SizedBox(width: 5),
                                        Text(
                                          dateText,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black87,
                                          ),
                                        ),
                                        if (timeText.isNotEmpty && timeText != '--') ...[
                                          const SizedBox(width: 8),
                                          Text(
                                            '•  $timeText',
                                            style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
                                          ),
                                        ],
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: badgeBg,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(badgeIcon, size: 12, color: badgeText),
                                          const SizedBox(width: 4),
                                          Text(
                                            statusLabel,
                                            style: TextStyle(
                                              color: badgeText,
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                // Course & Batch
                                Text(
                                  courseTitle,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: LaasyaColors.textDark,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  batchName,
                                  style: const TextStyle(fontSize: 12, color: LaasyaColors.textMuted),
                                ),
                                const SizedBox(height: 8),
                                // Verified by Guru text row
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFF9FB),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFF5E4EE)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.verified_rounded, size: 14, color: LaasyaColors.primary),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          'Verified by: $trainerName',
                                          style: const TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w600,
                                            color: LaasyaColors.primaryDark,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _summaryNumberCard({
    required String title,
    required String subtitle,
    required int count,
    required bool isActive,
    required Color activeColor,
    required Color activeBgColor,
    required Color borderColor,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: isActive ? activeBgColor : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isActive ? activeColor : borderColor,
            width: isActive ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isActive ? activeColor.withOpacity(0.12) : Colors.black.withOpacity(0.02),
              blurRadius: isActive ? 8 : 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 15, color: isActive ? activeColor : Colors.grey.shade600),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                      color: isActive ? activeColor : Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '$count',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: isActive ? activeColor : LaasyaColors.textDark,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 10,
                color: isActive ? activeColor.withOpacity(0.85) : Colors.grey.shade500,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

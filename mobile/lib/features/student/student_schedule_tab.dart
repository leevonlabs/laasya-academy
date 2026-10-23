import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentScheduleTab extends StatefulWidget {
  const StudentScheduleTab({super.key});

  @override
  State<StudentScheduleTab> createState() => _StudentScheduleTabState();
}

class _StudentScheduleTabState extends State<StudentScheduleTab> {
  List<Map<String, dynamic>> _schedule = [];
  bool _isLoading = true;
  String _selectedDay = 'today'; // 'today' or 'week'
  String _selectedWeekFilter = 'all'; // 'all', 'Monday', 'Tuesday', etc.
  final Set<String> _enabledReminders = {'sch-1', 'sch-2'};

  @override
  void initState() {
    super.initState();
    _loadSchedule();
  }

  Future<void> _loadSchedule() async {
    setState(() => _isLoading = true);
    final data = await SupabaseService().getStudentSchedule();
    if (mounted) {
      setState(() {
        _schedule = data;
        _isLoading = false;
      });
    }
  }

  void _toggleReminder(String id) {
    setState(() {
      if (_enabledReminders.contains(id)) {
        _enabledReminders.remove(id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Class reminder turned off'),
            duration: Duration(seconds: 2),
          ),
        );
      } else {
        _enabledReminders.add(id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Class reminder enabled (30 mins before session)'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    });
  }

  String _formatStudentSlotTime(String raw) {
    if (raw.isEmpty) return 'Regular Hours';
    String formatToken(String token) {
      token = token.trim();
      if (token.isEmpty) return '';
      if (RegExp(r'(AM|PM)', caseSensitive: false).hasMatch(token)) {
        return token.replaceAllMapped(RegExp(r'(\d{1,2}):(\d{2}):\d{2}\s*(AM|PM)', caseSensitive: false), (m) {
          int h = int.parse(m[1]!);
          return '$h:${m[2]} ${m[3]?.toUpperCase()}';
        });
      }
      final m = RegExp(r'^(\d{1,2}):(\d{2})(?::(\d{2}))?$').firstMatch(token);
      if (m != null) {
        int h = int.parse(m[1]!);
        final min = m[2]!;
        final amPm = h >= 12 ? 'PM' : 'AM';
        int h12 = h % 12;
        if (h12 == 0) h12 = 12;
        return '$h12:$min $amPm';
      }
      return token;
    }

    if (raw.contains(' – ')) {
      final parts = raw.split(' – ');
      return '${formatToken(parts[0])} – ${formatToken(parts[1])}';
    } else if (raw.contains(' - ')) {
      final parts = raw.split(' - ');
      return '${formatToken(parts[0])} – ${formatToken(parts[1])}';
    } else if (raw.contains('-')) {
      final parts = raw.split('-');
      return '${formatToken(parts[0])} – ${formatToken(parts[1])}';
    }
    return formatToken(raw);
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final todayClasses = _schedule.where((item) {
      return item['is_today'] == true;
    }).toList();

    final weekClasses = _schedule.where((item) {
      if (_selectedWeekFilter == 'all') return true;
      final day = (item['day'] ?? '').toString().toLowerCase();
      return day == _selectedWeekFilter.toLowerCase();
    }).toList();

    final displayedClasses = _selectedDay == 'today' ? todayClasses : weekClasses;

    return Scaffold(
      backgroundColor: const Color(0xFFE3D5DC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : Column(
              children: [
                // =============================================================
                // 2-PART SIDE-BY-SIDE SCHEDULE FILTER (TODAY vs WEEK SCHEDULE)
                // =============================================================
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF4EAEF),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFD4BAC7)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _scheduleTabButton(
                          title: "Today's Schedule",
                          subtitle: DateFormat('dd MMM yyyy').format(now),
                          count: todayClasses.length,
                          isSelected: _selectedDay == 'today',
                          onTap: () => setState(() => _selectedDay = 'today'),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: _scheduleTabButton(
                          title: "Week Schedule",
                          subtitle: 'Current Week Only',
                          count: _schedule.length,
                          isSelected: _selectedDay == 'week',
                          onTap: () => setState(() => _selectedDay = 'week'),
                        ),
                      ),
                    ],
                  ),
                ),

                // =============================================================
                // OPTIONAL DAY CHIPS (VISIBLE WHEN WEEK SCHEDULE IS SELECTED)
                // =============================================================
                if (_selectedDay == 'week')
                  Container(
                    height: 38,
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        _weekDayChip('all', 'All Week (${_schedule.length})'),
                        _weekDayChip('Monday', 'Mon'),
                        _weekDayChip('Tuesday', 'Tue'),
                        _weekDayChip('Wednesday', 'Wed'),
                        _weekDayChip('Thursday', 'Thu'),
                        _weekDayChip('Friday', 'Fri'),
                        _weekDayChip('Saturday', 'Sat'),
                        _weekDayChip('Sunday', 'Sun'),
                      ],
                    ),
                  ),

                // =============================================================
                // SCHEDULE LIST FOR SELECTED DAY / WEEK
                // =============================================================
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadSchedule,
                    color: LaasyaColors.primary,
                    child: displayedClasses.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                              Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFFF2F8),
                                        shape: BoxShape.circle,
                                        border: Border.all(color: const Color(0xFFF0D5E4)),
                                      ),
                                      child: Icon(Icons.event_busy_rounded, size: 48, color: Colors.grey.shade400),
                                    ),
                                    const SizedBox(height: 14),
                                    Text(
                                      _selectedDay == 'today'
                                          ? 'No Classes Scheduled for Today'
                                          : 'No Classes for Selected Day',
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black54,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    const Text(
                                      'Take time to practice and rehearse!',
                                      style: TextStyle(fontSize: 12, color: Colors.black38),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                            itemCount: displayedClasses.length,
                            itemBuilder: (context, index) {
                              final item = displayedClasses[index];
                              final status = item['status'] ?? 'Scheduled';
                              final isHoliday = status.toString().toLowerCase().contains('holiday');
                              final reminderOn = _enabledReminders.contains(item['id']);
                              final dayName = item['day'] ?? 'Scheduled Day';

                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF4EAEF),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: const Color(0xFFD4BAC7),
                                    width: 1.2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.04),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Top Header: Badges on Left, Remind Me Button on Right
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        children: [
                                          Expanded(
                                            child: Wrap(
                                              spacing: 6,
                                              runSpacing: 6,
                                              crossAxisAlignment: WrapCrossAlignment.center,
                                              children: [
                                                if (_selectedDay == 'week')
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFF8A064D),
                                                      borderRadius: BorderRadius.circular(8),
                                                    ),
                                                    child: Text(
                                                      dayName.toUpperCase(),
                                                      style: const TextStyle(
                                                        color: Color(0xFFFBF0B9),
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 10.5,
                                                      ),
                                                    ),
                                                  ),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                                                  decoration: BoxDecoration(
                                                    color: Colors.white,
                                                    borderRadius: BorderRadius.circular(8),
                                                    border: Border.all(color: const Color(0xFFD4BAC7)),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      const Icon(Icons.access_time_rounded, size: 13, color: Color(0xFF8A064D)),
                                                      const SizedBox(width: 4),
                                                      Text(
                                                        _formatStudentSlotTime(item['time'] ?? 'Regular Hours'),
                                                        style: const TextStyle(
                                                          color: Color(0xFF8A064D),
                                                          fontWeight: FontWeight.bold,
                                                          fontSize: 11,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                if (item['is_rescheduled'] == true || item['is_tally'] == true || status.toString().contains('★'))
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFFEF3C7),
                                                      borderRadius: BorderRadius.circular(6),
                                                      border: Border.all(color: const Color(0xFFF59E0B)),
                                                    ),
                                                    child: const Text(
                                                      'RESCHEDULED ★',
                                                      style: TextStyle(
                                                        color: Color(0xFF92400E),
                                                        fontSize: 9.5,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  )
                                                else
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                                    decoration: BoxDecoration(
                                                      color: isHoliday ? const Color(0xFFFEF3C7) : const Color(0xFFDEF7EC),
                                                      borderRadius: BorderRadius.circular(6),
                                                    ),
                                                    child: Text(
                                                      status.toString().toUpperCase(),
                                                      style: TextStyle(
                                                        color: isHoliday ? const Color(0xFF92400E) : const Color(0xFF03543F),
                                                        fontSize: 9.5,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 8),

                                          // REMIND ME BUTTON ON TOP RIGHT OF EVERY GRID
                                          Material(
                                            color: Colors.transparent,
                                            child: InkWell(
                                              onTap: () => _toggleReminder(item['id']),
                                              borderRadius: BorderRadius.circular(20),
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                                decoration: BoxDecoration(
                                                  color: reminderOn ? const Color(0xFF8A064D) : Colors.white,
                                                  borderRadius: BorderRadius.circular(20),
                                                  border: Border.all(
                                                    color: reminderOn ? const Color(0xFF8A064D) : const Color(0xFFD4BAC7),
                                                    width: 1.2,
                                                  ),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Icon(
                                                      reminderOn ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
                                                      size: 13,
                                                      color: reminderOn ? const Color(0xFFFBF0B9) : const Color(0xFF8A064D),
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      reminderOn ? 'Reminded' : 'Remind Me',
                                                      style: TextStyle(
                                                        fontSize: 10.5,
                                                        fontWeight: FontWeight.bold,
                                                        color: reminderOn ? Colors.white : const Color(0xFF8A064D),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),

                                      const SizedBox(height: 12),
                                      Text(
                                        item['course'] ?? 'Course Session',
                                        style: const TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF220314),
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        '${item['batch'] ?? 'Batch'} • Guru: ${item['trainer'] ?? 'Assigned Guru'}',
                                        style: const TextStyle(fontSize: 12.5, color: Color(0xFF6E3955)),
                                      ),
                                      const SizedBox(height: 10),

                                      // Full Room / Venue Name (No Truncation)
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8.5),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(color: const Color(0xFFD4BAC7)),
                                        ),
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Icon(Icons.meeting_room_rounded, size: 16, color: Color(0xFF8A064D)),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                item['room'] ?? 'Natya Mandapam',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: Color(0xFF220314),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _scheduleTabButton({
    required String title,
    required String subtitle,
    required int count,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? LaasyaColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: isSelected ? Colors.white : LaasyaColors.textDark,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.white.withOpacity(0.25) : const Color(0xFFF3E8EE),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$count',
                    style: TextStyle(
                      color: isSelected ? Colors.white : LaasyaColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                color: isSelected ? Colors.white.withOpacity(0.85) : Colors.grey.shade500,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _weekDayChip(String filterKey, String label) {
    final isSelected = _selectedWeekFilter == filterKey;
    return GestureDetector(
      onTap: () => setState(() => _selectedWeekFilter = filterKey),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF590231) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF590231) : const Color(0xFFF0D5E4),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF590231).withOpacity(0.2),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : Colors.black87,
            ),
          ),
        ),
      ),
    );
  }
}

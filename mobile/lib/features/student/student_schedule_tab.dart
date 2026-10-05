import 'package:flutter/material.dart';
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
  String _selectedDay = 'today'; // 'today' or 'tomorrow'
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

  @override
  Widget build(BuildContext context) {
    final todayClasses = _schedule.where((item) {
      final isToday = item['is_today'] == true;
      final day = (item['day'] ?? '').toString().toLowerCase();
      return isToday || day == 'today';
    }).toList();

    final tomorrowClasses = _schedule.where((item) {
      final isTomorrow = item['is_tomorrow'] == true;
      final day = (item['day'] ?? '').toString().toLowerCase();
      return isTomorrow || day == 'tomorrow';
    }).toList();

    final displayedClasses = _selectedDay == 'today' ? todayClasses : tomorrowClasses;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : Column(
              children: [
                // =============================================================
                // 2-PART SIDE-BY-SIDE SCHEDULE FILTER (TODAY vs TOMORROW)
                // =============================================================
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 16, 16, 10),
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFF0D5E4)),
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
                          subtitle: '05 Oct 2026',
                          count: todayClasses.length,
                          isSelected: _selectedDay == 'today',
                          onTap: () => setState(() => _selectedDay = 'today'),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: _scheduleTabButton(
                          title: "Tomorrow's Schedule",
                          subtitle: '06 Oct 2026',
                          count: tomorrowClasses.length,
                          isSelected: _selectedDay == 'tomorrow',
                          onTap: () => setState(() => _selectedDay = 'tomorrow'),
                        ),
                      ),
                    ],
                  ),
                ),

                // =============================================================
                // SCHEDULE LIST FOR SELECTED DAY
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
                                          : 'No Classes Scheduled for Tomorrow',
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
                              final isToday = item['is_today'] == true || _selectedDay == 'today';
                              final status = item['status'] ?? 'Scheduled';
                              final isHoliday = status.toString().toLowerCase().contains('holiday');
                              final reminderOn = _enabledReminders.contains(item['id']);

                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: isToday
                                        ? const Color(0xFFF0D5E4)
                                        : const Color(0xFFE5E7EB),
                                    width: 1.2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.03),
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
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF3E8EE),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.access_time_rounded, size: 13, color: LaasyaColors.primary),
                                                const SizedBox(width: 4),
                                                Text(
                                                  item['time'] ?? 'Regular Hours',
                                                  style: const TextStyle(
                                                    color: LaasyaColors.primary,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 11.5,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: isHoliday ? const Color(0xFFFEF3C7) : const Color(0xFFDEF7EC),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              status.toString().toUpperCase(),
                                              style: TextStyle(
                                                color: isHoliday ? const Color(0xFF92400E) : const Color(0xFF03543F),
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.bold,
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
                                          color: LaasyaColors.textDark,
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        '${item['batch'] ?? 'Batch'} • Guru: ${item['trainer'] ?? 'Assigned Guru'}',
                                        style: const TextStyle(fontSize: 12.5, color: LaasyaColors.textMuted),
                                      ),
                                      const SizedBox(height: 12),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFF9FB),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: const Color(0xFFF0D5E4)),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                const Icon(Icons.meeting_room_rounded, size: 16, color: LaasyaColors.primary),
                                                const SizedBox(width: 8),
                                                Text(
                                                  item['room'] ?? 'Hall',
                                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
                                                ),
                                              ],
                                            ),
                                            InkWell(
                                              onTap: () => _toggleReminder(item['id']),
                                              borderRadius: BorderRadius.circular(8),
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: reminderOn ? const Color(0xFFFFF2F8) : Colors.grey.shade100,
                                                  borderRadius: BorderRadius.circular(8),
                                                  border: Border.all(
                                                    color: reminderOn ? LaasyaColors.primary.withOpacity(0.3) : Colors.grey.shade300,
                                                  ),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Icon(
                                                      reminderOn ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
                                                      size: 14,
                                                      color: reminderOn ? LaasyaColors.primary : Colors.grey.shade600,
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      reminderOn ? 'Reminder On' : 'Remind Me',
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.w600,
                                                        color: reminderOn ? LaasyaColors.primary : Colors.grey.shade700,
                                                      ),
                                                    ),
                                                  ],
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
}

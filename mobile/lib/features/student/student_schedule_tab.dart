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
          const SnackBar(content: Text('Class reminder turned off')),
        );
      } else {
        _enabledReminders.add(id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Class reminder enabled (30 mins before session)')),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _schedule.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.calendar_month_outlined, size: 60, color: Colors.grey.shade400),
                      const SizedBox(height: 12),
                      const Text('No Classes Scheduled', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black54)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _schedule.length,
                  itemBuilder: (context, index) {
                    final item = _schedule[index];
                    final isToday = item['is_today'] == true;
                    final isHoliday = (item['status'] as String).contains('Holiday');
                    final reminderOn = _enabledReminders.contains(item['id']);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isToday ? LaasyaColors.primary : (isHoliday ? const Color(0xFFFDE68A) : Colors.grey.shade200),
                          width: isToday ? 2 : 1,
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
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isToday ? LaasyaColors.primary : const Color(0xFFF3E8EE),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        item['day']!,
                                        style: TextStyle(
                                          color: isToday ? Colors.white : LaasyaColors.primaryDark,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      item['date']!,
                                      style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: isHoliday ? const Color(0xFFFEF3C7) : const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    item['status']!,
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
                              item['course']!,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '${item['batch']} • Guru: ${item['trainer']}',
                              style: const TextStyle(fontSize: 12, color: LaasyaColors.textMuted),
                            ),
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF9FB),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.schedule_rounded, size: 16, color: LaasyaColors.primary),
                                      const SizedBox(width: 6),
                                      Text(
                                        item['time']!,
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                                      ),
                                      const SizedBox(width: 12),
                                      const Icon(Icons.room_rounded, size: 16, color: LaasyaColors.primary),
                                      const SizedBox(width: 6),
                                      Text(
                                        item['room']!,
                                        style: const TextStyle(fontSize: 11.5, color: Colors.black87),
                                      ),
                                    ],
                                  ),
                                  IconButton(
                                    icon: Icon(
                                      reminderOn ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
                                      color: reminderOn ? LaasyaColors.primary : Colors.grey,
                                      size: 20,
                                    ),
                                    tooltip: 'Toggle class reminder',
                                    onPressed: () => _toggleReminder(item['id']),
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
    );
  }
}

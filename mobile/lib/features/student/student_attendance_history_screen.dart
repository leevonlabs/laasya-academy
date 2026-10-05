import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentAttendanceHistoryScreen extends StatefulWidget {
  const StudentAttendanceHistoryScreen({super.key});

  @override
  State<StudentAttendanceHistoryScreen> createState() => _StudentAttendanceHistoryScreenState();
}

class _StudentAttendanceHistoryScreenState extends State<StudentAttendanceHistoryScreen> {
  List<Map<String, dynamic>> _records = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    try {
      final list = await SupabaseService().getStudentAttendanceHistory();
      if (mounted) setState(() => _records = list);
    } catch (e) {
      debugPrint('Error loading attendance history: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Attendance History'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : _records.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.history, size: 64, color: LaasyaColors.primary.withOpacity(0.3)),
                        const SizedBox(height: 16),
                        const Text(
                          'No Attendance Records Yet',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Your presence records will appear here once you check in for class.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: LaasyaColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadHistory,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _records.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final r = _records[index];
                      final session = r['class_sessions'];
                      final batch = session?['batches'];
                      final course = batch?['courses'];
                      final status = (r['status'] as String? ?? 'absent').toLowerCase();
                      final method = r['check_in_method'] == 'student_code' ? 'Self Check-in (PIN)' : 'Guru Marked';

                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              _statusIcon(status),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      batch?['name'] ?? 'Class Session',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: LaasyaColors.textDark,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${course?['title'] ?? 'Art'} • Date: ${session?['session_date'] ?? 'N/A'}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: LaasyaColors.textMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      method,
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        color: LaasyaColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              _statusBadge(status),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _statusIcon(String status) {
    IconData icon;
    Color color;
    if (status != 'absent') {
      icon = Icons.check_circle;
      color = LaasyaColors.success;
    } else {
      icon = Icons.cancel;
      color = LaasyaColors.error;
    }
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 22),
    );
  }

  Widget _statusBadge(String status) {
    Color bg;
    Color fg;
    final isPresent = status != 'absent';
    if (isPresent) {
      bg = LaasyaColors.success.withOpacity(0.12);
      fg = LaasyaColors.success;
    } else {
      bg = LaasyaColors.error.withOpacity(0.12);
      fg = LaasyaColors.error;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(
        isPresent ? 'PRESENT' : 'ABSENT',
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: fg),
      ),
    );
  }
}

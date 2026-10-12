import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class TrainerClassesTab extends StatefulWidget {
  const TrainerClassesTab({super.key});

  @override
  State<TrainerClassesTab> createState() => _TrainerClassesTabState();
}

class _TrainerClassesTabState extends State<TrainerClassesTab> {
  List<Map<String, dynamic>> _batches = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBatches();
  }

  Future<void> _loadBatches() async {
    setState(() => _isLoading = true);
    final data = await SupabaseService().getTrainerBatches();
    if (mounted) {
      setState(() {
        _batches = data;
        _isLoading = false;
      });
    }
  }

  String _getCourseTitle(Map<String, dynamic> b) {
    if (b['course_title'] != null && b['course_title'].toString().isNotEmpty) {
      return b['course_title'].toString();
    }
    if (b['courses'] is Map && b['courses']['title'] != null) {
      return b['courses']['title'].toString();
    }
    return 'Classical Arts';
  }

  String _getDays(Map<String, dynamic> b) {
    final d = b['days_of_week'];
    if (d is List) return d.join(', ');
    if (d != null && d.toString().isNotEmpty) return d.toString();
    return 'Mon, Wed, Fri';
  }

  String _getRoom(Map<String, dynamic> b) {
    return b['room_or_hall']?.toString() ?? 'Natya Mandapam';
  }

  String _getStatus(Map<String, dynamic> b) {
    return b['status']?.toString() ?? 'Active';
  }

  String _getName(Map<String, dynamic> b) {
    return b['name']?.toString() ?? 'Batch Session';
  }

  void _showBatchDetails(Map<String, dynamic> b) {
    final courseTitle = _getCourseTitle(b);
    final room = _getRoom(b);
    final days = _getDays(b);
    final startTime = b['start_time']?.toString() ?? '17:00';
    final endTime = b['end_time']?.toString() ?? '18:30';
    final enrolled = b['enrolled_count']?.toString() ?? '0';
    final capacity = b['max_capacity']?.toString() ?? '20';
    final startDate = b['start_date']?.toString() ?? 'Active Session';

    final rawSchedules = b['schedules'];
    List<Map<String, dynamic>> scheduleSlots = [];
    if (rawSchedules is List) {
      for (var s in rawSchedules) {
        if (s is Map) {
          scheduleSlots.add({
            'day': s['day']?.toString() ?? '',
            'startTime': s['startTime']?.toString() ?? '',
            'endTime': s['endTime']?.toString() ?? '',
            'room': s['room']?.toString() ?? room,
          });
        }
      }
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              _getName(b),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
            const SizedBox(height: 6),
            Text(
              'Discipline: $courseTitle',
              style: const TextStyle(fontSize: 13, color: LaasyaColors.primary, fontWeight: FontWeight.w600),
            ),
            const Divider(height: 24),
            const Text(
              'Batch Schedule & Venue:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            if (scheduleSlots.isNotEmpty)
              ...scheduleSlots.map((slot) => Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFBF8FA),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFF0D5E4)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF590231),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            slot['day'] ?? 'Day',
                            style: const TextStyle(color: Color(0xFFF9E33A), fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '${slot['startTime']} - ${slot['endTime']}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5, color: LaasyaColors.textDark),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.room_rounded, size: 13, color: LaasyaColors.primary),
                            const SizedBox(width: 2),
                            Text(
                              slot['room'] ?? 'Hall',
                              style: const TextStyle(fontSize: 11, color: Colors.black87),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ))
            else ...[
              _infoRow(Icons.calendar_month_rounded, 'Days of Week', days),
              _infoRow(Icons.access_time_rounded, 'Timings', '$startTime - $endTime'),
              _infoRow(Icons.room_rounded, 'Classroom Hall', room),
            ],
            const SizedBox(height: 10),
            _infoRow(Icons.groups_rounded, 'Capacity', '$enrolled Enrolled / $capacity Capacity'),
            _infoRow(Icons.date_range_rounded, 'Batch Start Date', startDate),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close'),
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: LaasyaColors.primary),
          const SizedBox(width: 10),
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              val,
              textAlign: TextAlign.end,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : _batches.isEmpty
              ? Center(
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
                        child: const Icon(Icons.class_outlined, size: 48, color: LaasyaColors.primary),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'No Classes Assigned Yet',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Assigned batches will appear here automatically.',
                        style: TextStyle(fontSize: 12, color: Colors.black54),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadBatches,
                  color: LaasyaColors.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _batches.length,
                    itemBuilder: (context, index) {
                      final b = _batches[index];
                      final courseTitle = _getCourseTitle(b);
                      final room = _getRoom(b);
                      final days = _getDays(b);
                      final status = _getStatus(b);
                      final name = _getName(b);
                      final startTime = b['start_time']?.toString() ?? '17:00';
                      final endTime = b['end_time']?.toString() ?? '18:30';
                      final enrolled = b['enrolled_count']?.toString() ?? '0';
                      final capacity = b['max_capacity']?.toString() ?? '20';

                      final rawSchedules = b['schedules'];
                      List<Map<String, dynamic>> cardSlots = [];
                      if (rawSchedules is List) {
                        for (var s in rawSchedules) {
                          if (s is Map) {
                            cardSlots.add({
                              'day': s['day']?.toString() ?? '',
                              'startTime': s['startTime']?.toString() ?? '',
                              'endTime': s['endTime']?.toString() ?? '',
                              'room': s['room']?.toString() ?? room,
                            });
                          }
                        }
                      }

                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Align(
                                      alignment: Alignment.centerLeft,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF3E8EE),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          courseTitle,
                                          style: const TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDEF7EC),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      status.toUpperCase(),
                                      style: const TextStyle(color: Color(0xFF03543F), fontWeight: FontWeight.bold, fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                name,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 8),
                              if (cardSlots.isNotEmpty)
                                ...cardSlots.map((slot) => Padding(
                                      padding: const EdgeInsets.only(bottom: 6),
                                      child: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF590231),
                                              borderRadius: BorderRadius.circular(5),
                                            ),
                                            child: Text(
                                              slot['day'] ?? 'Day',
                                              style: const TextStyle(color: Color(0xFFF9E33A), fontWeight: FontWeight.bold, fontSize: 10.5),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            '${slot['startTime']} - ${slot['endTime']}',
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.room_rounded, size: 13, color: LaasyaColors.primary),
                                                const SizedBox(width: 2),
                                                Expanded(
                                                  child: Text(
                                                    slot['room'] ?? 'Hall',
                                                    style: const TextStyle(fontSize: 11.5, color: Colors.black54),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ))
                              else ...[
                                Row(
                                  children: [
                                    const Icon(Icons.room_rounded, size: 16, color: LaasyaColors.primary),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        room,
                                        style: const TextStyle(fontSize: 12, color: Colors.black87),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Padding(
                                      padding: EdgeInsets.only(top: 2),
                                      child: Icon(Icons.schedule_rounded, size: 16, color: LaasyaColors.primary),
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        '$startTime - $endTime ($days)',
                                        style: const TextStyle(fontSize: 12, color: Colors.black87),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 14),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Students: $enrolled / $capacity',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton(
                                    onPressed: () => _showBatchDetails(b),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: LaasyaColors.primary,
                                      side: const BorderSide(color: LaasyaColors.primary),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    ),
                                    child: const Text('View Class Details', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

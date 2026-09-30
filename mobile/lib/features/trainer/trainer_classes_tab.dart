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

  void _showBatchDetails(Map<String, dynamic> b) {
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
              b['name']!,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
            const SizedBox(height: 6),
            Text('Discipline: ${b['courses']['title']}', style: const TextStyle(fontSize: 13, color: LaasyaColors.primary, fontWeight: FontWeight.w600)),
            const Divider(height: 24),
            _infoRow(Icons.room_rounded, 'Classroom Hall', b['room_or_hall']!),
            _infoRow(Icons.calendar_month_rounded, 'Days of Week', (b['days_of_week'] as List).join(', ')),
            _infoRow(Icons.access_time_rounded, 'Timings', '${b['start_time']} - ${b['end_time']}'),
            _infoRow(Icons.groups_rounded, 'Capacity', '${b['enrolled_count']} Enrolled / ${b['max_capacity']} Capacity'),
            _infoRow(Icons.date_range_rounded, 'Batch Start Date', b['start_date']!),
            _infoRow(Icons.timer_outlined, 'Program Duration', b['duration']!),
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
        children: [
          Icon(icon, size: 18, color: LaasyaColors.primary),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          const Spacer(),
          Text(val, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _batches.length,
              itemBuilder: (context, index) {
                final b = _batches[index];
                final days = (b['days_of_week'] as List).join(', ');

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
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3E8EE),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                b['courses']['title']!,
                                style: const TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDEF7EC),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                b['status']!,
                                style: const TextStyle(color: Color(0xFF03543F), fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          b['name']!,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.room_rounded, size: 16, color: LaasyaColors.primary),
                            const SizedBox(width: 6),
                            Text(b['room_or_hall']!, style: const TextStyle(fontSize: 12, color: Colors.black87)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.schedule_rounded, size: 16, color: LaasyaColors.primary),
                            const SizedBox(width: 6),
                            Text('${b['start_time']} - ${b['end_time']} ($days)', style: const TextStyle(fontSize: 12, color: Colors.black87)),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Students: ${b['enrolled_count']} / ${b['max_capacity']}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54),
                            ),
                            OutlinedButton(
                              onPressed: () => _showBatchDetails(b),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: LaasyaColors.primary,
                                side: const BorderSide(color: LaasyaColors.primary),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
    );
  }
}

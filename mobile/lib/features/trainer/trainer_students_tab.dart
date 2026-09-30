import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class TrainerStudentsTab extends StatefulWidget {
  const TrainerStudentsTab({super.key});

  @override
  State<TrainerStudentsTab> createState() => _TrainerStudentsTabState();
}

class _TrainerStudentsTabState extends State<TrainerStudentsTab> {
  List<Map<String, dynamic>> _students = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  Future<void> _loadStudents() async {
    setState(() => _isLoading = true);
    final data = await SupabaseService().getBatchStudents('batch-201');
    if (mounted) {
      setState(() {
        _students = data;
        _isLoading = false;
      });
    }
  }

  void _showStudentProfileModal(Map<String, dynamic> stu) {
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
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: LaasyaColors.primary,
                  child: Text(
                    stu['name'].toString().substring(0, 1),
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stu['name']!,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Roll Number: ${stu['roll_number']}',
                        style: const TextStyle(fontSize: 13, color: LaasyaColors.primary, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        stu['batch_name']!,
                        style: const TextStyle(fontSize: 11.5, color: Colors.black54),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            _infoRow(Icons.phone_rounded, 'Student Phone', stu['phone']!),
            _infoRow(Icons.family_restroom_rounded, 'Parent / Guardian', stu['parent_name']!),
            _infoRow(Icons.contact_phone_rounded, 'Emergency Contact', stu['parent_phone']!),
            _infoRow(Icons.percent_rounded, 'Attendance Record', '${stu['attendance_rate']}% Present'),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF3E8EE),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: LaasyaColors.primary, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Student enrollment and fee status are managed exclusively by Academy Administration.',
                      style: TextStyle(fontSize: 11, color: LaasyaColors.primaryDark),
                    ),
                  ),
                ],
              ),
            ),
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
    final filtered = _students.where((s) {
      final q = _searchQuery.toLowerCase();
      final name = s['name'].toString().toLowerCase();
      final roll = s['roll_number'].toString().toLowerCase();
      return name.contains(q) || roll.contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search by student name or roll number...',
                prefixIcon: const Icon(Icons.search_rounded, color: LaasyaColors.primary),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: (val) => setState(() => _searchQuery = val),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? const Center(child: Text('No matching students found'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final stu = filtered[index];
                          final rate = stu['attendance_rate'] as int;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              leading: CircleAvatar(
                                radius: 22,
                                backgroundColor: const Color(0xFF590231),
                                child: Text(
                                  stu['name'].toString().substring(0, 1),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              ),
                              title: Text(
                                stu['name']!,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('${stu['roll_number']} • ${stu['batch_name']}', style: const TextStyle(fontSize: 11.5)),
                                  const SizedBox(height: 2),
                                  Text('Parent: ${stu['parent_name']} (${stu['parent_phone']})', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                ],
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: rate >= 90 ? const Color(0xFFDEF7EC) : const Color(0xFFFEF08A),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '$rate% Attended',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: rate >= 90 ? const Color(0xFF03543F) : const Color(0xFF854D0E),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Colors.grey),
                                ],
                              ),
                              onTap: () => _showStudentProfileModal(stu),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

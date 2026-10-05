import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentCoursesTab extends StatefulWidget {
  const StudentCoursesTab({super.key});

  @override
  State<StudentCoursesTab> createState() => _StudentCoursesTabState();
}

class _StudentCoursesTabState extends State<StudentCoursesTab> {
  List<Map<String, dynamic>> _courses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    setState(() => _isLoading = true);
    final crs = await SupabaseService().getStudentEnrolledCourses();
    if (mounted) {
      setState(() {
        _courses = crs;
        _isLoading = false;
      });
    }
  }

  void _showCourseDetails(Map<String, dynamic> course) {
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
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),
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
                      course['category']!,
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
                      'STATUS: ${course['status']!.toUpperCase()}',
                      style: const TextStyle(color: Color(0xFF03543F), fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                course['title']!,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
              ),
              Text(
                course['telugu_name']!,
                style: const TextStyle(fontSize: 16, color: LaasyaColors.primary, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),

              _detailRow(Icons.person_rounded, 'Assigned Revered Guru', course['trainer_name']!),
              _detailRow(Icons.groups_rounded, 'Batch Name', course['batch_name']!),
              _detailRow(Icons.access_time_rounded, 'Timings & Days', course['timings']!),
              _detailRow(Icons.room_rounded, 'Hall / Location', course['room']!),
              _detailRow(Icons.calendar_today_rounded, 'Start Date & Duration', '${course['start_date']} (${course['duration']})'),
              _detailRow(Icons.payments_rounded, 'Course Fee', course['fee']!),

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close Course Details'),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: LaasyaColors.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: Colors.black54, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 13, color: Colors.black87, fontWeight: FontWeight.w500)),
              ],
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
          ? const Center(child: CircularProgressIndicator())
          : _courses.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.menu_book_rounded, size: 64, color: Colors.grey.shade400),
                      const SizedBox(height: 14),
                      const Text(
                        'No Enrolled Courses',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black54),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Contact the Academy Director to enroll in a batch.',
                        style: TextStyle(fontSize: 12, color: Colors.black38),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _courses.length,
                  itemBuilder: (context, index) {
                    final course = _courses[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFF0D5E4)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
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
                                    course['category']!,
                                    style: const TextStyle(
                                      color: LaasyaColors.primary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    course['status']!,
                                    style: const TextStyle(
                                      color: Color(0xFF03543F),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              course['title']!,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: LaasyaColors.textDark,
                              ),
                            ),
                            Text(
                              course['telugu_name']!,
                              style: const TextStyle(
                                fontSize: 13,
                                color: LaasyaColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF9FB),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFF0D5E4)),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.person_rounded, size: 16, color: LaasyaColors.primary),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Guru: ${course['trainer_name']}',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.schedule_rounded, size: 16, color: LaasyaColors.primary),
                                      const SizedBox(width: 8),
                                      Text(
                                        course['timings']!,
                                        style: const TextStyle(fontSize: 12, color: Colors.black87),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.room_rounded, size: 16, color: LaasyaColors.primary),
                                      const SizedBox(width: 8),
                                      Text(
                                        course['room']!,
                                        style: const TextStyle(fontSize: 12, color: Colors.black87),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Duration: ${course['duration']}',
                                  style: const TextStyle(fontSize: 11.5, color: LaasyaColors.textMuted),
                                ),
                                OutlinedButton(
                                  onPressed: () => _showCourseDetails(course),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: LaasyaColors.primary,
                                    side: const BorderSide(color: LaasyaColors.primary),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  ),
                                  child: const Text('View Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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

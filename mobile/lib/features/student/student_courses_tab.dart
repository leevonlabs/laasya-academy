import 'package:flutter/material.dart';
import '../../core/services/supabase_service.dart';

class StudentCoursesTab extends StatefulWidget {
  const StudentCoursesTab({super.key});

  @override
  State<StudentCoursesTab> createState() => _StudentCoursesTabState();
}

class _StudentCoursesTabState extends State<StudentCoursesTab> {
  List<Map<String, dynamic>> _batches = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBatches();
  }

  Future<void> _loadBatches() async {
    setState(() => _isLoading = true);
    final list = await SupabaseService().getStudentEnrolledCourses();
    if (mounted) {
      setState(() {
        _batches = list;
        _isLoading = false;
      });
    }
  }

  String _formatToAmPm(String? raw) {
    if (raw == null || raw.trim().isEmpty) return '05:00 PM';
    final s = raw.trim();
    if (s.contains('AM') || s.contains('PM') || s.contains('am') || s.contains('pm')) {
      return s;
    }
    final parts = s.split(':');
    if (parts.length >= 2) {
      int h = int.tryParse(parts[0]) ?? 17;
      final m = parts[1];
      final ampm = h >= 12 ? 'PM' : 'AM';
      int h12 = h % 12;
      if (h12 == 0) h12 = 12;
      return '${h12.toString().padLeft(2, '0')}:$m $ampm';
    }
    return s;
  }

  List<Map<String, String>> _buildTimetableRows(Map<String, dynamic> batch) {
    List<Map<String, String>> rows = [];
    final startTime = _formatToAmPm(batch['start_time']?.toString() ?? '17:00');
    final endTime = _formatToAmPm(batch['end_time']?.toString() ?? '18:30');
    final room = batch['room']?.toString() ?? 'Natya Mandapam';

    final daysRaw = batch['days_of_week'];
    List<String> days = [];
    if (daysRaw is List) {
      days = daysRaw.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
    } else if (daysRaw != null && daysRaw.toString().isNotEmpty) {
      days = daysRaw.toString().split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    }

    if (days.isEmpty) {
      days = ['Monday', 'Wednesday', 'Friday'];
    }

    for (var d in days) {
      rows.add({
        'day': d,
        'time': '$startTime – $endTime',
        'room': room,
      });
    }
    return rows;
  }

  void _showBatchDetailsModal(Map<String, dynamic> b) {
    final timetable = _buildTimetableRows(b);
    final courseTitle = b['title']?.toString() ?? 'Classical Arts';
    final batchName = b['batch_name']?.toString() ?? 'Enrolled Batch';
    final guruName = b['trainer_name']?.toString() ?? 'Assigned Faculty Guru';
    final roomName = b['room']?.toString() ?? 'Natya Mandapam (Room 101)';
    final fee = b['fee']?.toString() ?? '₹2,000 / month';
    final category = b['category']?.toString() ?? 'Classical Performing Arts';
    final status = (b['status']?.toString() ?? 'Active').toUpperCase();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.88),
        decoration: const BoxDecoration(
          color: Color(0xFFF4EAEF),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
          border: Border(
            top: BorderSide(color: Color(0xFFD4BAC7), width: 1.5),
            left: BorderSide(color: Color(0xFFD4BAC7), width: 1.5),
            right: BorderSide(color: Color(0xFFD4BAC7), width: 1.5),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Pull Handle
              Center(
                child: Container(
                  width: 44,
                  height: 4.5,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Category & Status Badges
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE3D5DC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFD4BAC7)),
                    ),
                    child: Text(
                      category,
                      style: const TextStyle(
                        color: Color(0xFF8A064D),
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
                      border: Border.all(color: const Color(0xFF86EFAC)),
                    ),
                    child: Text(
                      'STATUS: $status',
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

              // Course Name (Bigger) & Batch Name (Subheading)
              Text(
                courseTitle,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF220314),
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Batch: $batchName',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF8A064D),
                ),
              ),
              const SizedBox(height: 14),

              // TABULAR TIMETABLE SECTION (Matching Guru Login classes timetable)
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD4BAC7)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Table Header
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: const BoxDecoration(
                        color: Color(0xFF8A064D),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(15),
                          topRight: Radius.circular(15),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: Text(
                              'DAY',
                              style: TextStyle(color: Color(0xFFFBF0B9), fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                          Expanded(
                            flex: 5,
                            child: Text(
                              'TIMINGS',
                              style: TextStyle(color: Color(0xFFFBF0B9), fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                          Expanded(
                            flex: 4,
                            child: Text(
                              'ROOM / VENUE',
                              style: TextStyle(color: Color(0xFFFBF0B9), fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Table Rows
                    ...timetable.map((row) {
                      final isLast = timetable.last == row;
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF0E5EC))),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Text(
                                row['day'] ?? '',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: Color(0xFF220314),
                                ),
                              ),
                            ),
                            Expanded(
                              flex: 5,
                              child: Text(
                                row['time'] ?? '',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 11.5,
                                  color: Color(0xFF8A064D),
                                ),
                              ),
                            ),
                            Expanded(
                              flex: 4,
                              child: Text(
                                row['room'] ?? '',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF6E3955),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Batch Details Cards
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD4BAC7)),
                ),
                child: Column(
                  children: [
                    _infoRow(Icons.person_rounded, 'Assigned Guru', guruName),
                    const Divider(height: 16, color: Color(0xFFF0E5EC)),
                    _infoRow(Icons.room_rounded, 'Classroom / Hall', roomName),
                    const Divider(height: 16, color: Color(0xFFF0E5EC)),
                    _infoRow(Icons.payments_rounded, 'Monthly Tuition Fee', fee),
                    const Divider(height: 16, color: Color(0xFFF0E5EC)),
                    _infoRow(Icons.military_tech_rounded, 'Enrolled Discipline', category),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Close Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8A064D),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text('Close Batch Details', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String val) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: const Color(0xFF8A064D)),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF6E3955), fontWeight: FontWeight.bold)),
              const SizedBox(height: 1.5),
              Text(val, style: const TextStyle(fontSize: 13, color: Color(0xFF220314), fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE3D5DC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8A064D)))
          : _batches.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.menu_book_rounded, size: 64, color: Colors.grey.shade400),
                      const SizedBox(height: 14),
                      const Text(
                        'No Enrolled Batches',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF220314)),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Contact the Academy Director to enroll in a batch.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF6E3955)),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _batches.length,
                  itemBuilder: (context, index) {
                    final b = _batches[index];
                    final courseTitle = b['title']?.toString() ?? 'Classical Arts';
                    final batchName = b['batch_name']?.toString() ?? 'Active Batch';
                    final guruName = b['trainer_name']?.toString() ?? 'Assigned Faculty Guru';
                    final roomName = b['room']?.toString() ?? 'Natya Mandapam';
                    final fee = b['fee']?.toString() ?? '₹2,000 / month';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF4EAEF),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFD4BAC7), width: 1.2),
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
                            // 1. Course Name (Bigger Font)
                            Text(
                              courseTitle,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF220314),
                                letterSpacing: -0.3,
                              ),
                            ),
                            const SizedBox(height: 2),

                            // 2. Batch Name as Subheading
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF8A064D),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    batchName,
                                    style: const TextStyle(
                                      color: Color(0xFFFBF0B9),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  '• Enrolled Batch Session',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF6E3955)),
                                ),
                              ],
                            ),

                            const SizedBox(height: 14),

                            // 3. Main Grid Details: Guru Name, Room Name, Monthly Fee
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFD4BAC7)),
                              ),
                              child: Column(
                                children: [
                                  // Guru Name
                                  Row(
                                    children: [
                                      const Icon(Icons.person_rounded, size: 16, color: Color(0xFF8A064D)),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'Guru: ',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF6E3955)),
                                      ),
                                      Expanded(
                                        child: Text(
                                          guruName,
                                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF220314)),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),

                                  // Room Name
                                  Row(
                                    children: [
                                      const Icon(Icons.meeting_room_rounded, size: 16, color: Color(0xFF8A064D)),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'Venue: ',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF6E3955)),
                                      ),
                                      Expanded(
                                        child: Text(
                                          roomName,
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF220314)),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),

                                  // Monthly Fee
                                  Row(
                                    children: [
                                      const Icon(Icons.payments_rounded, size: 16, color: Color(0xFF8A064D)),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'Monthly Fee: ',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF6E3955)),
                                      ),
                                      Expanded(
                                        child: Text(
                                          fee,
                                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF8A064D)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 14),

                            // 4. Highlighted Details Button
                            SizedBox(
                              width: double.infinity,
                              height: 44,
                              child: ElevatedButton.icon(
                                onPressed: () => _showBatchDetailsModal(b),
                                icon: const Icon(Icons.calendar_view_month_rounded, size: 17),
                                label: const Text(
                                  'View Batch Timetable & Details',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF8A064D),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 2,
                                ),
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

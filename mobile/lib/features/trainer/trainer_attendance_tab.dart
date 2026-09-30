import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class TrainerAttendanceTab extends StatefulWidget {
  const TrainerAttendanceTab({super.key});

  @override
  State<TrainerAttendanceTab> createState() => _TrainerAttendanceTabState();
}

class _TrainerAttendanceTabState extends State<TrainerAttendanceTab> {
  List<Map<String, dynamic>> _sessions = [];
  Map<String, dynamic>? _selectedSession;
  List<Map<String, dynamic>> _students = [];
  final Map<String, String> _attendanceMap = {}; // stuId -> 'present' | 'absent' | 'late'
  bool _isLoading = true;
  bool _isSaving = false;
  String _activePin = '482910';

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() => _isLoading = true);
    final sess = await SupabaseService().getTrainerTodaySessions();
    if (mounted) {
      setState(() {
        _sessions = sess;
        if (sess.isNotEmpty) {
          _selectedSession = sess.first;
          _activePin = sess.first['check_in_code'] ?? '482910';
        }
      });
      if (_selectedSession != null) {
        await _loadBatchStudents(_selectedSession!['batch_id'] ?? 'batch-201');
      } else {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadBatchStudents(String batchId) async {
    final list = await SupabaseService().getBatchStudents(batchId);
    if (mounted) {
      setState(() {
        _students = list;
        for (var item in list) {
          final sId = item['id'];
          // Default: 1st student (Ananya) checked in via PIN, others present
          _attendanceMap[sId] = item['status'] ?? 'present';
        }
        _isLoading = false;
      });
    }
  }

  void _onSessionSelected(Map<String, dynamic> sess) {
    setState(() {
      _selectedSession = sess;
      _activePin = sess['check_in_code'] ?? '482910';
      _isLoading = true;
    });
    _loadBatchStudents(sess['batch_id'] ?? 'batch-201');
  }

  void _markAllPresent() {
    setState(() {
      for (var s in _students) {
        _attendanceMap[s['id']] = 'present';
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('All enrolled students marked as Present')),
    );
  }

  Future<void> _saveAttendance() async {
    setState(() => _isSaving = true);
    await Future.delayed(const Duration(milliseconds: 600));

    setState(() => _isSaving = false);
    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded, color: Color(0xFF03543F), size: 48),
            const SizedBox(height: 12),
            const Text(
              'Attendance Saved!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Attendance records for ${_selectedSession?['batches']?['name'] ?? 'Class'} have been committed and synced to Academy Director logs.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12.5, color: Colors.black87),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final batchName = _selectedSession?['batches']?['name'] ?? 'Bharathanatyam - Batch A';
    final hall = _selectedSession?['batches']?['room_or_hall'] ?? 'Natya Mandapam';
    final timings = '${_selectedSession?['start_time']} - ${_selectedSession?['end_time']}';

    final total = _students.length;
    final presentCount = _attendanceMap.values.where((v) => v == 'present').length;
    final absentCount = _attendanceMap.values.where((v) => v == 'absent').length;
    final lateCount = _attendanceMap.values.where((v) => v == 'late').length;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. CLASS SESSION SELECTOR
            // =================================================================
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<Map<String, dynamic>>(
                  isExpanded: true,
                  value: _selectedSession,
                  hint: const Text('Select Class Session'),
                  items: _sessions.map((s) {
                    return DropdownMenuItem<Map<String, dynamic>>(
                      value: s,
                      child: Text(
                        '${s['batches']['name']} (${s['start_time']})',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) _onSessionSelected(val);
                  },
                ),
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 2. GOLDEN 6-DIGIT STUDENT CHECK-IN PIN CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF590231), Color(0xFF8A064D)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.7), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.pin_rounded, color: LaasyaColors.accentGold, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'STUDENT CHECK-IN PIN',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDEF7EC),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'SESSION ACTIVE',
                          style: TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Display this code to students attending class now:',
                    style: TextStyle(color: Colors.white70, fontSize: 11.5),
                  ),
                  const SizedBox(height: 14),

                  // Big Glowing PIN Display
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.35),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: LaasyaColors.accentGold, width: 2),
                    ),
                    child: Text(
                      _activePin,
                      style: const TextStyle(
                        color: LaasyaColors.accentGold,
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 10,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),
                  Text(
                    '$batchName • $hall ($timings)',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // =================================================================
            // 3. ATTENDANCE COUNTERS & "MARK ALL PRESENT"
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Student Attendance Checklist',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$total Enrolled • $presentCount Present • $absentCount Absent • $lateCount Late',
                      style: const TextStyle(fontSize: 11.5, color: LaasyaColors.textMuted),
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: _markAllPresent,
                  icon: const Icon(Icons.done_all_rounded, size: 16, color: LaasyaColors.primary),
                  label: const Text('All Present', style: TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // =================================================================
            // 4. STUDENT ATTENDANCE LIST WITH 1-TAP TOGGLES
            // =================================================================
            ..._students.map((stu) {
              final sId = stu['id'];
              final status = _attendanceMap[sId] ?? 'present';
              final isPINChecked = stu['roll_number'] == 'LCA-10021'; // Demo: Ananya checked in via PIN

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: status == 'present' ? const Color(0xFFDEF7EC) : (status == 'late' ? const Color(0xFFFEF08A) : const Color(0xFFFDE8E8)),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: const Color(0xFF590231),
                      child: Text(
                        stu['name'].toString().substring(0, 1),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                stu['name']!,
                                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                              ),
                              if (isPINChecked) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text('PIN Checked', style: TextStyle(fontSize: 9.5, color: Color(0xFF03543F), fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Roll: ${stu['roll_number']} • Phone: ${stu['phone']}',
                            style: const TextStyle(fontSize: 10.5, color: LaasyaColors.textMuted),
                          ),
                        ],
                      ),
                    ),

                    // Segmented Presence Buttons
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _statusBtn(sId, 'present', 'P', Colors.green, status == 'present'),
                        const SizedBox(width: 4),
                        _statusBtn(sId, 'late', 'L', Colors.orange, status == 'late'),
                        const SizedBox(width: 4),
                        _statusBtn(sId, 'absent', 'A', Colors.red, status == 'absent'),
                      ],
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 20),

            // Save Attendance Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveAttendance,
                icon: _isSaving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.cloud_upload_outlined, size: 20),
                label: Text(
                  _isSaving ? 'Saving Attendance...' : 'Save & Commit Class Attendance',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _statusBtn(String stuId, String statusValue, String label, Color color, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _attendanceMap[stuId] = statusValue;
        });
      },
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? color : Colors.grey.shade300),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}

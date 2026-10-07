import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class TrainerSessionScreen extends StatefulWidget {
  final Map<String, dynamic> session;

  const TrainerSessionScreen({super.key, required this.session});

  @override
  State<TrainerSessionScreen> createState() => _TrainerSessionScreenState();
}

class _TrainerSessionScreenState extends State<TrainerSessionScreen> {
  List<Map<String, dynamic>> _students = [];
  final Map<String, String> _attendanceMap = {}; // studentId -> 'present' | 'absent' | 'late'
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  Future<void> _loadStudents() async {
    setState(() => _isLoading = true);
    try {
      final batchId = widget.session['batch_id'];
      final list = await SupabaseService().getBatchStudents(batchId);
      setState(() {
        _students = list;
        for (var item in list) {
          final sId = item['students'] != null ? item['students']['id'] : item['id'];
          _attendanceMap[sId] = 'present'; // Default to present
        }
      });

      // Ensure session is started in db
      if (widget.session['status'] != 'in_progress') {
        await SupabaseService().startSession(widget.session['id'], 'trainer_managed');
      }
    } catch (e) {
      debugPrint('Load students error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveAttendance() async {
    setState(() => _isSaving = true);
    try {
      final sessionId = widget.session['id'];
      for (var entry in _attendanceMap.entries) {
        await SupabaseService().markAttendance(
          sessionId: sessionId,
          studentId: entry.key,
          status: entry.value,
        );
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Attendance recorded & synced successfully!'),
          backgroundColor: LaasyaColors.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving attendance: $e'),
          backgroundColor: LaasyaColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _markAll(String status) {
    setState(() {
      for (var studentItem in _students) {
        final sId = studentItem['students'] != null ? studentItem['students']['id'] : studentItem['id'];
        _attendanceMap[sId] = status;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('All marked as ${status.toUpperCase()}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final batch = widget.session['batches'];
    final batchName = batch?['name'] ?? 'Class Session';
    final courseTitle = batch?['courses']?['title'] ?? 'Course';
    final room = batch?['room_or_hall'] ?? 'Studio Hall';
    final timings = '${widget.session['start_time']} - ${widget.session['end_time']}';

    final presentCount = _attendanceMap.values.where((v) => v == 'present').length;
    final absentCount = _attendanceMap.values.where((v) => v == 'absent').length;

    return Scaffold(
      appBar: AppBar(
        title: Text(batchName),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStudents,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Trainer Roll-Call Header Card (NO PIN)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF590231), Color(0xFF8A064D)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: LaasyaColors.primaryDark.withOpacity(0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.how_to_reg_rounded, color: LaasyaColors.accentGold, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'TRAINER ROLL-CALL SESSION',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: 1.1,
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
                                'IN PROGRESS',
                                style: TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          batchName,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$courseTitle • $room ($timings)',
                          style: const TextStyle(fontSize: 12, color: Colors.white70),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.3)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified_user_rounded, color: LaasyaColors.accentGold, size: 14),
                              SizedBox(width: 6),
                              Text(
                                'Attendance is exclusively managed and verified by the Trainer',
                                style: TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Quick Stats & Actions
                  Row(
                    children: [
                      _statPill('Present', '$presentCount', const Color(0xFFDEF7EC), const Color(0xFF03543F)),
                      const SizedBox(width: 8),
                      _statPill('Absent', '$absentCount', const Color(0xFFFDE8E8), const Color(0xFF991B1B)),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: () => _markAll('present'),
                        icon: const Icon(Icons.done_all, size: 16, color: LaasyaColors.primary),
                        label: const Text(
                          'All Present',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  // Attendance Sheet Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Class Attendance Sheet (${_students.length} Enrolled)',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: LaasyaColors.textDark,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Student Roster Checklist
                  if (_students.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: LaasyaColors.border),
                      ),
                      child: const Text('No students currently enrolled in this batch.'),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _students.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final studentItem = _students[index];
                        final student = studentItem['students'] ?? studentItem;
                        final profile = student['profiles'] ?? student;
                        final studentId = student['id'] ?? studentItem['id'];
                        final currentStatus = _attendanceMap[studentId] ?? 'present';
                        final fullName = profile['full_name'] ?? studentItem['name'] ?? 'Student';
                        final rollNumber = student['roll_number'] ?? studentItem['roll_number'] ?? 'LCA-0';

                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: currentStatus == 'present'
                                  ? const Color(0xFFDEF7EC)
                                  : const Color(0xFFFDE8E8),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: const Color(0xFF590231),
                                child: Text(
                                  fullName.toString().substring(0, 1).toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      fullName,
                                      style: const TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.bold,
                                        color: LaasyaColors.textDark,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Roll No: $rollNumber',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: LaasyaColors.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Two Segmented Toggle Buttons: P / A
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _statusBtn(
                                    label: 'P',
                                    isSelected: currentStatus == 'present',
                                    bgColor: const Color(0xFFDEF7EC),
                                    textColor: const Color(0xFF03543F),
                                    borderColor: const Color(0xFF31C48D),
                                    onTap: () => setState(() => _attendanceMap[studentId] = 'present'),
                                  ),
                                  const SizedBox(width: 8),
                                  _statusBtn(
                                    label: 'A',
                                    isSelected: currentStatus == 'absent',
                                    bgColor: const Color(0xFFFDE8E8),
                                    textColor: const Color(0xFF991B1B),
                                    borderColor: const Color(0xFFF98080),
                                    onTap: () => setState(() => _attendanceMap[studentId] = 'absent'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),

                  const SizedBox(height: 24),

                  // Bottom Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Back'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton.icon(
                          onPressed: _isSaving ? null : _saveAttendance,
                          icon: _isSaving
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.check_circle),
                          label: Text(_isSaving ? 'Submitting...' : 'Save & Submit Attendance'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _statPill(String label, String count, Color bg, Color text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$label: ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: text)),
          Text(count, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: text)),
        ],
      ),
    );
  }

  Widget _statusBtn({
    required String label,
    required bool isSelected,
    required Color bgColor,
    required Color textColor,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: isSelected ? bgColor : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? borderColor : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isSelected ? textColor : Colors.grey.shade600,
            ),
          ),
        ),
      ),
    );
  }
}

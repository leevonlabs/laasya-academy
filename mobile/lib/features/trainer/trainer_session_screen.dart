import 'dart:math';
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
  late String _pin;
  List<Map<String, dynamic>> _students = [];
  final Map<String, String> _attendanceMap = {}; // studentId -> 'present' | 'absent' | 'late'
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _pin = widget.session['check_in_code'] ?? _generatePin();
    _loadStudents();
  }

  String _generatePin() {
    return (100000 + Random().nextInt(900000)).toString();
  }

  Future<void> _loadStudents() async {
    setState(() => _isLoading = true);
    try {
      final batchId = widget.session['batch_id'];
      final list = await SupabaseService().getBatchStudents(batchId);
      setState(() {
        _students = list;
        for (var item in list) {
          final sId = item['students']['id'];
          _attendanceMap[sId] = 'present'; // Default to present
        }
      });

      // Ensure session is started in db with the PIN
      if (widget.session['status'] != 'in_progress') {
        await SupabaseService().startSession(widget.session['id'], _pin);
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
          backgroundColor: LaasyaColors.success,
          content: Text('Attendance saved successfully!'),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: LaasyaColors.error,
          content: Text('Failed to save attendance: $e'),
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _completeSession() async {
    await _saveAttendance();
    await SupabaseService().completeSession(widget.session['id']);
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  void _markAll(String status) {
    setState(() {
      for (var key in _attendanceMap.keys) {
        _attendanceMap[key] = status;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final batchName = widget.session['batches']?['name'] ?? 'Class Session';
    final courseTitle = widget.session['batches']?['courses']?['title'] ?? 'Art Form';

    return Scaffold(
      appBar: AppBar(
        title: Text(batchName),
        actions: [
          IconButton(
            icon: const Icon(Icons.check_circle_outline, color: LaasyaColors.accentGold),
            tooltip: 'Finish Session',
            onPressed: _completeSession,
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
                  // Active 6-Digit PIN Golden Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFFFDF7), Color(0xFFFFF8E7)],
                      ),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: LaasyaColors.accentGold, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: LaasyaColors.accentGold.withOpacity(0.2),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.key, color: LaasyaColors.primary, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'STUDENT CHECK-IN PIN',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: LaasyaColors.primaryDark,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _pin,
                          style: const TextStyle(
                            fontSize: 44,
                            fontWeight: FontWeight.w900,
                            color: LaasyaColors.primary,
                            letterSpacing: 8,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Show this code to students present in class to self check-in.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            color: LaasyaColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Attendance Sheet Header & Fast Actions
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Class Attendance Sheet',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: LaasyaColors.textDark,
                            ),
                          ),
                          Text(
                            '${_students.length} Enrolled Students • $courseTitle',
                            style: const TextStyle(
                              fontSize: 12,
                              color: LaasyaColors.textMuted,
                            ),
                          ),
                        ],
                      ),
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

                  const SizedBox(height: 12),

                  // Student Roster Checklist
                  if (_students.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      alignment: Alignment.center,
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
                        final student = studentItem['students'];
                        final profile = student['profiles'];
                        final studentId = student['id'];
                        final currentStatus = _attendanceMap[studentId] ?? 'present';

                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: LaasyaColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: LaasyaColors.primary.withOpacity(0.1),
                                    foregroundColor: LaasyaColors.primary,
                                    child: Text(
                                      (profile['full_name'] as String? ?? 'S').substring(0, 1),
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          profile['full_name'] ?? 'Student',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: LaasyaColors.textDark,
                                          ),
                                        ),
                                        Text(
                                          'Roll: ${student['roll_number'] ?? 'N/A'}',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: LaasyaColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Segmented Status Toggle (Present, Absent, Late)
                              Row(
                                children: [
                                  Expanded(
                                    child: _statusButton(
                                      label: 'Present',
                                      isSelected: currentStatus == 'present',
                                      activeColor: LaasyaColors.success,
                                      onTap: () {
                                        setState(() => _attendanceMap[studentId] = 'present');
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: _statusButton(
                                      label: 'Absent',
                                      isSelected: currentStatus == 'absent',
                                      activeColor: LaasyaColors.error,
                                      onTap: () {
                                        setState(() => _attendanceMap[studentId] = 'absent');
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: _statusButton(
                                      label: 'Late',
                                      isSelected: currentStatus == 'late',
                                      activeColor: LaasyaColors.warning,
                                      onTap: () {
                                        setState(() => _attendanceMap[studentId] = 'late');
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),

                  const SizedBox(height: 24),

                  // Bottom Save & Complete Actions
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _isSaving ? null : _saveAttendance,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: LaasyaColors.primary),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: _isSaving
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Save Attendance Draft'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _completeSession,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: LaasyaColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Finish Class'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }

  Widget _statusButton({
    required String label,
    required bool isSelected,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withOpacity(0.12) : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? activeColor : Colors.transparent,
            width: 1.5,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? activeColor : const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }
}

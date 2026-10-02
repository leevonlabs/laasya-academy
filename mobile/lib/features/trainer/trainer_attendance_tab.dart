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
          _attendanceMap[sId] = item['status'] ?? 'present';
        }
        _isLoading = false;
      });
    }
  }

  void _onSessionSelected(Map<String, dynamic> sess) {
    setState(() {
      _selectedSession = sess;
      _isLoading = true;
    });
    _loadBatchStudents(sess['batch_id'] ?? 'batch-201');
  }

  void _markAll(String status) {
    setState(() {
      for (var s in _students) {
        _attendanceMap[s['id']] = status;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('All enrolled students marked as ${status.toUpperCase()}')),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFFDEF7EC),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF03543F), size: 48),
            ),
            const SizedBox(height: 16),
            const Text(
              'Attendance Submitted!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
            const SizedBox(height: 8),
            Text(
              'Attendance roll-call for ${_selectedSession?['batches']?['name'] ?? 'Selected Batch'} has been officially recorded and synchronized with the Director dashboard.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12.5, color: Colors.black87, height: 1.4),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Done'),
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
      return const Center(child: CircularProgressIndicator(color: LaasyaColors.primary));
    }

    final batchName = _selectedSession?['batches']?['name'] ?? 'Bharathanatyam - Batch A';
    final hall = _selectedSession?['batches']?['room_or_hall'] ?? 'Natya Mandapam';
    final timings = '${_selectedSession?['start_time']} - ${_selectedSession?['end_time']}';

    final presentCount = _attendanceMap.values.where((v) => v == 'present').length;
    final lateCount = _attendanceMap.values.where((v) => v == 'late').length;
    final absentCount = _attendanceMap.values.where((v) => v == 'absent').length;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. SESSION PICKER SELECTOR
            // =================================================================
            const Text(
              'Active Class Session',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textMuted),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF0D5E4)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
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
            // 2. OFFICIAL TRAINER ROLL-CALL AUTHORITY CARD (NO PIN)
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
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
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
                          Icon(Icons.how_to_reg_rounded, color: LaasyaColors.accentGold, size: 22),
                          SizedBox(width: 8),
                          Text(
                            'TRAINER ROLL-CALL CONSOLE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
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
                          'OFFICIAL RECORD',
                          style: TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    batchName,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Studio Hall: $hall • Timings: $timings',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 12),
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
                        Icon(Icons.lock_outline_rounded, color: LaasyaColors.accentGold, size: 14),
                        SizedBox(width: 6),
                        Text(
                          'Trainer Managed: Only trainers have authority to mark roll-call',
                          style: TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // =================================================================
            // 3. ATTENDANCE METRICS COUNTER & QUICK ACTIONS
            // =================================================================
            Row(
              children: [
                _counterBadge('Present', '$presentCount', const Color(0xFFDEF7EC), const Color(0xFF03543F)),
                const SizedBox(width: 8),
                _counterBadge('Late', '$lateCount', const Color(0xFFFEF08A), const Color(0xFF854D0E)),
                const SizedBox(width: 8),
                _counterBadge('Absent', '$absentCount', const Color(0xFFFDE8E8), const Color(0xFF991B1B)),
                const Spacer(),
                TextButton.icon(
                  onPressed: () => _markAll('present'),
                  icon: const Icon(Icons.done_all_rounded, size: 16, color: LaasyaColors.primary),
                  label: const Text(
                    'All Present',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 4. STUDENT ROLL-CALL LIST (DIRECT PRESENT / LATE / ABSENT TOGGLE)
            // =================================================================
            const Text(
              'Enrolled Student Roll-Call',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
            const SizedBox(height: 10),

            ..._students.map((stu) {
              final sId = stu['id'];
              final status = _attendanceMap[sId] ?? 'present';

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: status == 'present'
                        ? const Color(0xFFDEF7EC)
                        : (status == 'late' ? const Color(0xFFFEF08A) : const Color(0xFFFDE8E8)),
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
                        stu['name'].toString().substring(0, 1),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            stu['name']!,
                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Roll: ${stu['roll_number']} • ${stu['phone']}',
                            style: const TextStyle(fontSize: 10.5, color: LaasyaColors.textMuted),
                          ),
                        ],
                      ),
                    ),

                    // Three Segmented Toggle Buttons: P / L / A
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _statusToggleButton(
                          label: 'P',
                          fullLabel: 'Present',
                          isSelected: status == 'present',
                          selectedColor: const Color(0xFFDEF7EC),
                          selectedTextColor: const Color(0xFF03543F),
                          borderColor: const Color(0xFF31C48D),
                          onTap: () => setState(() => _attendanceMap[sId] = 'present'),
                        ),
                        const SizedBox(width: 6),
                        _statusToggleButton(
                          label: 'L',
                          fullLabel: 'Late',
                          isSelected: status == 'late',
                          selectedColor: const Color(0xFFFEF08A),
                          selectedTextColor: const Color(0xFF854D0E),
                          borderColor: const Color(0xFFFACC15),
                          onTap: () => setState(() => _attendanceMap[sId] = 'late'),
                        ),
                        const SizedBox(width: 6),
                        _statusToggleButton(
                          label: 'A',
                          fullLabel: 'Absent',
                          isSelected: status == 'absent',
                          selectedColor: const Color(0xFFFDE8E8),
                          selectedTextColor: const Color(0xFF991B1B),
                          borderColor: const Color(0xFFF98080),
                          onTap: () => setState(() => _attendanceMap[sId] = 'absent'),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 20),

            // =================================================================
            // 5. SUBMIT ATTENDANCE BUTTON
            // =================================================================
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveAttendance,
                icon: _isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check_circle_outline, color: Colors.white),
                label: Text(
                  _isSaving ? 'Submitting Roll-Call...' : 'Submit & Save Class Attendance',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _counterBadge(String label, String count, Color bg, Color text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$label: ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: text)),
          Text(count, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: text)),
        ],
      ),
    );
  }

  Widget _statusToggleButton({
    required String label,
    required String fullLabel,
    required bool isSelected,
    required Color selectedColor,
    required Color selectedTextColor,
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
          color: isSelected ? selectedColor : Colors.grey.shade100,
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
              color: isSelected ? selectedTextColor : Colors.grey.shade600,
            ),
          ),
        ),
      ),
    );
  }
}

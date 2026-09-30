import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentAttendanceTab extends StatefulWidget {
  const StudentAttendanceTab({super.key});

  @override
  State<StudentAttendanceTab> createState() => _StudentAttendanceTabState();
}

class _StudentAttendanceTabState extends State<StudentAttendanceTab> {
  List<Map<String, dynamic>> _attendanceHistory = [];
  bool _isLoading = true;
  final TextEditingController _pinController = TextEditingController();
  bool _isCheckingIn = false;
  String? _checkInError;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    final history = await SupabaseService().getStudentAttendanceHistory();
    if (mounted) {
      setState(() {
        _attendanceHistory = history;
        _isLoading = false;
      });
    }
  }

  void _onKeypadTap(String val) {
    if (_pinController.text.length < 6) {
      setState(() {
        _pinController.text += val;
        _checkInError = null;
      });
    }
  }

  void _onKeypadBackspace() {
    if (_pinController.text.isNotEmpty) {
      setState(() {
        _pinController.text = _pinController.text.substring(0, _pinController.text.length - 1);
        _checkInError = null;
      });
    }
  }

  Future<void> _submitPinCheckIn() async {
    final pin = _pinController.text.trim();
    if (pin.length != 6) {
      setState(() => _checkInError = 'Please enter a complete 6-digit session PIN.');
      return;
    }

    setState(() {
      _isCheckingIn = true;
      _checkInError = null;
    });

    final res = await SupabaseService().studentCheckIn(
      sessionId: 'sess-mock-today',
      checkInCode: pin,
    );

    setState(() => _isCheckingIn = false);

    if (res['success'] == true) {
      _pinController.clear();
      await _loadHistory();
      if (!mounted) return;
      _showSuccessConfirmation(res['message']!);
    } else {
      setState(() => _checkInError = res['error']!);
    }
  }

  void _showSuccessConfirmation(String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFDEF7EC),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF03543F), size: 40),
            ),
            const SizedBox(height: 16),
            const Text(
              'Attendance Recorded!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF3E8EE),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                '🔒 Attendance is locked as per Academy Policy',
                style: TextStyle(fontSize: 11, color: LaasyaColors.primary, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 20),
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
    final totalClasses = _attendanceHistory.length;
    final presentCount = _attendanceHistory.where((a) => a['status'] == 'present').length;
    final lateCount = _attendanceHistory.where((a) => a['status'] == 'late').length;
    final absentCount = _attendanceHistory.where((a) => a['status'] == 'absent').length;
    final rate = totalClasses == 0 ? 100.0 : ((presentCount + (lateCount * 0.5)) / totalClasses * 100);

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ===========================================================
                  // 1. MONTHLY ATTENDANCE SUMMARY CARD
                  // ===========================================================
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF590231), Color(0xFF8A064D)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: LaasyaColors.primaryDark.withOpacity(0.3),
                          blurRadius: 14,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Monthly Attendance Summary',
                              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.5)),
                              ),
                              child: const Text(
                                'September 2026',
                                style: TextStyle(color: LaasyaColors.accentGold, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            // Gauge percentage display
                            Container(
                              width: 72,
                              height: 72,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: LaasyaColors.accentGold, width: 4),
                              ),
                              child: Center(
                                child: Text(
                                  '${rate.toStringAsFixed(0)}%',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                children: [
                                  _metricStat('Present Classes', '$presentCount sessions', const Color(0xFFDEF7EC)),
                                  const SizedBox(height: 6),
                                  _metricStat('Late Arrivals', '$lateCount sessions', const Color(0xFFFEF08A)),
                                  const SizedBox(height: 6),
                                  _metricStat('Absent', '$absentCount sessions', const Color(0xFFFDE8E8)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 22),

                  // ===========================================================
                  // 2. CLASS CHECK-IN SECTION (Interactive PIN Card)
                  // ===========================================================
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFFF0D5E4)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.pin_rounded, color: Color(0xFFB45309), size: 22),
                            ),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Check In for Scheduled Class',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                  ),
                                  Text(
                                    'Enter 6-digit PIN displayed on your Trainer\'s screen',
                                    style: TextStyle(fontSize: 11, color: LaasyaColors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),

                        if (_checkInError != null)
                          Container(
                            padding: const EdgeInsets.all(10),
                            margin: const EdgeInsets.only(bottom: 14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, color: LaasyaColors.error, size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(_checkInError!, style: const TextStyle(color: LaasyaColors.error, fontSize: 11)),
                                ),
                              ],
                            ),
                          ),

                        // PIN Display Boxes
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(6, (idx) {
                            final text = _pinController.text;
                            final char = idx < text.length ? text[idx] : '';
                            final isCurrent = idx == text.length;

                            return Container(
                              width: 44,
                              height: 52,
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF9FB),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isCurrent ? LaasyaColors.primary : (char.isNotEmpty ? LaasyaColors.accentGold : Colors.grey.shade300),
                                  width: isCurrent || char.isNotEmpty ? 2 : 1,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  char,
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: LaasyaColors.primaryDark,
                                  ),
                                ),
                              ),
                            );
                          }),
                        ),

                        const SizedBox(height: 18),

                        // Custom Numeric Keypad
                        _buildKeypad(),

                        const SizedBox(height: 16),

                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isCheckingIn ? null : _submitPinCheckIn,
                            child: _isCheckingIn
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : const Text('Confirm & Submit Check-In', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ===========================================================
                  // 3. ATTENDANCE HISTORY LIST
                  // ===========================================================
                  const Text(
                    'Full Attendance History',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                  ),
                  const SizedBox(height: 10),

                  ..._attendanceHistory.map((att) {
                    final isPresent = att['status'] == 'present';
                    final isLate = att['status'] == 'late';
                    Color bg = isPresent ? const Color(0xFFDEF7EC) : (isLate ? const Color(0xFFFEF08A) : const Color(0xFFFDE8E8));
                    Color fg = isPresent ? const Color(0xFF03543F) : (isLate ? const Color(0xFF854D0E) : const Color(0xFF9B1C1C));

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isPresent ? Icons.verified_rounded : (isLate ? Icons.alarm_on_rounded : Icons.cancel_rounded),
                            color: fg,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  att['course_title']!,
                                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${att['batch_name']} • Guru: ${att['trainer_name']}',
                                  style: const TextStyle(fontSize: 11, color: LaasyaColors.textMuted),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Date: ${att['date']} at ${att['time']}',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
                            child: Text(
                              att['status']!.toUpperCase(),
                              style: TextStyle(color: fg, fontSize: 10.5, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }

  Widget _metricStat(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11.5)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(6)),
          child: Text(
            value,
            style: const TextStyle(color: Colors.black87, fontSize: 10.5, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _buildKeypad() {
    return Column(
      children: [
        Row(children: [_keyBtn('1'), _keyBtn('2'), _keyBtn('3')]),
        const SizedBox(height: 8),
        Row(children: [_keyBtn('4'), _keyBtn('5'), _keyBtn('6')]),
        const SizedBox(height: 8),
        Row(children: [_keyBtn('7'), _keyBtn('8'), _keyBtn('9')]),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextButton(
                onPressed: () => setState(() => _pinController.clear()),
                child: const Text('Clear', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.bold)),
              ),
            ),
            _keyBtn('0'),
            Expanded(
              child: IconButton(
                icon: const Icon(Icons.backspace_outlined, color: LaasyaColors.primary),
                onPressed: _onKeypadBackspace,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _keyBtn(String val) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        height: 42,
        child: OutlinedButton(
          style: OutlinedButton.styleFrom(
            side: BorderSide(color: Colors.grey.shade300),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: EdgeInsets.zero,
          ),
          onPressed: () => _onKeypadTap(val),
          child: Text(
            val,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
        ),
      ),
    );
  }
}

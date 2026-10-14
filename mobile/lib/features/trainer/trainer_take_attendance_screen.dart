import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../../core/services/alarm_service.dart';
import 'trainer_data_store.dart';

class TrainerTakeAttendanceScreen extends StatefulWidget {
  final Map<String, dynamic> classInfo;

  const TrainerTakeAttendanceScreen({
    super.key,
    required this.classInfo,
  });

  @override
  State<TrainerTakeAttendanceScreen> createState() => _TrainerTakeAttendanceScreenState();
}

class _TrainerTakeAttendanceScreenState extends State<TrainerTakeAttendanceScreen> {
  final TrainerDataStore _store = TrainerDataStore();
  late String _batchId;
  late List<dynamic> _students;
  String _searchQuery = '';
  bool _isSaving = false;
  late String _currentStatus; // 'not_started' | 'in_progress' | 'submitted'

  @override
  void initState() {
    super.initState();
    _batchId = widget.classInfo['batch_id'] as String;
    _students = widget.classInfo['students'] as List<dynamic>;
    _currentStatus = _store.getSessionStatus(_batchId);
  }

  void _startAttendanceSession() {
    setState(() {
      _store.startAttendance(_batchId);
      _currentStatus = 'in_progress';
    });
  }

  void _enableEditing() {
    setState(() {
      _store.enableEditAttendance(_batchId);
      _currentStatus = 'in_progress';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Attendance unlocked for editing today.'),
        backgroundColor: LaasyaColors.primary,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _markAll(String status) {
    setState(() {
      _store.markAllInBatch(_batchId, _students, status);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('All disciples marked as ${status.toUpperCase()}'),
        backgroundColor: status == 'present' ? const Color(0xFF03543F) : const Color(0xFF991B1B),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _submitAttendance() async {
    setState(() => _isSaving = true);
    _store.submitAttendance(_batchId);

    try {
      final prof = SupabaseService().currentUserProfile;
      final guruName = prof?['full_name'] ?? 'Assigned Guru';
      final records = _students.map((s) {
        final st = _store.getStudentStatus(_batchId, s['id']);
        return {
          'student_id': s['id'],
          'name': s['name'],
          'roll': s['roll'],
          'status': st.isEmpty ? 'present' : st,
        };
      }).toList();

      final uri = Uri.parse('${ApiConstants.baseUrl}/api/attendance');
      final resp = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'batch_id': _batchId,
          'batch_name': widget.classInfo['batch_name'] ?? 'Batch',
          'course_id': widget.classInfo['course_id'] ?? '',
          'course_title': widget.classInfo['course_title'] ?? 'Classical Dance',
          'trainer_name': guruName,
          'records': records,
        }),
      ).timeout(const Duration(seconds: 15));
      if (resp.statusCode == 200) {
        debugPrint('Attendance successfully synced to database: ${resp.body}');
      } else {
        debugPrint('Attendance sync warning (${resp.statusCode}): ${resp.body}');
      }
    } catch (e) {
      debugPrint('Error syncing attendance to backend API: $e');
    }

    SupabaseService().notifyAttendanceUpdated();

    if (!mounted) return;
    setState(() {
      _isSaving = false;
      _currentStatus = 'submitted';
    });

    final presentCount = _students.where((s) => _store.getStudentStatus(_batchId, s['id']) == 'present').length;
    final absentCount = _students.where((s) => _store.getStudentStatus(_batchId, s['id']) == 'absent').length;

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
              'Roll-call for ${widget.classInfo['course_short_title']} • ${widget.classInfo['batch_name']} has been recorded.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12.5, color: Colors.black87, height: 1.4),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF9F5F8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF0D5E4)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _summaryPill('Present', '$presentCount', const Color(0xFF03543F)),
                  _summaryPill('Absent', '$absentCount', const Color(0xFF991B1B)),
                  _summaryPill('Total', '${_students.length}', LaasyaColors.primary),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFF92400E)),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'You can edit today\'s attendance until 11:59 PM today.',
                      style: TextStyle(fontSize: 10.5, color: Color(0xFF92400E), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: LaasyaColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Done for Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCloseClassConfirmation() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.notifications_active_rounded, color: Color(0xFF8A064D), size: 24),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Class Completed • Close Session?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Closing the session for ${widget.classInfo['course_short_title']} (${widget.classInfo['batch_name']}) will sound the custom pickup chime ("Class is over, hooray hooray!") and notify relevant students and parents for child pickup.',
              style: const TextStyle(fontSize: 13, height: 1.45, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF2F8),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFF0D5E4)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.music_note_rounded, size: 18, color: Color(0xFF8A064D)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Vocal child pickup chime will play and alert parents to collect their children.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF8A064D), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              // Play custom vocal pickup chime immediately on Guru's device
              AlarmService.playClassCompletedSound();

              setState(() {
                _store.closeClassSession(
                  batchId: _batchId,
                  batchName: widget.classInfo['batch_name'] ?? 'Batch Session',
                  courseTitle: widget.classInfo['course_short_title'] ?? 'Classical Dance',
                );
                _currentStatus = 'closed';
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Class Completed! Pickup vocal chime broadcasted to parents.'),
                  backgroundColor: Color(0xFF03543F),
                  duration: Duration(seconds: 4),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF590231),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Class Completed (Alert Parents)', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _summaryPill(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.w600)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final todayFormatted = DateFormat('EEEE, d MMMM yyyy').format(now);
    final themeColor = widget.classInfo['course_color'] as Color? ?? LaasyaColors.primary;
    final courseShortTitle = widget.classInfo['course_short_title'] as String;
    final batchName = widget.classInfo['batch_name'] as String;
    final batchNumber = widget.classInfo['batch_number'] as String? ?? 'Batch';
    final timings = widget.classInfo['timings'] as String;
    final room = widget.classInfo['room'] as String;

    final filteredStudents = _students.where((s) {
      if (_searchQuery.trim().isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return s['name'].toString().toLowerCase().contains(q) ||
          s['roll'].toString().toLowerCase().contains(q);
    }).toList();

    final presentCount = _students.where((s) => _store.getStudentStatus(_batchId, s['id']) == 'present').length;
    final absentCount = _students.where((s) => _store.getStudentStatus(_batchId, s['id']) == 'absent').length;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        title: Text('Roll-Call: $courseShortTitle'),
        actions: [
          if (_currentStatus == 'submitted')
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit Today\'s Attendance',
              onPressed: _enableEditing,
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. CLASS HEADER CARD WITH DATE & TIMINGS
            // =================================================================
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [themeColor, themeColor.withOpacity(0.85)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: themeColor.withOpacity(0.3),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top tag row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.5)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.event_available_rounded, color: LaasyaColors.accentGold, size: 14),
                            const SizedBox(width: 6),
                            Text(
                              todayFormatted.toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: _currentStatus == 'submitted'
                              ? const Color(0xFFDEF7EC)
                              : (_currentStatus == 'in_progress' ? const Color(0xFFFEF3C7) : Colors.white24),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _currentStatus == 'submitted'
                              ? 'SUBMITTED'
                              : (_currentStatus == 'in_progress' ? 'IN PROGRESS' : 'NOT STARTED'),
                          style: TextStyle(
                            color: _currentStatus == 'submitted'
                                ? const Color(0xFF03543F)
                                : (_currentStatus == 'in_progress' ? const Color(0xFF92400E) : Colors.white),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Course & Batch Title
                  Text(
                    widget.classInfo['course_title'] as String,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$batchNumber: $batchName',
                    style: const TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),

                  // Timings & Room Pill
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.access_time_rounded, color: Colors.white, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          timings,
                          style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 12),
                        const Text('•', style: TextStyle(color: Colors.white70)),
                        const SizedBox(width: 12),
                        const Icon(Icons.room_rounded, color: Colors.white70, size: 15),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            room,
                            style: const TextStyle(color: Colors.white70, fontSize: 11.5),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 2. STATE: NOT STARTED
            // =================================================================
            if (_currentStatus == 'not_started') ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFF0D5E4)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 3)),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: themeColor.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.how_to_reg_rounded, size: 42, color: themeColor),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Ready to Take Attendance',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${_students.length} disciples enrolled in this batch for today\'s session. Tap below to start taking attendance.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 12.5, color: Colors.black54),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: _startAttendanceSession,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: themeColor,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 2,
                        ),
                        icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 22),
                        label: const Text(
                          'Start Attendance',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ]

            // =================================================================
            // 3. STATE: SUBMITTED or CLOSED (Editable till end of day)
            // =================================================================
            else if (_currentStatus == 'submitted' || _currentStatus == 'closed') ...[
              // Summary Stats
              Row(
                children: [
                  _statBadge('Present', '$presentCount', const Color(0xFFDEF7EC), const Color(0xFF03543F)),
                  const SizedBox(width: 8),
                  _statBadge('Absent', '$absentCount', const Color(0xFFFDE8E8), const Color(0xFF991B1B)),
                  const SizedBox(width: 8),
                  _statBadge('Total', '${_students.length}', const Color(0xFFF3E8EE), LaasyaColors.primary),
                ],
              ),

              const SizedBox(height: 16),

              // Close Class & Alert Parents Container (On top of student list)
              if (_currentStatus != 'closed') ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF2F8),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFF0D5E4), width: 1.2),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF590231).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.notifications_active_rounded, color: Color(0xFF590231), size: 20),
                          ),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Text(
                              'Conclude Session & Alert Parents',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF590231)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Finished today\'s class? Tap below to conclude this session and broadcast a 10-second pickup attention alarm to parent & student mobile phones.',
                        style: TextStyle(fontSize: 12, color: Colors.black87, height: 1.35),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: _showCloseClassConfirmation,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF590231),
                            foregroundColor: Colors.white,
                            elevation: 2,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(Icons.notifications_active_rounded, size: 18),
                          label: const Text(
                            'Class Completed • Alert Parents',
                            style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDEF7EC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF31C48D).withOpacity(0.6)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle_rounded, color: Color(0xFF03543F), size: 22),
                      SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Class Session Concluded • Parents Alerted',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF03543F), fontSize: 13),
                            ),
                            SizedBox(height: 2),
                            Text(
                              '10-second pickup attention alarm chime was broadcast to parents\' devices.',
                              style: TextStyle(fontSize: 11, color: Color(0xFF03543F)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 16),

              // Read-only roster view with option to edit
              const Text(
                'Recorded Disciples Roster',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
              ),
              const SizedBox(height: 8),

              ..._students.map((stu) {
                final sId = stu['id'];
                final status = _store.getStudentStatus(_batchId, sId);
                final isPresent = status == 'present';
                final isAbsent = status == 'absent';
                final isUnmarked = status.isEmpty;

                    final rawAvatar = stu['avatar_url']?.toString().trim();
                    final hasPhoto = rawAvatar != null && rawAvatar.isNotEmpty && !rawAvatar.contains('unsplash.com');

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isPresent
                              ? const Color(0xFF31C48D).withOpacity(0.5)
                              : isAbsent
                                  ? const Color(0xFFF98080).withOpacity(0.5)
                                  : Colors.grey.shade300,
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: isPresent
                                ? const Color(0xFFDEF7EC)
                                : isAbsent
                                    ? const Color(0xFFFDE8E8)
                                    : Colors.grey.shade100,
                            backgroundImage: hasPhoto ? NetworkImage(rawAvatar) : null,
                            child: hasPhoto
                                ? null
                                : Icon(
                                    Icons.person_rounded,
                                    size: 18,
                                    color: isPresent
                                        ? const Color(0xFF03543F)
                                        : isAbsent
                                            ? const Color(0xFF991B1B)
                                            : Colors.grey.shade700,
                                  ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(stu['name']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                                Text(stu['roll']!, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: isPresent
                                  ? const Color(0xFFDEF7EC)
                                  : isAbsent
                                      ? const Color(0xFFFDE8E8)
                                      : Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isUnmarked ? 'NOT MARKED' : (isPresent ? 'PRESENT' : 'ABSENT'),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: isPresent
                                    ? const Color(0xFF03543F)
                                    : isAbsent
                                        ? const Color(0xFF991B1B)
                                        : Colors.grey.shade700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),

                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton.icon(
                      onPressed: _enableEditing,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: themeColor,
                        side: BorderSide(color: themeColor, width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        backgroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.edit_calendar_rounded, size: 18),
                      label: const Text('Edit Attendance of Today', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                    ),
                  ),
            ]

            // =================================================================
            // 4. STATE: IN PROGRESS (Taking / Editing Attendance)
            // =================================================================
            else ...[
              // Live Stats & Bulk Actions Row
              Row(
                children: [
                  _statBadge('Present', '$presentCount', const Color(0xFFDEF7EC), const Color(0xFF03543F)),
                  const SizedBox(width: 8),
                  _statBadge('Absent', '$absentCount', const Color(0xFFFDE8E8), const Color(0xFF991B1B)),
                  const Spacer(),
                  PopupMenuButton<String>(
                    onSelected: (val) {
                      if (val == 'all_present') _markAll('present');
                      if (val == 'all_absent') _markAll('absent');
                    },
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(
                        value: 'all_present',
                        child: Row(
                          children: [
                            Icon(Icons.done_all_rounded, color: Color(0xFF03543F), size: 18),
                            SizedBox(width: 8),
                            Text('Mark All Present'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'all_absent',
                        child: Row(
                          children: [
                            Icon(Icons.remove_circle_outline_rounded, color: Color(0xFF991B1B), size: 18),
                            SizedBox(width: 8),
                            Text('Mark All Absent'),
                          ],
                        ),
                      ),
                    ],
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF2F8),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFF0D5E4)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.tune_rounded, size: 15, color: LaasyaColors.primary),
                          SizedBox(width: 6),
                          Text(
                            'Bulk Action',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_drop_down, size: 18, color: LaasyaColors.primary),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Search Box
              TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Search disciple by name or roll number...',
                  hintStyle: TextStyle(fontSize: 12.5, color: Colors.grey.shade500),
                  prefixIcon: const Icon(Icons.search_rounded, size: 18, color: Colors.grey),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 16),
                          onPressed: () => setState(() => _searchQuery = ''),
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 14),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFF0D5E4)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFF0D5E4)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: themeColor, width: 1.5),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Disciples List Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Mark Attendance (${filteredStudents.length} Disciples)',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                  ),
                  TextButton.icon(
                    onPressed: () => _markAll('present'),
                    icon: const Icon(Icons.done_all_rounded, size: 14, color: LaasyaColors.primary),
                    label: const Text(
                      'All Present',
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),

              // Disciples List (NO LATE STATUS!)
              ...filteredStudents.map((stu) {
                final sId = stu['id'];
                final status = _store.getStudentStatus(_batchId, sId);
                final isPresent = status == 'present';
                final isAbsent = status == 'absent';
                final isUnmarked = status.isEmpty;
                final rawAvatar = stu['avatar_url']?.toString().trim();
                final hasPhoto = rawAvatar != null && rawAvatar.isNotEmpty && !rawAvatar.contains('unsplash.com');

                return Container(
                  margin: const EdgeInsets.only(bottom: 9),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isPresent
                          ? const Color(0xFF31C48D).withOpacity(0.6)
                          : isAbsent
                              ? const Color(0xFFF98080).withOpacity(0.6)
                              : const Color(0xFFE5E7EB),
                      width: isUnmarked ? 1.0 : 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: themeColor.withOpacity(0.12),
                        backgroundImage: hasPhoto ? NetworkImage(rawAvatar) : null,
                        child: hasPhoto
                            ? null
                            : Icon(
                                Icons.person_rounded,
                                size: 22,
                                color: themeColor.withOpacity(0.7),
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
                            Row(
                              children: [
                                Text(
                                  stu['roll']!,
                                  style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: (stu['rate'] >= 90) ? const Color(0xFFDEF7EC) : const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    '${stu['rate']}% Overall',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: (stu['rate'] >= 90) ? const Color(0xFF03543F) : const Color(0xFF92400E),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // 2-Way Toggle: P (Present) & A (Absent) ONLY. Unmarked disciples have neither selected.
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _statusToggleButton(
                            label: 'P',
                            fullLabel: 'Present',
                            isSelected: isPresent,
                            selectedBg: const Color(0xFFDEF7EC),
                            selectedFg: const Color(0xFF03543F),
                            borderColor: const Color(0xFF31C48D),
                            onTap: () {
                              setState(() {
                                _store.setStudentStatus(_batchId, sId, 'present');
                              });
                            },
                          ),
                          const SizedBox(width: 8),
                          _statusToggleButton(
                            label: 'A',
                            fullLabel: 'Absent',
                            isSelected: isAbsent,
                            selectedBg: const Color(0xFFFDE8E8),
                            selectedFg: const Color(0xFF991B1B),
                            borderColor: const Color(0xFFF98080),
                            onTap: () {
                              setState(() {
                                _store.setStudentStatus(_batchId, sId, 'absent');
                              });
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }),

              const SizedBox(height: 20),

              // Submit & Save Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _submitAttendance,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: themeColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 2,
                  ),
                  icon: _isSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.check_circle_outline_rounded, color: Colors.white),
                  label: Text(
                    _isSaving ? 'Submitting & Saving...' : 'Submit & Save Attendance',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Notice Footer
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, size: 16, color: Colors.grey),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Attendance is managed only for the current day. Next day\'s schedule will appear automatically.',
                      style: TextStyle(fontSize: 11, color: Colors.black54),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statBadge(String label, String value, Color bg, Color text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$label: ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: text)),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: text)),
        ],
      ),
    );
  }

  Widget _statusToggleButton({
    required String label,
    required String fullLabel,
    required bool isSelected,
    required Color selectedBg,
    required Color selectedFg,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: isSelected ? selectedBg : Colors.grey.shade50,
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
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isSelected ? selectedFg : Colors.grey.shade600,
            ),
          ),
        ),
      ),
    );
  }
}

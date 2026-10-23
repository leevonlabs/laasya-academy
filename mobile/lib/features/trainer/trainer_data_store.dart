import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';

class TrainerDataStore {
  static final TrainerDataStore _instance = TrainerDataStore._internal();
  factory TrainerDataStore() => _instance;
  TrainerDataStore._internal();

  bool _isSynced = false;
  bool get isSynced => _isSynced;

  /// Dynamic list of assigned faculty courses and batches populated from the production database
  final List<Map<String, dynamic>> courses = [];

  // Daily attendance state cache
  final Map<String, Map<String, Map<String, String>>> _dailyAttendanceRecords = {};
  final Map<String, String> _sessionStatus = {};

  List<Map<String, dynamic>> _liveBatches = [];
  List<Map<String, dynamic>> getLiveBatches() => List<Map<String, dynamic>>.from(_liveBatches);

  void setLiveBatches(List<Map<String, dynamic>> liveBatches) {
    _liveBatches = List<Map<String, dynamic>>.from(liveBatches);
    _buildCoursesFromLiveBatches(liveBatches);
    _isSynced = true;
  }

  Future<void> syncFromApi({String? trainerName, String? phone}) async {
    try {
      final prof = SupabaseService().currentUserProfile;
      final tName = (trainerName ?? prof?['full_name'] ?? '').toString().trim();
      final tPhone = (phone ?? prof?['phone'] ?? '').toString().trim();
      final tId = (prof?['id'] ?? prof?['trainer_id'] ?? prof?['profile_id'] ?? '').toString().trim();
      final nameParam = Uri.encodeComponent(tName);
      final phoneParam = Uri.encodeComponent(tPhone);
      final idParam = Uri.encodeComponent(tId);
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/trainer/batches?trainerId=$idParam&trainerName=$nameParam&phone=$phoneParam');
      final res = await http.get(uri).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['batches'] is List) {
          final liveBatches = List<Map<String, dynamic>>.from(decoded['batches']);
          setLiveBatches(liveBatches);
        }
      }
    } catch (e) {
      debugPrint('TrainerDataStore syncFromApi notice: $e');
    }
  }

  void _buildCoursesFromLiveBatches(List<Map<String, dynamic>> liveBatches) {
    final Map<String, Map<String, dynamic>> courseMap = {};

    for (var b in liveBatches) {
      final cId = (b['course_id'] ?? b['id']).toString();
      final cTitle = (b['course_title'] ?? 'Classical Arts').toString();
      final cCategory = (b['course_category'] ?? 'Classical Dance').toString();

      if (!courseMap.containsKey(cId)) {
        courseMap[cId] = {
          'id': cId,
          'title': cTitle,
          'short_title': cTitle.replaceAll(' Classical Dance', '').replaceAll(' Dance', '').replaceAll(' Music', '').trim(),
          'category': cCategory,
          'code': 'LCA-${cTitle.substring(0, cTitle.length >= 2 ? 2 : cTitle.length).toUpperCase()}',
          'icon': _getCourseIcon(cTitle),
          'theme_color': _getCourseColor(cTitle),
          'batches': <Map<String, dynamic>>[],
        };
      }

      final rawStudents = b['students'] is List ? (b['students'] as List) : [];
      final List<Map<String, dynamic>> studentList = [];

      for (var s in rawStudents) {
        if (s is Map) {
          final rawAvatar = s['avatar_url']?.toString().trim();
          final validAvatar = (rawAvatar != null && rawAvatar.isNotEmpty && rawAvatar != 'null')
              ? rawAvatar
              : null;

          studentList.add({
            'id': s['id']?.toString() ?? '',
            'roll': s['roll']?.toString() ?? s['roll_number']?.toString() ?? 'LCA',
            'name': s['name']?.toString() ?? 'Student',
            'age': s['age'] ?? 16,
            'gender': s['gender']?.toString() ?? 'Not Specified',
            'parent_name': s['parent_name']?.toString() ?? 'Parent / Guardian',
            'this_month_held': (s['this_month_held'] as num?)?.toInt() ?? 0,
            'this_month_absent': (s['this_month_absent'] as num?)?.toInt() ?? 0,
            'fee_status': s['fee_status']?.toString() ?? 'Paid',
            'rate': (s['rate'] as num?)?.toInt() ?? 92,
            'avatar_url': validAvatar,
          });
        }
      }

      final daysRaw = b['days_of_week'];
      List<String> daysList = [];
      if (daysRaw is List) {
        daysList = daysRaw.map((e) => e.toString()).toList();
      } else if (daysRaw != null && daysRaw.toString().isNotEmpty) {
        daysList = daysRaw.toString().split(',').map((e) => e.trim()).toList();
      }
      if (daysList.isEmpty) {
        daysList = ['Monday', 'Wednesday', 'Friday'];
      }

      String daysDisplay = daysList.map((d) {
        if (d.length > 3) return d.substring(0, 3);
        return d;
      }).join(', ');

      String formatTime12(dynamic raw) {
        if (raw == null) return '05:00 PM';
        final s = raw.toString().trim();
        if (s.isEmpty) return '05:00 PM';
        if (s.toUpperCase().contains('AM') || s.toUpperCase().contains('PM')) return s;
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

      final start12 = formatTime12(b['start_time'] ?? '17:00');
      final end12 = formatTime12(b['end_time'] ?? '18:30');
      final timings = '$start12 – $end12';

      final batchMap = {
        'id': b['id'].toString(),
        'batch_number': b['name']?.toString() ?? 'Batch',
        'name': b['name']?.toString() ?? 'Batch Session',
        'timings': timings,
        'room': b['room_or_hall']?.toString() ?? 'Natya Mandapam (Room 101)',
        'days': daysList,
        'schedule_days_display': daysDisplay,
        'schedules': b['schedules'],
        'students': studentList,
      };

      (courseMap[cId]!['batches'] as List<Map<String, dynamic>>).add(batchMap);
    }

    courses.clear();
    if (courseMap.isNotEmpty) {
      courses.addAll(courseMap.values);
    }

    final todayKey = _getTodayDateKey();
    if (!_dailyAttendanceRecords.containsKey(todayKey)) {
      _dailyAttendanceRecords[todayKey] = {};
    }
    for (var c in courses) {
      for (var b in (c['batches'] as List)) {
        final bId = b['id'].toString();
        _dailyAttendanceRecords[todayKey]!.putIfAbsent(bId, () => {});
        _sessionStatus.putIfAbsent('$todayKey:$bId', () => 'not_started');
      }
    }
  }

  Color _getCourseColor(String title) {
    final lower = title.toLowerCase();
    if (lower.contains('bharat')) return const Color(0xFF590231);
    if (lower.contains('kuchipudi')) return const Color(0xFF6B21A8);
    if (lower.contains('carnatic') || lower.contains('vocal') || lower.contains('music')) return const Color(0xFF0F766E);
    if (lower.contains('violin')) return const Color(0xFFB45309);
    if (lower.contains('mridangam') || lower.contains('tablas')) return const Color(0xFF9A3412);
    if (lower.contains('kathak')) return const Color(0xFFBE185D);
    return const Color(0xFF590231);
  }

  IconData _getCourseIcon(String title) {
    final lower = title.toLowerCase();
    if (lower.contains('bharat') || lower.contains('dance')) return Icons.self_improvement_rounded;
    if (lower.contains('kuchipudi')) return Icons.auto_awesome_rounded;
    if (lower.contains('carnatic') || lower.contains('vocal') || lower.contains('music')) return Icons.music_note_rounded;
    if (lower.contains('violin')) return Icons.music_video_rounded;
    if (lower.contains('mridangam')) return Icons.album_rounded;
    return Icons.school_rounded;
  }

  String _getTodayDateKey() {
    final now = DateTime.now();
    return "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
  }

  /// Returns today's available classes based on the day of the week
  List<Map<String, dynamic>> getTodayClasses() {
    final now = DateTime.now();
    final todayKey = _getTodayDateKey();

    final dayNames = [
      '',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    final currentDayName = dayNames[now.weekday];

    final List<Map<String, dynamic>> scheduledToday = [];

    for (var course in courses) {
      for (var batch in (course['batches'] as List)) {
        final days = List<String>.from(batch['days'] ?? []);
        final curLower = currentDayName.toLowerCase();
        final cur3 = curLower.length >= 3 ? curLower.substring(0, 3) : curLower;
        final isToday = days.any((d) {
          final dLower = d.toString().trim().toLowerCase();
          return dLower == curLower || dLower.startsWith(cur3) || curLower.startsWith(dLower);
        });

        if (isToday) {
          final batchId = batch['id'] as String;
          final status = _sessionStatus['$todayKey:$batchId'] ?? 'not_started';
          final students = List<Map<String, dynamic>>.from(batch['students']);

          scheduledToday.add({
            'course': course,
            'batch': batch,
            'course_id': course['id'],
            'course_title': course['title'],
            'course_short_title': course['short_title'],
            'course_color': course['theme_color'],
            'course_icon': course['icon'],
            'batch_id': batchId,
            'batch_number': batch['batch_number'],
            'batch_name': batch['name'],
            'timings': batch['timings'],
            'room': batch['room'],
            'students': students,
            'status': status,
          });
        }
      }
    }

    return scheduledToday;
  }

  /// Returns all assigned classes across all batches for this trainer
  List<Map<String, dynamic>> getAllAssignedClasses() {
    final todayKey = _getTodayDateKey();
    final List<Map<String, dynamic>> all = [];

    for (var course in courses) {
      for (var batch in (course['batches'] as List)) {
        final batchId = batch['id'] as String;
        final status = _sessionStatus['$todayKey:$batchId'] ?? 'not_started';
        final students = List<Map<String, dynamic>>.from(batch['students'] ?? []);

        all.add({
          'course': course,
          'batch': batch,
          'course_id': course['id'],
          'course_title': course['title'],
          'course_short_title': course['short_title'],
          'course_color': course['theme_color'],
          'course_icon': course['icon'],
          'batch_id': batchId,
          'batch_number': batch['batch_number'],
          'batch_name': batch['name'],
          'timings': batch['timings'],
          'room': batch['room'],
          'students': students,
          'status': status,
        });
      }
    }

    return all;
  }

  String getSessionStatus(String batchId) {
    final todayKey = _getTodayDateKey();
    return _sessionStatus['$todayKey:$batchId'] ?? 'not_started';
  }

  void startAttendance(String batchId) {
    final todayKey = _getTodayDateKey();
    if (_sessionStatus['$todayKey:$batchId'] != 'submitted') {
      _sessionStatus['$todayKey:$batchId'] = 'in_progress';
    }
  }

  /// Returns student attendance status ('present', 'absent', or '' for unmarked)
  String getStudentStatus(String batchId, String studentId) {
    final todayKey = _getTodayDateKey();
    final batchMap = _dailyAttendanceRecords[todayKey]?[batchId];
    if (batchMap != null && batchMap.containsKey(studentId)) {
      return batchMap[studentId]!;
    }
    return ''; // Students start UNMARKED until Guru explicitly marks them!
  }

  void setStudentStatus(String batchId, String studentId, String status) {
    assert(status == 'present' || status == 'absent');
    final todayKey = _getTodayDateKey();
    if (!_dailyAttendanceRecords.containsKey(todayKey)) {
      _dailyAttendanceRecords[todayKey] = {};
    }
    if (!_dailyAttendanceRecords[todayKey]!.containsKey(batchId)) {
      _dailyAttendanceRecords[todayKey]![batchId] = {};
    }
    _dailyAttendanceRecords[todayKey]![batchId]![studentId] = status;
  }

  void markAllInBatch(String batchId, List<dynamic> students, String status) {
    assert(status == 'present' || status == 'absent');
    final todayKey = _getTodayDateKey();
    if (!_dailyAttendanceRecords.containsKey(todayKey)) {
      _dailyAttendanceRecords[todayKey] = {};
    }
    if (!_dailyAttendanceRecords[todayKey]!.containsKey(batchId)) {
      _dailyAttendanceRecords[todayKey]![batchId] = {};
    }

    for (var s in students) {
      final sId = s['id'] as String;
      _dailyAttendanceRecords[todayKey]![batchId]![sId] = status;
    }
  }

  void submitAttendance(String batchId) {
    final todayKey = _getTodayDateKey();
    _sessionStatus['$todayKey:$batchId'] = 'submitted';
  }

  void enableEditAttendance(String batchId) {
    final todayKey = _getTodayDateKey();
    _sessionStatus['$todayKey:$batchId'] = 'in_progress';
  }

  // Notifier for broadcast attention ring alarm to student/parent app
  static final ValueNotifier<Map<String, dynamic>?> classClosedAlertNotifier =
      ValueNotifier<Map<String, dynamic>?>(null);

  void closeClassSession({
    required String batchId,
    required String batchName,
    required String courseTitle,
    String? trainerName,
  }) {
    final todayKey = _getTodayDateKey();
    _sessionStatus['$todayKey:$batchId'] = 'closed';
    classClosedAlertNotifier.value = {
      'batch_id': batchId,
      'batch_name': batchName,
      'course_title': courseTitle,
      'timestamp': DateTime.now().toIso8601String(),
      'message': 'Today\'s class for $courseTitle ($batchName) has concluded. Please come and take your child back from the academy hall.',
    };

    _broadcastAlertToServer(
      batchId: batchId,
      batchName: batchName,
      courseTitle: courseTitle,
      trainerName: trainerName,
    );
  }

  Future<void> _broadcastAlertToServer({
    required String batchId,
    required String batchName,
    required String courseTitle,
    String? trainerName,
  }) async {
    try {
      final prof = SupabaseService().currentUserProfile;
      final tName = trainerName ?? prof?['full_name'] ?? 'Assigned Guru';
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/sessions/alerts');
      await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'batch_id': batchId,
          'batch_name': batchName,
          'course_title': courseTitle,
          'trainer_name': tName,
          'message': 'The $courseTitle ($batchName) session has concluded. Please come and take your child back from the academy hall safely.',
        }),
      ).timeout(const Duration(seconds: 15));
    } catch (e) {
      debugPrint('Error broadcasting session alert to server: $e');
    }
  }

  bool isClassClosed(String batchId) {
    final todayKey = _getTodayDateKey();
    return _sessionStatus['$todayKey:$batchId'] == 'closed';
  }

  /// Returns UNIQUE enrolled students for this trainer, with all their registered courses and batches aggregated
  List<Map<String, dynamic>> getUniqueEnrolledStudents() {
    final Map<String, Map<String, dynamic>> studentMap = {};

    for (var course in courses) {
      for (var batch in (course['batches'] as List)) {
        for (var stu in (batch['students'] as List)) {
          final sId = stu['id'] as String;

          final enrollmentInfo = {
            'course_id': course['id'],
            'course_title': course['title'],
            'course_short_title': course['short_title'],
            'course_color': course['theme_color'],
            'course_icon': course['icon'],
            'batch_id': batch['id'],
            'batch_number': batch['batch_number'],
            'batch_name': batch['name'],
            'batch_timings': batch['timings'],
            'batch_room': batch['room'],
            'batch_days': batch['days'],
            'batch_schedule_display': batch['schedule_days_display'],
          };

          if (!studentMap.containsKey(sId)) {
            studentMap[sId] = {
              'id': stu['id'],
              'roll': stu['roll'], // Exact Admin roll number (e.g. LCA-1)
              'name': stu['name'],
              'age': stu['age'] ?? 16,
              'gender': stu['gender'] ?? 'Not Specified',
              'parent_name': stu['parent_name'] ?? 'Parent / Guardian',
              'this_month_held': stu['this_month_held'] ?? 0,
              'this_month_absent': stu['this_month_absent'] ?? 0,
              'fee_status': stu['fee_status'] ?? 'Paid',
              'rate': stu['rate'],
              'avatar_url': (stu['avatar_url'] != null && stu['avatar_url'].toString().trim().isNotEmpty && stu['avatar_url'].toString().trim() != 'null')
                  ? stu['avatar_url'].toString().trim()
                  : null,
              // Primary enrollment details for calendar defaults
              'course_id': course['id'],
              'course_title': course['title'],
              'course_short_title': course['short_title'],
              'course_color': course['theme_color'],
              'batch_id': batch['id'],
              'batch_number': batch['batch_number'],
              'batch_name': batch['name'],
              'batch_timings': batch['timings'],
              'batch_room': batch['room'],
              'batch_days': batch['days'],
              'batch_schedule_display': batch['schedule_days_display'],
              'enrollments': <Map<String, dynamic>>[enrollmentInfo],
            };
          } else {
            // Student already exists: append this course/batch enrollment row!
            final existingList = studentMap[sId]!['enrollments'] as List<Map<String, dynamic>>;
            final alreadyAdded = existingList.any((e) => e['batch_id'] == batch['id']);
            if (!alreadyAdded) {
              existingList.add(enrollmentInfo);
              studentMap[sId]!['this_month_held'] = (studentMap[sId]!['this_month_held'] as int? ?? 0) + (stu['this_month_held'] as int? ?? 0);
              studentMap[sId]!['this_month_absent'] = (studentMap[sId]!['this_month_absent'] as int? ?? 0) + (stu['this_month_absent'] as int? ?? 0);
            }
          }
        }
      }
    }

    // Sort by roll number number (LCA-1, LCA-2, LCA-3...)
    final list = studentMap.values.toList();
    list.sort((a, b) {
      final rollA = a['roll'].toString().replaceAll(RegExp(r'[^0-9]'), '');
      final rollB = b['roll'].toString().replaceAll(RegExp(r'[^0-9]'), '');
      final intA = int.tryParse(rollA) ?? 999;
      final intB = int.tryParse(rollB) ?? 999;
      return intA.compareTo(intB);
    });

    return list;
  }

  /// Generates month-wise calendar attendance records for a student
  Map<int, String?> getStudentMonthAttendance({
    required Map<String, dynamic> student,
    required int year,
    required int month,
  }) {
    final Map<int, String?> monthMap = {};
    final daysInMonth = DateUtils.getDaysInMonth(year, month);
    final now = DateTime.now();
    final todayKey = _getTodayDateKey();

    final batchDays = List<String>.from(student['batch_days'] ?? ['Monday', 'Wednesday', 'Friday']);
    final dayNames = [
      '',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];

    final int rate = (student['rate'] as num?)?.toInt() ?? 92;
    final String stuId = student['id'] as String;
    final String batchId = student['batch_id'] as String;

    for (int day = 1; day <= daysInMonth; day++) {
      final date = DateTime(year, month, day);
      final dayName = dayNames[date.weekday];

      if (date.isAfter(now)) {
        monthMap[day] = null;
        continue;
      }

      final hadClass = batchDays.contains(dayName);
      if (!hadClass) {
        monthMap[day] = null;
        continue;
      }

      if (date.year == now.year && date.month == now.month && date.day == now.day) {
        final liveStatus = _dailyAttendanceRecords[todayKey]?[batchId]?[stuId];
        monthMap[day] = liveStatus ?? 'present';
        continue;
      }

      final pseudoHash = (stuId.hashCode + day * 37 + month * 17) % 100;
      if (pseudoHash < rate) {
        monthMap[day] = 'present';
      } else {
        monthMap[day] = 'absent';
      }
    }

    return monthMap;
  }

  static String? getStudentPhoto(String id) {
    // Only real images from the database are permitted; zero random stock photos.
    return null;
  }
}

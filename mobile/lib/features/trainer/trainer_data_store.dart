import 'package:flutter/material.dart';

class TrainerDataStore {
  static final TrainerDataStore _instance = TrainerDataStore._internal();
  factory TrainerDataStore() => _instance;
  TrainerDataStore._internal() {
    _initializeData();
  }

  // 3 Faculty Disciplines handled by Guru Smt. Anusha Sumesh
  final List<Map<String, dynamic>> courses = [
    {
      'id': 'c-bharatanatyam',
      'title': 'Bharatanatyam Classical Dance',
      'short_title': 'Bharatanatyam',
      'category': 'Classical Dance',
      'code': 'LCA-BN',
      'icon': Icons.self_improvement_rounded,
      'theme_color': const Color(0xFF590231),
      'batches': [
        {
          'id': 'bn-b1',
          'batch_number': 'Batch #1',
          'name': 'Batch A: Morning Beginners (Adavu)',
          'timings': '07:00 AM - 08:30 AM',
          'room': 'Natya Mandapam (Room 101)',
          'days': ['Monday', 'Wednesday', 'Friday'],
          'schedule_days_display': 'Mon, Wed, Fri',
          'students': [
            {'id': 'stu-1', 'roll': 'LCA-1', 'name': 'Ananya Rao', 'phone': '+91 99123 45678', 'parent_name': 'Sri Ramesh Rao', 'parent_phone': '+91 99123 00001', 'rate': 94},
            {'id': 'stu-3', 'roll': 'LCA-3', 'name': 'Sneha Reddy', 'phone': '+91 99123 45680', 'parent_name': 'Dr. K. V. Reddy', 'parent_phone': '+91 99123 00002', 'rate': 88},
            {'id': 'stu-5', 'roll': 'LCA-5', 'name': 'Meera Nambiar', 'phone': '+91 99123 45682', 'parent_name': 'Sri Govind Nambiar', 'parent_phone': '+91 99123 00003', 'rate': 96},
            {'id': 'stu-8', 'roll': 'LCA-8', 'name': 'Diya Ramaswamy', 'phone': '+91 98450 11223', 'parent_name': 'Sri Ramaswamy K', 'parent_phone': '+91 98450 00004', 'rate': 91},
            {'id': 'stu-10', 'roll': 'LCA-10', 'name': 'Kavya Suresh', 'phone': '+91 97410 44556', 'parent_name': 'Smt. Suresh M', 'parent_phone': '+91 97410 00005', 'rate': 85},
            {'id': 'stu-16', 'roll': 'LCA-16', 'name': 'Bhavana Varma', 'phone': '+91 99450 12345', 'parent_name': 'Sri Varma K', 'parent_phone': '+91 99450 00041', 'rate': 93},
          ]
        },
        {
          'id': 'bn-b2',
          'batch_number': 'Batch #2',
          'name': 'Batch B: Evening Intermediate (Varnam & Jathis)',
          'timings': '05:00 PM - 06:30 PM',
          'room': 'Natya Mandapam (Room 101)',
          'days': ['Tuesday', 'Thursday', 'Saturday'],
          'schedule_days_display': 'Tue, Thu, Sat',
          'students': [
            {'id': 'stu-6', 'roll': 'LCA-6', 'name': 'Aditi Sundaram', 'phone': '+91 98450 00006', 'parent_name': 'Sri Sundaram T', 'parent_phone': '+91 98450 00016', 'rate': 98},
            {'id': 'stu-11', 'roll': 'LCA-11', 'name': 'Pooja Iyer', 'phone': '+91 99123 45686', 'parent_name': 'Smt. Lakshmi Iyer', 'parent_phone': '+91 99123 00017', 'rate': 92},
            {'id': 'stu-12', 'roll': 'LCA-12', 'name': 'Nandini Menon', 'phone': '+91 98860 33441', 'parent_name': 'Sri Menon G', 'parent_phone': '+91 98860 00018', 'rate': 87},
            {'id': 'stu-13', 'roll': 'LCA-13', 'name': 'Shreya Subramanian', 'phone': '+91 97312 88990', 'parent_name': 'Sri Subramanian P', 'parent_phone': '+91 97312 00019', 'rate': 95},
            {'id': 'stu-14', 'roll': 'LCA-14', 'name': 'Malini Hegde', 'phone': '+91 94481 22334', 'parent_name': 'Smt. Hegde S', 'parent_phone': '+91 94481 00020', 'rate': 89},
            {'id': 'stu-15', 'roll': 'LCA-15', 'name': 'Harini Krishnan', 'phone': '+91 96110 55667', 'parent_name': 'Sri Krishnan V', 'parent_phone': '+91 96110 00021', 'rate': 93},
          ]
        },
        {
          'id': 'bn-b3',
          'batch_number': 'Batch #3',
          'name': 'Batch C: Weekend Arangetram Intensive',
          'timings': '09:00 AM - 11:30 AM',
          'room': 'Saraswathi Nilayam (Hall 2)',
          'days': ['Saturday', 'Sunday'],
          'schedule_days_display': 'Saturday & Sunday',
          'students': [
            {'id': 'stu-21', 'roll': 'LCA-21', 'name': 'Keerthana Mohan', 'phone': '+91 99801 11223', 'parent_name': 'Sri Mohan K', 'parent_phone': '+91 99801 00031', 'rate': 96},
            {'id': 'stu-22', 'roll': 'LCA-22', 'name': 'Radhika Balaji', 'phone': '+91 98440 22334', 'parent_name': 'Smt. Balaji R', 'parent_phone': '+91 98440 00032', 'rate': 100},
            {'id': 'stu-23', 'roll': 'LCA-23', 'name': 'Pavithra Sridhar', 'phone': '+91 97390 33445', 'parent_name': 'Sri Sridhar N', 'parent_phone': '+91 97390 00033', 'rate': 91},
            {'id': 'stu-24', 'roll': 'LCA-24', 'name': 'Janani Natarajan', 'phone': '+91 94490 44556', 'parent_name': 'Sri Natarajan G', 'parent_phone': '+91 94490 00034', 'rate': 94},
            {'id': 'stu-25', 'roll': 'LCA-25', 'name': 'Sowmya Raghavan', 'phone': '+91 98801 55667', 'parent_name': 'Smt. Raghavan M', 'parent_phone': '+91 98801 00035', 'rate': 97},
          ]
        },
      ]
    },
    {
      'id': 'c-kuchipudi',
      'title': 'Kuchipudi Classical Dance',
      'short_title': 'Kuchipudi',
      'category': 'Classical Dance',
      'code': 'LCA-KP',
      'icon': Icons.auto_awesome_rounded,
      'theme_color': const Color(0xFF6B21A8),
      'batches': [
        {
          'id': 'kp-b1',
          'batch_number': 'Batch #1',
          'name': 'Batch A: Tarangam Foundation (Plate Dance)',
          'timings': '04:00 PM - 05:30 PM',
          'room': 'Ananda Thandavam Studio (Room 201)',
          'days': ['Monday', 'Wednesday', 'Friday'],
          'schedule_days_display': 'Mon, Wed, Fri',
          'students': [
            {'id': 'stu-16', 'roll': 'LCA-16', 'name': 'Bhavana Varma', 'phone': '+91 99450 12345', 'parent_name': 'Sri Varma K', 'parent_phone': '+91 99450 00041', 'rate': 93},
            {'id': 'stu-3', 'roll': 'LCA-3', 'name': 'Sneha Reddy', 'phone': '+91 99123 45680', 'parent_name': 'Dr. K. V. Reddy', 'parent_phone': '+91 99123 00002', 'rate': 88},
            {'id': 'stu-17', 'roll': 'LCA-17', 'name': 'Lakshmi Prasanna', 'phone': '+91 98451 23456', 'parent_name': 'Sri Prasanna P', 'parent_phone': '+91 98451 00042', 'rate': 90},
            {'id': 'stu-18', 'roll': 'LCA-18', 'name': 'Tejaswi K', 'phone': '+91 97412 34567', 'parent_name': 'Smt. K. Devi', 'parent_phone': '+91 97412 00043', 'rate': 88},
            {'id': 'stu-19', 'roll': 'LCA-19', 'name': 'Sahithi Reddy', 'phone': '+91 96321 45678', 'parent_name': 'Sri Reddy N', 'parent_phone': '+91 96321 00044', 'rate': 95},
            {'id': 'stu-20', 'roll': 'LCA-20', 'name': 'Manasa Raju', 'phone': '+91 95123 56789', 'parent_name': 'Sri Raju G', 'parent_phone': '+91 95123 00045', 'rate': 86},
          ]
        },
        {
          'id': 'kp-b2',
          'batch_number': 'Batch #2',
          'name': 'Batch B: Abhinaya & Shabdam Intermediate',
          'timings': '06:00 PM - 07:30 PM',
          'room': 'Ananda Thandavam Studio (Room 201)',
          'days': ['Tuesday', 'Thursday', 'Saturday'],
          'schedule_days_display': 'Tue, Thu, Sat',
          'students': [
            {'id': 'stu-6', 'roll': 'LCA-6', 'name': 'Aditi Sundaram', 'phone': '+91 98450 00006', 'parent_name': 'Sri Sundaram T', 'parent_phone': '+91 98450 00016', 'rate': 98},
            {'id': 'stu-26', 'roll': 'LCA-26', 'name': 'Gayathri Rao', 'phone': '+91 98800 78901', 'parent_name': 'Sri Rao M', 'parent_phone': '+91 98800 00051', 'rate': 97},
            {'id': 'stu-27', 'roll': 'LCA-27', 'name': 'Nikhila Chowdary', 'phone': '+91 97700 89012', 'parent_name': 'Sri Chowdary B', 'parent_phone': '+91 97700 00052', 'rate': 91},
            {'id': 'stu-28', 'roll': 'LCA-28', 'name': 'Lavanya Murthy', 'phone': '+91 96600 90123', 'parent_name': 'Smt. Murthy S', 'parent_phone': '+91 96600 00053', 'rate': 94},
            {'id': 'stu-29', 'roll': 'LCA-29', 'name': 'Spoorthi Naidu', 'phone': '+91 95500 01234', 'parent_name': 'Sri Naidu P', 'parent_phone': '+91 95500 00054', 'rate': 89},
            {'id': 'stu-30', 'roll': 'LCA-30', 'name': 'Yamini Shastry', 'phone': '+91 94400 12345', 'parent_name': 'Sri Shastry V', 'parent_phone': '+91 94400 00055', 'rate': 96},
          ]
        },
        {
          'id': 'kp-b3',
          'batch_number': 'Batch #3',
          'name': 'Batch C: Vasantha Advanced Solo Performance',
          'timings': '07:30 AM - 09:00 AM',
          'room': 'Saraswathi Nilayam (Hall 2)',
          'days': ['Sunday'],
          'schedule_days_display': 'Sunday Morning',
          'students': [
            {'id': 'stu-31', 'roll': 'LCA-31', 'name': 'Padmavathi Somayaji', 'phone': '+91 99160 23456', 'parent_name': 'Sri Somayaji K', 'parent_phone': '+91 99160 00061', 'rate': 100},
            {'id': 'stu-32', 'roll': 'LCA-32', 'name': 'Sireesha Ganta', 'phone': '+91 98160 34567', 'parent_name': 'Sri Ganta R', 'parent_phone': '+91 98160 00062', 'rate': 95},
            {'id': 'stu-33', 'roll': 'LCA-33', 'name': 'Haritha Kilaru', 'phone': '+91 97160 45678', 'parent_name': 'Sri Kilaru P', 'parent_phone': '+91 97160 00063', 'rate': 92},
            {'id': 'stu-34', 'roll': 'LCA-34', 'name': 'Pranathi Malladi', 'phone': '+91 96160 56789', 'parent_name': 'Sri Malladi S', 'parent_phone': '+91 96160 00064', 'rate': 98},
          ]
        },
      ]
    },
    {
      'id': 'c-carnatic',
      'title': 'Carnatic Vocal Classical Music',
      'short_title': 'Carnatic Vocal',
      'category': 'Vocal & Music',
      'code': 'LCA-CV',
      'icon': Icons.music_note_rounded,
      'theme_color': const Color(0xFF0F766E),
      'batches': [
        {
          'id': 'cv-b1',
          'batch_number': 'Batch #1',
          'name': 'Batch A: Sarali Varisai & Geetham Foundation',
          'timings': '08:00 AM - 09:30 AM',
          'room': 'Sangeetha Shala (Room 102)',
          'days': ['Monday', 'Wednesday', 'Friday'],
          'schedule_days_display': 'Mon, Wed, Fri',
          'students': [
            {'id': 'stu-1', 'roll': 'LCA-1', 'name': 'Ananya Rao', 'phone': '+91 99123 45678', 'parent_name': 'Sri Ramesh Rao', 'parent_phone': '+91 99123 00001', 'rate': 94},
            {'id': 'stu-2', 'roll': 'LCA-2', 'name': 'Varun Teja', 'phone': '+91 98450 77112', 'parent_name': 'Sri Teja K', 'parent_phone': '+91 98450 00071', 'rate': 94},
            {'id': 'stu-4', 'roll': 'LCA-4', 'name': 'Karthik Subramanian', 'phone': '+91 97410 55334', 'parent_name': 'Smt. Narayanan P', 'parent_phone': '+91 97410 00073', 'rate': 88},
            {'id': 'stu-5', 'roll': 'LCA-5', 'name': 'Meera Nambiar', 'phone': '+91 99123 45682', 'parent_name': 'Sri Govind Nambiar', 'parent_phone': '+91 99123 00003', 'rate': 96},
            {'id': 'stu-35', 'roll': 'LCA-35', 'name': 'Arvind Swaminathan', 'phone': '+91 96320 44221', 'parent_name': 'Sri Shankaran R', 'parent_phone': '+91 96320 00074', 'rate': 92},
            {'id': 'stu-36', 'roll': 'LCA-36', 'name': 'Meenakshi Sundaram', 'phone': '+91 99001 66223', 'parent_name': 'Sri Sundaram S', 'parent_phone': '+91 99001 00072', 'rate': 97},
          ]
        },
        {
          'id': 'cv-b2',
          'batch_number': 'Batch #2',
          'name': 'Batch B: Varnams & Keerthanas Intermediate',
          'timings': '04:30 PM - 06:00 PM',
          'room': 'Sangeetha Shala (Room 102)',
          'days': ['Tuesday', 'Thursday', 'Saturday'],
          'schedule_days_display': 'Tue, Thu, Sat',
          'students': [
            {'id': 'stu-11', 'roll': 'LCA-11', 'name': 'Pooja Iyer', 'phone': '+91 99123 45686', 'parent_name': 'Smt. Lakshmi Iyer', 'parent_phone': '+91 99123 00017', 'rate': 92},
            {'id': 'stu-39', 'roll': 'LCA-39', 'name': 'Sudha Raghuram', 'phone': '+91 98860 11998', 'parent_name': 'Sri Raghuram M', 'parent_phone': '+91 98860 00081', 'rate': 95},
            {'id': 'stu-40', 'roll': 'LCA-40', 'name': 'Hariharan Iyer', 'phone': '+91 97312 22887', 'parent_name': 'Sri Iyer B', 'parent_phone': '+91 97312 00082', 'rate': 91},
            {'id': 'stu-41', 'roll': 'LCA-41', 'name': 'Vidya Ramanathan', 'phone': '+91 94481 33776', 'parent_name': 'Smt. Ramanathan S', 'parent_phone': '+91 94481 00083', 'rate': 98},
            {'id': 'stu-38', 'roll': 'LCA-38', 'name': 'Shruti Shankaran', 'phone': '+91 96110 44665', 'parent_name': 'Sri Parthasarathy P', 'parent_phone': '+91 96110 00084', 'rate': 89},
          ]
        },
        {
          'id': 'cv-b3',
          'batch_number': 'Batch #3',
          'name': 'Batch C: Kriti, Neraval & Manodharma Advanced',
          'timings': '06:30 PM - 08:00 PM',
          'room': 'Sangeetha Shala (Room 102)',
          'days': ['Friday', 'Sunday'],
          'schedule_days_display': 'Friday & Sunday',
          'students': [
            {'id': 'stu-42', 'roll': 'LCA-42', 'name': 'Madhavan Chettiar', 'phone': '+91 98440 66332', 'parent_name': 'Sri Chettiar K', 'parent_phone': '+91 98440 00091', 'rate': 100},
            {'id': 'stu-43', 'roll': 'LCA-43', 'name': 'Gayathri Venkataraman', 'phone': '+91 97390 77221', 'parent_name': 'Sri Venkataraman R', 'parent_phone': '+91 97390 00092', 'rate': 96},
            {'id': 'stu-9', 'roll': 'LCA-9', 'name': 'Pranav Bhat', 'phone': '+91 94490 88110', 'parent_name': 'Sri Krishnamurthy P', 'parent_phone': '+91 94490 00093', 'rate': 94},
            {'id': 'stu-37', 'roll': 'LCA-37', 'name': 'Karthik Narayanan', 'phone': '+91 98801 99009', 'parent_name': 'Sri Seshan S', 'parent_phone': '+91 98801 00094', 'rate': 97},
            {'id': 'stu-7', 'roll': 'LCA-7', 'name': 'Rohan Mehra', 'phone': '+91 99123 00887', 'parent_name': 'Sri Gurumurthy M', 'parent_phone': '+91 99123 00095', 'rate': 92},
          ]
        },
      ]
    },
  ];

  // Daily attendance state cache
  final Map<String, Map<String, Map<String, String>>> _dailyAttendanceRecords = {};
  final Map<String, String> _sessionStatus = {};

  void _initializeData() {
    final todayKey = _getTodayDateKey();

    for (var course in courses) {
      for (var batch in (course['batches'] as List)) {
        final batchId = batch['id'] as String;
        final students = batch['students'] as List;

        final key = '$todayKey:$batchId';
        if (!_dailyAttendanceRecords.containsKey(todayKey)) {
          _dailyAttendanceRecords[todayKey] = {};
        }

        final Map<String, String> batchRecord = {};
        for (int i = 0; i < students.length; i++) {
          final sId = students[i]['id'] as String;
          batchRecord[sId] = (i == 3) ? 'absent' : 'present';
        }
        _dailyAttendanceRecords[todayKey]![batchId] = batchRecord;

        if (batchId == 'bn-b1') {
          _sessionStatus[key] = 'submitted';
        } else {
          _sessionStatus[key] = 'not_started';
        }
      }
    }
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
        final isToday = days.contains(currentDayName);

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

    if (scheduledToday.isEmpty) {
      for (var course in courses) {
        final batch = (course['batches'] as List).first;
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

    return scheduledToday;
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

  String getStudentStatus(String batchId, String studentId) {
    final todayKey = _getTodayDateKey();
    final batchMap = _dailyAttendanceRecords[todayKey]?[batchId];
    if (batchMap != null && batchMap.containsKey(studentId)) {
      return batchMap[studentId]!;
    }
    return 'present';
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
              'phone': stu['phone'],
              'parent_name': stu['parent_name'],
              'parent_phone': stu['parent_phone'],
              'rate': stu['rate'],
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
}

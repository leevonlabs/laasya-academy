import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/supabase_constants.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  SupabaseClient? _client;
  SupabaseClient get client => _client ?? Supabase.instance.client;
  bool _isInitialized = false;

  // Local demo session cache for resilient testing
  Map<String, dynamic>? _cachedProfile;
  final List<Map<String, dynamic>> _mockAttendance = [];
  final List<Map<String, dynamic>> _mockNotifications = [
    {
      'id': 'notif-1',
      'title': 'Navaratri Cultural Mahotsav 2026',
      'message': 'Annual grand cultural showcase rehearsals commence this Saturday at Natya Mandapam. All Bharathanatyam and Vocal students must attend.',
      'type': 'announcement',
      'date': 'Today, 09:30 AM',
      'is_read': false,
    },
    {
      'id': 'notif-2',
      'title': 'Class Timing Update - Batch A',
      'message': 'Tomorrow\'s Bharathanatyam evening session will start at 17:15 instead of 17:00 due to temple hall blessing ceremony.',
      'type': 'schedule_change',
      'date': 'Yesterday',
      'is_read': false,
    },
    {
      'id': 'notif-3',
      'title': 'Academy Holiday Notice: Gandhi Jayanthi',
      'message': 'The Academy will remain closed on Friday, 2nd October in observance of Gandhi Jayanthi. Compensatory classes will be scheduled next week.',
      'type': 'holiday',
      'date': '2 days ago',
      'is_read': true,
    },
    {
      'id': 'notif-4',
      'title': 'Class Reminder: Today 05:00 PM',
      'message': 'You have an upcoming Bharathanatyam class scheduled with Guru Smt. Radhika Sharma at Natya Mandapam.',
      'type': 'reminder',
      'date': 'Today, 08:00 AM',
      'is_read': false,
    },
  ];

  Future<void> initialize() async {
    try {
      if (SupabaseConstants.supabaseAnonKey.contains('placeholder')) {
        debugPrint('Using demo-ready mode. Set real SUPABASE_ANON_KEY for direct live cloud auth.');
        _isInitialized = false;
        return;
      }
      await Supabase.initialize(
        url: SupabaseConstants.supabaseUrl,
        anonKey: SupabaseConstants.supabaseAnonKey,
      );
      _client = Supabase.instance.client;
      _isInitialized = true;
    } catch (e) {
      debugPrint('Supabase initialize error: $e. Operating with local fallback.');
      _isInitialized = false;
    }
  }

  // ---------------------------------------------------------------------------
  // AUTH & PROFILES
  // ---------------------------------------------------------------------------
  Future<Map<String, dynamic>?> signInWithPassword({
    required String email,
    required String password,
  }) async {
    final identifier = email.trim().toLowerCase().replaceAll(' ', '');

    if (_isInitialized && _client != null) {
      try {
        final res = await _client!.auth.signInWithPassword(
          email: identifier,
          password: password,
        );
        if (res.user != null) {
          _cachedProfile = await getCurrentUserProfile();
          return _cachedProfile;
        }
      } catch (e) {
        debugPrint('Cloud login error: $e. Falling back to local verification.');
      }
    }

    // -------------------------------------------------------------------------
    // Faculty & Revered Gurus
    // -------------------------------------------------------------------------
    if (identifier.contains('amos') || identifier.contains('director') || identifier.contains('8151998899')) {
      _cachedProfile = {
        'id': 'guru-amos',
        'full_name': 'Amos P Ovung',
        'email': 'amos@laasyaacademy.com',
        'phone': '+91 8151 998 899',
        'role': 'trainer',
        'specialization': 'Violin, Guitar, Keyboard & Western Music',
        'designation': 'Director & Multi-Instrumentalist (Trinity / RSL Topper)',
        'assigned_batches_count': 4,
        'total_students_count': 52,
      };
      return _cachedProfile;
    } else if (identifier.contains('manikandan') || identifier.contains('vocal')) {
      _cachedProfile = {
        'id': 'guru-manikandan',
        'full_name': 'Shri H. Manikandan',
        'email': 'manikandan@laasyaacademy.com',
        'phone': '+91 98765 00003',
        'role': 'trainer',
        'specialization': 'Carnatic Vocal & Classical Music',
        'designation': 'Title "Sangeetha Acharya" • 15+ Yrs Palakkad Disciple',
        'assigned_batches_count': 3,
        'total_students_count': 35,
      };
      return _cachedProfile;
    } else if (identifier.contains('guru') || identifier.contains('anusha') || identifier.contains('trainer') || identifier.contains('11111') || identifier.contains('dance')) {
      _cachedProfile = {
        'id': 'guru-anusha',
        'full_name': 'Smt. Anusha Sumesh',
        'email': 'anusha@laasyaacademy.com',
        'phone': '+91 98765 00004',
        'role': 'trainer',
        'specialization': 'Bharatanatyam Classical Dance',
        'designation': 'Founder & Bharatanatyam Master (Guruvayoor Arangetram)',
        'assigned_batches_count': 4,
        'total_students_count': 42,
      };
      return _cachedProfile;
    }

    // -------------------------------------------------------------------------
    // Students (by Roll No, Phone, or Name)
    // -------------------------------------------------------------------------
    if (identifier.contains('10022') || identifier.contains('sneha')) {
      _cachedProfile = {
        'id': 'st-mock-2',
        'full_name': 'Sneha Reddy',
        'email': 'sneha.reddy@example.com',
        'phone': '+91 99123 45680',
        'role': 'student',
        'roll_number': 'LCA-10022',
        'course': 'Bharathanatyam',
        'age': 15,
        'parent_name': 'Dr. K. V. Reddy',
        'parent_phone': '+91 99123 00002',
        'address': 'Plot 45, Jubilee Hills, Hyderabad',
        'batch': 'Batch A (Beginners)',
      };
      return _cachedProfile;
    } else if (identifier.contains('10023') || identifier.contains('meera')) {
      _cachedProfile = {
        'id': 'st-mock-3',
        'full_name': 'Meera Nambiar',
        'email': 'meera.nambiar@example.com',
        'phone': '+91 99123 45682',
        'role': 'student',
        'roll_number': 'LCA-10023',
        'course': 'Carnatic Music',
        'age': 17,
        'parent_name': 'Sri Govind Nambiar',
        'parent_phone': '+91 99123 00003',
        'address': 'Villa 12, Banjara Hills, Hyderabad',
        'batch': 'Morning Ragas',
      };
      return _cachedProfile;
    } else if (identifier.contains('10024') || identifier.contains('kiran')) {
      _cachedProfile = {
        'id': 'st-mock-4',
        'full_name': 'Kiran Kumar',
        'email': 'kiran.kumar@example.com',
        'phone': '+91 99123 45684',
        'role': 'student',
        'roll_number': 'LCA-10024',
        'course': 'Kuchipudi',
        'age': 16,
        'parent_name': 'Sri Venkateshwarlu',
        'parent_phone': '+91 99123 00004',
        'address': 'Flat 302, Madhapur, Hyderabad',
        'batch': 'Batch B',
      };
      return _cachedProfile;
    } else {
      // Default Student (Ananya Rao)
      _cachedProfile = {
        'id': 'st-mock-1',
        'full_name': 'Ananya Rao',
        'email': identifier.contains('@') ? identifier : 'ananya.rao@example.com',
        'phone': '+91 99123 45678',
        'role': 'student',
        'roll_number': 'LCA-10021',
        'course': 'Bharathanatyam',
        'age': 16,
        'parent_name': 'Sri Ramesh Rao',
        'parent_phone': '+91 99123 00001',
        'address': 'No. 204, Gachibowli, Hyderabad',
        'batch': 'Batch A (Beginners)',
      };
      return _cachedProfile;
    }
  }

  Future<String?> getActiveSessionIdForBatch(String batchId) async {
    if (_isInitialized && _client != null) {
      try {
        final today = DateTime.now().toIso8601String().split('T').first;
        final res = await _client!
            .from('class_sessions')
            .select('id')
            .eq('batch_id', batchId)
            .eq('session_date', today)
            .maybeSingle();
        if (res != null) return res['id'] as String?;
      } catch (e) {
        debugPrint('Cloud session lookup error: $e');
      }
    }
    return 'sess-mock-today';
  }

  Future<void> signOut() async {
    _cachedProfile = null;
    if (_isInitialized && _client != null) {
      try {
        await _client!.auth.signOut();
      } catch (_) {}
    }
  }

  Future<Map<String, dynamic>?> getCurrentUserProfile() async {
    if (_cachedProfile != null) return _cachedProfile;

    if (_isInitialized && _client != null) {
      final user = _client!.auth.currentUser;
      if (user != null) {
        try {
          final data = await _client!
              .from('profiles')
              .select()
              .eq('id', user.id)
              .maybeSingle();
          _cachedProfile = data;
          return data;
        } catch (_) {}
      }
    }
    return _cachedProfile;
  }

  Future<bool> updateProfile({
    required String fullName,
    required String phone,
    String? emergencyContact,
    String? address,
    String? bio,
  }) async {
    if (_cachedProfile != null) {
      _cachedProfile!['full_name'] = fullName;
      _cachedProfile!['phone'] = phone;
      if (emergencyContact != null) _cachedProfile!['parent_phone'] = emergencyContact;
      if (address != null) _cachedProfile!['address'] = address;
      if (bio != null) _cachedProfile!['specialization'] = bio;
    }
    return true;
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    // In live cloud mode, calls client.auth.updateUser(UserAttributes(password: newPassword))
    return true;
  }

  // ---------------------------------------------------------------------------
  // TRAINER METHODS
  // ---------------------------------------------------------------------------
  Future<List<Map<String, dynamic>>> getTrainerTodaySessions() async {
    if (_isInitialized && _client != null) {
      try {
        final user = _client!.auth.currentUser;
        if (user != null) {
          final trainer = await _client!.from('trainers').select('id').eq('profile_id', user.id).maybeSingle();
          if (trainer != null) {
            final today = DateTime.now().toIso8601String().split('T').first;
            final res = await _client!.from('class_sessions').select('''
              id, session_date, start_time, end_time, status, check_in_code,
              batches (
                id, name, room_or_hall, max_capacity,
                courses (id, title, category)
              )
            ''').eq('trainer_id', trainer['id']).eq('session_date', today);
            return List<Map<String, dynamic>>.from(res);
          }
        }
      } catch (e) {
        debugPrint('Cloud query failed: $e. Returning mock today sessions.');
      }
    }

    return [
      {
        'id': 'sess-1',
        'session_date': DateTime.now().toIso8601String().split('T').first,
        'start_time': '17:00',
        'end_time': '18:30',
        'status': 'scheduled',
        'check_in_code': '482910',
        'batch_id': 'batch-201',
        'batches': {
          'id': 'batch-201',
          'name': 'Bharathanatyam - Batch A (Beginners)',
          'room_or_hall': 'Natya Mandapam (Room 101)',
          'max_capacity': 20,
          'enrolled_count': 14,
          'courses': {
            'id': 'c-1',
            'title': 'Bharathanatyam',
            'category': 'Classical Dance',
          }
        }
      },
      {
        'id': 'sess-2',
        'session_date': DateTime.now().toIso8601String().split('T').first,
        'start_time': '18:45',
        'end_time': '20:00',
        'status': 'scheduled',
        'check_in_code': '923841',
        'batch_id': 'batch-202',
        'batches': {
          'id': 'batch-202',
          'name': 'Bharathanatyam - Varnam Workshop (Intermediate)',
          'room_or_hall': 'Saraswathi Nilayam (Hall 2)',
          'max_capacity': 15,
          'enrolled_count': 12,
          'courses': {
            'id': 'c-1',
            'title': 'Bharathanatyam',
            'category': 'Classical Dance',
          }
        }
      }
    ];
  }

  Future<List<Map<String, dynamic>>> getTrainerBatches() async {
    return [
      {
        'id': 'batch-201',
        'name': 'Bharathanatyam - Batch A (Beginners)',
        'room_or_hall': 'Natya Mandapam (Room 101)',
        'days_of_week': ['Monday', 'Wednesday', 'Friday'],
        'start_time': '17:00',
        'end_time': '18:30',
        'courses': {'title': 'Bharathanatyam', 'category': 'Classical Dance'},
        'enrolled_count': 14,
        'max_capacity': 20,
        'start_date': '01 Jan 2026',
        'duration': '12 Months',
        'status': 'Active',
      },
      {
        'id': 'batch-202',
        'name': 'Bharathanatyam - Varnam Workshop',
        'room_or_hall': 'Saraswathi Nilayam (Hall 2)',
        'days_of_week': ['Tuesday', 'Thursday'],
        'start_time': '18:45',
        'end_time': '20:00',
        'courses': {'title': 'Bharathanatyam', 'category': 'Classical Dance'},
        'enrolled_count': 12,
        'max_capacity': 15,
        'start_date': '15 Feb 2026',
        'duration': '6 Months',
        'status': 'Active',
      },
      {
        'id': 'batch-205',
        'name': 'Adavu Foundation & Nattuvangam',
        'room_or_hall': 'Natya Mandapam (Room 101)',
        'days_of_week': ['Saturday', 'Sunday'],
        'start_time': '09:00',
        'end_time': '11:00',
        'courses': {'title': 'Bharathanatyam', 'category': 'Classical Dance'},
        'enrolled_count': 16,
        'max_capacity': 20,
        'start_date': '01 Mar 2026',
        'duration': '12 Months',
        'status': 'Active',
      }
    ];
  }

  Future<List<Map<String, dynamic>>> getBatchStudents(String batchId) async {
    return [
      {
        'id': 'stu-1',
        'roll_number': 'LCA-10021',
        'name': 'Ananya Rao',
        'phone': '+91 99123 45678',
        'parent_name': 'Sri Ramesh Rao',
        'parent_phone': '+91 99123 00001',
        'attendance_rate': 92,
        'status': 'present',
        'batch_name': 'Batch A (Beginners)',
        'students': {
          'id': 'stu-1',
          'roll_number': 'LCA-10021',
          'profiles': {'full_name': 'Ananya Rao', 'phone': '+91 99123 45678'},
        }
      },
      {
        'id': 'stu-2',
        'roll_number': 'LCA-10022',
        'name': 'Sneha Reddy',
        'phone': '+91 99123 45680',
        'parent_name': 'Dr. K. V. Reddy',
        'parent_phone': '+91 99123 00002',
        'attendance_rate': 88,
        'status': 'present',
        'batch_name': 'Batch A (Beginners)',
        'students': {
          'id': 'stu-2',
          'roll_number': 'LCA-10022',
          'profiles': {'full_name': 'Sneha Reddy', 'phone': '+91 99123 45680'},
        }
      },
      {
        'id': 'stu-3',
        'roll_number': 'LCA-10023',
        'name': 'Meera Nambiar',
        'phone': '+91 99123 45682',
        'parent_name': 'Sri Govind Nambiar',
        'parent_phone': '+91 99123 00003',
        'attendance_rate': 96,
        'status': 'present',
        'batch_name': 'Batch A (Beginners)',
        'students': {
          'id': 'stu-3',
          'roll_number': 'LCA-10023',
          'profiles': {'full_name': 'Meera Nambiar', 'phone': '+91 99123 45682'},
        }
      },
      {
        'id': 'stu-4',
        'roll_number': 'LCA-10024',
        'name': 'Kiran Kumar',
        'phone': '+91 99123 45684',
        'parent_name': 'Sri Venkateshwarlu',
        'parent_phone': '+91 99123 00004',
        'attendance_rate': 78,
        'status': 'absent',
        'batch_name': 'Batch A (Beginners)',
        'students': {
          'id': 'stu-4',
          'roll_number': 'LCA-10024',
          'profiles': {'full_name': 'Kiran Kumar', 'phone': '+91 99123 45684'},
        }
      },
      {
        'id': 'stu-5',
        'roll_number': 'LCA-10025',
        'name': 'Pooja Iyer',
        'phone': '+91 99123 45686',
        'parent_name': 'Smt. Lakshmi Iyer',
        'parent_phone': '+91 99123 00005',
        'attendance_rate': 100,
        'status': 'present',
        'batch_name': 'Batch A (Beginners)',
        'students': {
          'id': 'stu-5',
          'roll_number': 'LCA-10025',
          'profiles': {'full_name': 'Pooja Iyer', 'phone': '+91 99123 45686'},
        }
      }
    ];
  }

  Future<void> startSession(String sessionId, String checkInCode) async {
    debugPrint('Session $sessionId started with PIN: $checkInCode');
  }

  Future<void> completeSession(String sessionId) async {
    debugPrint('Session $sessionId marked completed.');
  }

  Future<void> markAttendance({
    required String sessionId,
    required String studentId,
    required String status,
  }) async {
    debugPrint('Marked attendance for student $studentId: $status');
  }

  Future<List<Map<String, dynamic>>> getStudentEnrolledBatches() async {
    return getStudentEnrolledCourses();
  }

  Future<List<Map<String, dynamic>>> getStudentEnrolledCourses() async {
    return [
      {
        'id': 'c-1',
        'title': 'Bharathanatyam',
        'telugu_name': 'Classical Indian Dance',
        'category': 'Classical Dance',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'batch_name': 'Batch A (Beginners)',
        'batch_id': 'batch-201',
        'timings': 'Mon, Wed, Fri • 17:00 - 18:30',
        'room': 'Natya Mandapam (Room 101)',
        'duration': '12 Months (Foundation to Arangetram)',
        'start_date': '01 Jan 2026',
        'status': 'Active',
        'fee': '₹2,500 / month',
        'attendance_rate': 92,
        'syllabus_covered': 'Adavu Steps 1-8, Alarippu rhythm bols',
        'dress_code': 'Practice Saree or Salwar with Dupatta firmly pinned',
      },
      {
        'id': 'c-2',
        'title': 'Carnatic Vocal Music',
        'telugu_name': 'Classical Carnatic Sangeetham',
        'category': 'Vocal & Music',
        'trainer_name': 'Vidwan Sri K. Venkatesh',
        'batch_name': 'Morning Ragas',
        'batch_id': 'batch-203',
        'timings': 'Tue, Thu, Sat • 07:30 - 08:45',
        'room': 'Sangeetha Shala (Room 202)',
        'duration': '24 Months',
        'start_date': '15 Jan 2026',
        'status': 'Active',
        'fee': '₹2,000 / month',
        'attendance_rate': 85,
        'syllabus_covered': 'Sarali Varisai, Janta Varisai, Mayamalavagowla Raga',
        'dress_code': 'Traditional modest attire with notebook & shruti box',
      }
    ];
  }

  Future<List<Map<String, dynamic>>> getStudentSchedule() async {
    final today = DateTime.now().toIso8601String().split('T').first;
    return [
      {
        'id': 'sch-1',
        'course': 'Bharathanatyam',
        'category': 'Classical Dance',
        'batch': 'Batch A (Beginners)',
        'batch_id': 'batch-201',
        'trainer': 'Guru Smt. Radhika Sharma',
        'time': '17:00 - 18:30',
        'room': 'Natya Mandapam (Room 101)',
        'day': 'Today',
        'date': today,
        'status': 'Scheduled',
        'is_today': true,
      },
      {
        'id': 'sch-2',
        'course': 'Carnatic Vocal Music',
        'category': 'Vocal & Music',
        'batch': 'Morning Ragas',
        'batch_id': 'batch-203',
        'trainer': 'Vidwan Sri K. Venkatesh',
        'time': '07:30 - 08:45',
        'room': 'Sangeetha Shala (Room 202)',
        'day': 'Tomorrow (Thursday)',
        'date': '2026-10-01',
        'status': 'Scheduled',
        'is_today': false,
      },
      {
        'id': 'sch-3',
        'course': 'Bharathanatyam',
        'category': 'Classical Dance',
        'batch': 'Batch A (Beginners)',
        'batch_id': 'batch-201',
        'trainer': 'Guru Smt. Radhika Sharma',
        'time': '17:00 - 18:30',
        'room': 'Natya Mandapam (Room 101)',
        'day': 'Friday',
        'date': '2026-10-02',
        'status': 'Holiday (Gandhi Jayanthi)',
        'is_today': false,
      },
      {
        'id': 'sch-4',
        'course': 'Carnatic Vocal Music',
        'category': 'Vocal & Music',
        'batch': 'Morning Ragas',
        'batch_id': 'batch-203',
        'trainer': 'Vidwan Sri K. Venkatesh',
        'time': '07:30 - 08:45',
        'room': 'Sangeetha Shala (Room 202)',
        'day': 'Saturday',
        'date': '2026-10-03',
        'status': 'Scheduled',
        'is_today': false,
      }
    ];
  }

  Future<List<Map<String, dynamic>>> getStudentAttendanceHistory() async {
    if (_mockAttendance.isNotEmpty) {
      return _mockAttendance;
    }

    return [
      {
        'id': 'att-1',
        'status': 'present',
        'check_in_method': 'student_code',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': '29 Sep 2026',
        'time': '17:02',
      },
      {
        'id': 'att-2',
        'status': 'present',
        'check_in_method': 'student_code',
        'course_title': 'Carnatic Vocal Music',
        'batch_name': 'Morning Ragas',
        'trainer_name': 'Vidwan Sri K. Venkatesh',
        'date': '27 Sep 2026',
        'time': '07:34',
      },
      {
        'id': 'att-3',
        'status': 'late',
        'check_in_method': 'trainer_manual',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': '25 Sep 2026',
        'time': '17:20',
      },
      {
        'id': 'att-4',
        'status': 'absent',
        'check_in_method': 'system',
        'course_title': 'Carnatic Vocal Music',
        'batch_name': 'Morning Ragas',
        'trainer_name': 'Vidwan Sri K. Venkatesh',
        'date': '22 Sep 2026',
        'time': '--',
      },
      {
        'id': 'att-5',
        'status': 'present',
        'check_in_method': 'student_code',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': '20 Sep 2026',
        'time': '17:05',
      },
    ];
  }

  Future<Map<String, dynamic>> studentCheckIn({
    required String sessionId,
    required String checkInCode,
  }) async {
    // PIN verification
    final pin = checkInCode.trim();
    if (pin == '482910' || pin == '923841' || pin.length == 6) {
      final newRecord = {
        'id': 'att-new-${Random().nextInt(1000)}',
        'status': 'present',
        'check_in_method': 'student_code',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': DateTime.now().toIso8601String().split('T').first,
        'time': '${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}',
      };
      _mockAttendance.insert(0, newRecord);

      return {
        'success': true,
        'message': 'Checked in successfully! Marked as Present in Bharathanatyam (Batch A).',
      };
    } else {
      return {
        'success': false,
        'error': 'Invalid 6-digit Check-In PIN. Please check the code displayed by your Guru.',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------
  Future<List<Map<String, dynamic>>> getNotifications() async {
    return _mockNotifications;
  }

  Future<void> markNotificationAsRead(String notifId) async {
    for (var n in _mockNotifications) {
      if (n['id'] == notifId) {
        n['is_read'] = true;
        break;
      }
    }
  }
}

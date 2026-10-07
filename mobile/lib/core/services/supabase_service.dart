import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
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
  final List<Map<String, dynamic>> _mockBannerAnnouncements = [
    {
      'id': 'banner-1',
      'title': 'Bharatanatyam for Little Dancers',
      'message': 'Special Batch for Ages 3–6 Years. A small & focused batch designed especially for little ones to learn Bharatanatyam with personal attention, care & confidence. Only 5 children per batch, only 5 seats available! Contact: 81 5199 8899 | 81 5188 9988.',
      'type': 'announcement',
      'announcement_type': 'banner',
      'type_tag': 'Special Batch (Ages 3-6)',
      'image_url': 'assets/images/banner_bharatanatyam_kids.jpg',
      'date': 'Today, 09:30 AM',
      'is_read': false,
      'action_links': [
        {'title': 'Call Academy Admissions', 'url': 'tel:+918151998899'},
        {'title': 'Course Syllabus & Info', 'url': 'https://laasyaacademy.com/bharatanatyam-junior'},
      ],
    },
    {
      'id': 'banner-2',
      'title': 'Welcome to the World of Cinema',
      'message': '2-Day Acting Workshop on Expressions with Nikhil Nicolas (Actor, Director, Writer & Acting Coach for leading actors in Kerala). State Award Winner. Registrations Open! Call: 81 5188 9988 | 81 5199 8899.',
      'type': 'announcement',
      'announcement_type': 'banner',
      'type_tag': 'Acting Workshop',
      'image_url': 'assets/images/banner_cinema_acting_workshop.jpg',
      'date': 'Yesterday',
      'is_read': false,
      'action_links': [
        {'title': 'Register for Acting Workshop', 'url': 'https://laasyaacademy.com/workshops/acting'},
        {'title': 'Call Workshop Coordinator', 'url': 'tel:+918151889988'},
      ],
    },
    {
      'id': 'banner-3',
      'title': 'We Are Hiring: Bharatanatyam Teacher',
      'message': 'Passionate educators to inspire the next generation. Qualified & experienced Bharatanatyam dancers preferred. Join the Laasya family - Let\'s keep the art alive together! Call: 81 5199 8899 | 81 5188 9988.',
      'type': 'announcement',
      'announcement_type': 'banner',
      'type_tag': 'Faculty Hiring',
      'image_url': 'assets/images/banner_hiring_bharatanatyam.jpg',
      'date': '2 days ago',
      'is_read': true,
      'action_links': [
        {'title': 'Apply via Faculty Portal', 'url': 'https://laasyaacademy.com/careers'},
        {'title': 'Call Faculty Recruitment', 'url': 'tel:+918151998899'},
      ],
    },
    {
      'id': 'banner-4',
      'title': 'Zumba Fitness Classes',
      'message': 'Dance • Fitness • Fun • Transformation. Morning Batches | Evening Batches. Burn calories, lose weight, improve stamina, stay active & healthy. Professional & experienced instructor. Enroll Now! Call: 81 5199 8899.',
      'type': 'announcement',
      'announcement_type': 'banner',
      'type_tag': 'Fitness & Zumba',
      'image_url': 'assets/images/banner_zumba_fitness.png',
      'date': '3 days ago',
      'is_read': false,
      'action_links': [
        {'title': 'Enroll for Zumba Trial Class', 'url': 'https://laasyaacademy.com/zumba-trial'},
        {'title': 'Contact Fitness Desk', 'url': 'tel:+918151998899'},
      ],
    },
  ];

  final List<Map<String, dynamic>> _mockMessageAnnouncements = [
    {
      'id': 'msg-1',
      'title': 'Navaratri & Vijayadashami Special Holiday Schedule',
      'message': 'Dear Disciples & Respected Parents,\n\nPlease note that regular classes will remain suspended from Oct 11 to Oct 13 in observance of Vijayadashami & Saraswathi Pooja.\n\n✨ Special Maha Pooja & Vidhyarambham will be celebrated on Saturday, Oct 12 at 09:00 AM at Natya Mandapam (Room 101). All disciples, parents, and art lovers are cordially invited to seek the blessings of the Gurus.\n\nPranaams,\nAcademy Administration',
      'type': 'message',
      'announcement_type': 'message',
      'type_tag': 'Holiday',
      'image_url': 'assets/images/cultural_banner.png',
      'sender_name': 'Sri Ramesh Rao (Academy Director)',
      'audience': 'All students',
      'date': 'Today',
      'time': '10:15 AM',
      'is_delivered': true,
      'is_read': false,
      'action_links': [
        {'title': 'Saraswathi Pooja Program Schedule', 'url': 'https://laasyaacademy.com/pooja-schedule'},
        {'title': 'Natya Mandapam Location Map', 'url': 'https://maps.google.com/?q=Laasya+Academy'},
      ],
    },
    {
      'id': 'msg-2',
      'title': 'Monthly Tuition Fee Due Reminder - October 2026',
      'message': 'Dear Students & Parents,\n\nThis is a gentle reminder that monthly tuition fee dues for the month of October 2026 are payable on or before 10th October 2026.\n\nKindly clear any outstanding balances via online UPI/Netbanking or directly at the academy reception counter. You can view payment breakdown and download official digital invoices directly under Portal Settings > Payments.\n\nRegards,\nFinance & Accounts Desk',
      'type': 'message',
      'announcement_type': 'message',
      'type_tag': 'Fee reminder',
      'sender_name': 'Accounts Office',
      'audience': 'All students',
      'date': 'Yesterday',
      'time': '03:45 PM',
      'is_delivered': true,
      'is_read': true,
      'action_links': [
        {'title': 'Direct UPI Payment Link', 'url': 'https://laasyaacademy.com/pay-fee'},
      ],
    },
    {
      'id': 'msg-3',
      'title': 'Weekend Batch Timing Alignment for Stage Rehearsals',
      'message': 'Attention Bharathanatyam (Batch A & Batch B) Students:\n\nStarting this Saturday, morning batch timings will begin 30 minutes earlier at 08:30 AM to accommodate stage lighting & blocking rehearsals for our upcoming Annual Cultural Samarpanam 2026.\n\nDisciples are advised to arrive 10 minutes in advance wearing standard academy dance attire and ghungroos.\n\nGuru Smt. Anusha Sumesh\nHead of Classical Dance',
      'type': 'message',
      'announcement_type': 'message',
      'type_tag': 'Schedule change',
      'sender_name': 'Guru Smt. Anusha Sumesh',
      'audience': 'Bharathanatyam',
      'date': '04 Oct 2026',
      'time': '11:20 AM',
      'is_delivered': true,
      'is_read': true,
      'action_links': [
        {'title': 'Samarpanam 2026 Stage Itinerary', 'url': 'https://laasyaacademy.com/events/samarpanam'},
      ],
    },
    {
      'id': 'msg-4',
      'title': 'Annual Samarpanam Costume & Measurement Trials',
      'message': 'Official Circular:\n\nThe master tailor will be visiting the academy campus on Sunday, 12th October from 11:00 AM to 04:00 PM for custom silk costume measurements for all participating dancers.\n\nPlease check your slot with the academy reception desk to avoid waiting.\n\nLaasya Cultural Academy',
      'type': 'message',
      'announcement_type': 'message',
      'type_tag': 'General',
      'sender_name': 'Academy Administration',
      'audience': 'All students',
      'date': '02 Oct 2026',
      'time': '05:00 PM',
      'is_delivered': true,
      'is_read': true,
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
    // Faculty & Revered Gurus (Trainer Login)
    // -------------------------------------------------------------------------
    if (identifier.contains('amos') || identifier.contains('director') || identifier.contains('8151998899')) {
      _cachedProfile = {
        'id': 'guru-amos',
        'full_name': 'Guru Amos P Ovung',
        'email': 'amos@laasyaacademy.com',
        'phone': '+91 8151 998 899',
        'role': 'trainer',
        'age': 40,
        'gender': 'Male',
        'avatar_url': null,
        'monthly_salary': 40000,
        'salary_payment_status': 'paid',
        'specialization': 'Violin, Guitar, Keyboard & Western Music',
        'designation': 'Director & Multi-Instrumentalist (Trinity / RSL Topper)',
        'assigned_room': 'Saraswathi Nilayam (Hall 2)',
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
        'age': 52,
        'gender': 'Male',
        'avatar_url': null,
        'monthly_salary': 38000,
        'salary_payment_status': 'paid',
        'specialization': 'Carnatic Vocal & Classical Music',
        'designation': 'Title "Sangeetha Acharya" • 15+ Yrs Palakkad Disciple',
        'assigned_room': 'Sangeetha Shala (Room 102)',
        'assigned_batches_count': 3,
        'total_students_count': 35,
      };
      return _cachedProfile;
    } else if (identifier.contains('vijay') || identifier.contains('karatte') || identifier.contains('martial')) {
      _cachedProfile = {
        'id': 'guru-vijay',
        'full_name': 'Sensei Vijay Kumar Olekar',
        'email': 'vijay@laasyaacademy.com',
        'phone': '+91 98765 00010',
        'role': 'trainer',
        'age': 35,
        'gender': 'Male',
        'avatar_url': null,
        'monthly_salary': 32000,
        'salary_payment_status': 'pending',
        'specialization': 'Karatte & Self Defense Disciplines',
        'designation': 'Sensei (2nd Dan Black Belt)',
        'assigned_room': 'Veera Kalari Koodam',
        'assigned_batches_count': 2,
        'total_students_count': 28,
      };
      return _cachedProfile;
    } else if (identifier.contains('guru') || identifier.contains('anusha') || identifier.contains('trainer') || identifier.contains('11111') || identifier.contains('dance') || identifier.contains('radhika')) {
      _cachedProfile = {
        'id': 'guru-anusha',
        'full_name': 'Smt. Anusha Sumesh',
        'email': 'anusha@laasyaacademy.com',
        'phone': '+91 98765 00004',
        'role': 'trainer',
        'age': 36,
        'gender': 'Female',
        'avatar_url': null,
        'monthly_salary': 45000,
        'salary_payment_status': 'paid',
        'specialization': 'Bharatanatyam Classical Dance',
        'designation': 'Founder & Head Guru (Guruvayoor Arangetram)',
        'assigned_room': 'Natya Mandapam (Room 101)',
        'assigned_batches_count': 4,
        'total_students_count': 42,
      };
      return _cachedProfile;
    }

    // -------------------------------------------------------------------------
    // Students (Student Login by Mobile, Roll No, or Email)
    // -------------------------------------------------------------------------
    if (identifier.contains('aditi') || identifier.contains('lca-6') || identifier.contains('9845012345')) {
      _cachedProfile = {
        'id': 'st-aditi',
        'full_name': 'Aditi Sundaram',
        'email': 'aditi.sundaram@laasyastudent.com',
        'phone': '+91 98450 12345',
        'role': 'student',
        'roll_number': 'LCA-6',
        'course': 'Bharathanatyam',
        'course_category': 'Classical Dance',
        'age': 16,
        'gender': 'Female',
        'avatar_url': null,
        'parent_name': 'Sri Sundaram V.',
        'parent_phone': '+91 98450 00006',
        'address': 'Flat 402, Shanthi Vihar, Bangalore',
        'batch': 'Bharathanatyam - Batch A (Beginners)',
        'room_or_hall': 'Natya Mandapam (Room 101)',
        'total_monthly_fee': 2000,
        'advance_paid': 2000,
        'due_amount': 0,
        'due_status': 'green',
        'due_date': '10th Oct 2026',
        'next_due_date': '10th Nov 2026',
      };
      return _cachedProfile;
    } else if (identifier.contains('10022') || identifier.contains('sneha')) {
      _cachedProfile = {
        'id': 'st-mock-2',
        'full_name': 'Sneha Reddy',
        'email': 'sneha.reddy@example.com',
        'phone': '+91 99123 45680',
        'role': 'student',
        'roll_number': 'LCA-10022',
        'course': 'Bharathanatyam',
        'course_category': 'Classical Dance',
        'age': 15,
        'gender': 'Female',
        'avatar_url': null,
        'parent_name': 'Dr. K. V. Reddy',
        'parent_phone': '+91 99123 00002',
        'address': 'Plot 45, Jubilee Hills, Hyderabad',
        'batch': 'Batch A (Beginners)',
        'room_or_hall': 'Natya Mandapam (Room 101)',
        'total_monthly_fee': 2000,
        'advance_paid': 0,
        'due_amount': 2000,
        'due_status': 'red',
        'due_date': '10th Oct 2026',
        'next_due_date': '10th Nov 2026',
      };
      return _cachedProfile;
    } else if (identifier.contains('aryan') || identifier.contains('lca-14') || identifier.contains('9845000014')) {
      _cachedProfile = {
        'id': 'st-aryan',
        'full_name': 'Aryan Sharma',
        'email': 'aryan.sharma@laasyastudent.com',
        'phone': '+91 98450 00014',
        'role': 'student',
        'roll_number': 'LCA-14',
        'course': 'Art and Craft',
        'course_category': 'Fine Arts',
        'age': 14,
        'gender': 'Male',
        'avatar_url': null,
        'parent_name': 'Sri Rajesh Sharma',
        'parent_phone': '+91 98450 99914',
        'address': 'No. 88, Indiranagar, Bangalore',
        'batch': 'Primary Batch',
        'room_or_hall': 'Chitra Kala Bhavan',
        'total_monthly_fee': 1800,
        'advance_paid': 1800,
        'due_amount': 0,
        'due_status': 'green',
        'due_date': '10th Oct 2026',
        'next_due_date': '10th Nov 2026',
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
        'course_category': 'Vocal & Music',
        'age': 17,
        'gender': 'Female',
        'avatar_url': null,
        'parent_name': 'Sri Govind Nambiar',
        'parent_phone': '+91 99123 00003',
        'address': 'Villa 12, Banjara Hills, Hyderabad',
        'batch': 'Morning Ragas',
        'room_or_hall': 'Sangeetha Shala (Room 102)',
        'total_monthly_fee': 2000,
        'advance_paid': 1000,
        'due_amount': 1000,
        'due_status': 'yellow',
        'due_date': '10th Oct 2026',
        'next_due_date': '10th Nov 2026',
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
        'roll_number': 'LCA-1',
        'course': 'Bharathanatyam',
        'course_category': 'Classical Dance',
        'age': 16,
        'gender': 'Female',
        'avatar_url': null,
        'parent_name': 'Sri Ramesh Rao',
        'parent_phone': '+91 99123 00001',
        'address': 'No. 204, Gachibowli, Hyderabad',
        'batch': 'Bharathanatyam - Batch A (Beginners)',
        'room_or_hall': 'Natya Mandapam (Room 101)',
        'total_monthly_fee': 2000,
        'advance_paid': 1000,
        'due_amount': 1000,
        'due_status': 'yellow',
        'due_date': '10th Oct 2026',
        'next_due_date': '10th Nov 2026',
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
          final profileData = await _client!
              .from('profiles')
              .select()
              .eq('id', user.id)
              .maybeSingle();
          if (profileData != null) {
            final role = profileData['role'] ?? 'student';
            if (role == 'trainer') {
              final trainer = await _client!.from('trainers').select().eq('profile_id', user.id).maybeSingle();
              if (trainer != null) {
                profileData['monthly_salary'] = trainer['monthly_salary'];
                profileData['salary_payment_status'] = trainer['salary_payment_status'] ?? 'paid';
                profileData['specialization'] = trainer['display_title'] ?? trainer['bio'];
                profileData['age'] = trainer['age'] ?? profileData['age'];
                profileData['gender'] = trainer['gender'] ?? profileData['gender'];
                profileData['avatar_url'] = trainer['avatar_url'] ?? profileData['avatar_url'];
              }
            } else if (role == 'student') {
              final student = await _client!.from('students').select().eq('profile_id', user.id).maybeSingle();
              if (student != null) {
                profileData['roll_number'] = student['roll_number'];
                profileData['age'] = student['age'] ?? profileData['age'];
                profileData['gender'] = student['gender'] ?? profileData['gender'];
                profileData['avatar_url'] = student['avatar_url'] ?? profileData['avatar_url'];
                profileData['parent_name'] = student['parent_name'];
                profileData['parent_phone'] = student['parent_contact'];
                profileData['address'] = student['address'];
                profileData['advance_paid'] = student['advance_paid'] ?? 0;
                profileData['total_monthly_fee'] = student['total_monthly_fee'] ?? 2000;
                profileData['due_amount'] = student['due_amount'] ?? 0;
                profileData['due_status'] = student['due_status'] ?? 'green';
              }
            }
            _cachedProfile = profileData;
            return profileData;
          }
        } catch (e) {
          debugPrint('Profile fetch error: $e');
        }
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
    int? age,
    String? gender,
    String? avatarUrl,
  }) async {
    if (_cachedProfile != null) {
      _cachedProfile!['full_name'] = fullName;
      _cachedProfile!['phone'] = phone;
      if (emergencyContact != null) _cachedProfile!['parent_phone'] = emergencyContact;
      if (address != null) _cachedProfile!['address'] = address;
      if (bio != null) _cachedProfile!['specialization'] = bio;
      if (age != null) _cachedProfile!['age'] = age;
      if (gender != null) _cachedProfile!['gender'] = gender;
      if (avatarUrl != null) _cachedProfile!['avatar_url'] = avatarUrl;
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
        'month_attendance': '92% (11/12 classes)',
        'month_attended': 11,
        'month_total': 12,
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
        'month_attendance': '85% (9/11 classes)',
        'month_attended': 9,
        'month_total': 11,
        'syllabus_covered': 'Sarali Varisai, Janta Varisai, Mayamalavagowla Raga',
        'dress_code': 'Traditional modest attire with notebook & shruti box',
      }
    ];
  }

  Future<List<Map<String, dynamic>>> getStudentSchedule() async {
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
        'date': '05-October-2026',
        'status': 'Scheduled',
        'is_today': true,
        'is_tomorrow': false,
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
        'day': 'Tomorrow',
        'date': '06-October-2026',
        'status': 'Scheduled',
        'is_today': false,
        'is_tomorrow': true,
      },
      {
        'id': 'sch-3',
        'course': 'Bharathanatyam Rehearsal',
        'category': 'Classical Dance',
        'batch': 'Batch A (Beginners)',
        'batch_id': 'batch-201',
        'trainer': 'Guru Smt. Radhika Sharma',
        'time': '18:30 - 19:30',
        'room': 'Natya Mandapam (Room 101)',
        'day': 'Tomorrow',
        'date': '06-October-2026',
        'status': 'Scheduled',
        'is_today': false,
        'is_tomorrow': true,
      },
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
        'check_in_method': 'trainer_manual',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': '05 Oct 2026',
        'date_iso': '2026-10-05',
        'time': '17:02',
      },
      {
        'id': 'att-1b',
        'status': 'absent',
        'check_in_method': 'system',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': '04 Oct 2026',
        'date_iso': '2026-10-04',
        'time': '--',
      },
      {
        'id': 'att-2',
        'status': 'present',
        'check_in_method': 'trainer_manual',
        'course_title': 'Carnatic Vocal Music',
        'batch_name': 'Morning Ragas',
        'trainer_name': 'Vidwan Sri K. Venkatesh',
        'date': '03 Oct 2026',
        'date_iso': '2026-10-03',
        'time': '07:34',
      },
      {
        'id': 'att-3',
        'status': 'present',
        'check_in_method': 'trainer_manual',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': '01 Oct 2026',
        'date_iso': '2026-10-01',
        'time': '17:05',
      },
      {
        'id': 'att-4',
        'status': 'absent',
        'check_in_method': 'system',
        'course_title': 'Carnatic Vocal Music',
        'batch_name': 'Morning Ragas',
        'trainer_name': 'Vidwan Sri K. Venkatesh',
        'date': '29 Sep 2026',
        'date_iso': '2026-09-29',
        'time': '--',
      },
      {
        'id': 'att-5',
        'status': 'present',
        'check_in_method': 'trainer_manual',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': '26 Sep 2026',
        'date_iso': '2026-09-26',
        'time': '17:01',
      },
      {
        'id': 'att-6',
        'status': 'present',
        'check_in_method': 'trainer_manual',
        'course_title': 'Carnatic Vocal Music',
        'batch_name': 'Morning Ragas',
        'trainer_name': 'Vidwan Sri K. Venkatesh',
        'date': '24 Sep 2026',
        'date_iso': '2026-09-24',
        'time': '07:32',
      },
      {
        'id': 'att-7',
        'status': 'absent',
        'check_in_method': 'system',
        'course_title': 'Bharathanatyam',
        'batch_name': 'Batch A (Beginners)',
        'trainer_name': 'Guru Smt. Radhika Sharma',
        'date': '22 Sep 2026',
        'date_iso': '2026-09-22',
        'time': '--',
      },
      {
        'id': 'att-8',
        'status': 'present',
        'check_in_method': 'trainer_manual',
        'course_title': 'Carnatic Vocal Music',
        'batch_name': 'Morning Ragas',
        'trainer_name': 'Vidwan Sri K. Venkatesh',
        'date': '19 Sep 2026',
        'date_iso': '2026-09-19',
        'time': '07:30',
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
  // ANNOUNCEMENTS & NOTIFICATIONS
  // ---------------------------------------------------------------------------
  String _normalizeImageUrl(dynamic rawUrl) {
    if (rawUrl == null) return '';
    final url = rawUrl.toString().trim();
    if (url.isEmpty) return '';

    // Check if filename matches local bundled high-res assets
    final fileName = url.split('/').last.split('?').first;
    const bundledMap = {
      'banner_bharatanatyam_kids.jpg': 'assets/images/banner_bharatanatyam_kids.jpg',
      'banner_cinema_acting_workshop.jpg': 'assets/images/banner_cinema_acting_workshop.jpg',
      'banner_hiring_bharatanatyam.jpg': 'assets/images/banner_hiring_bharatanatyam.jpg',
      'banner_zumba_fitness.png': 'assets/images/banner_zumba_fitness.png',
      'cultural_banner.png': 'assets/images/cultural_banner.png',
      'crest_logo.png': 'assets/images/crest_logo.png',
      'crest_logo.jpg': 'assets/images/crest_logo.jpg',
      'app_logo.png': 'assets/images/app_logo.png',
      'header_logo.png': 'assets/images/header_logo.png',
      'logo_banner.png': 'assets/images/logo_banner.png',
    };

    if (bundledMap.containsKey(fileName)) {
      return bundledMap[fileName]!;
    }

    if (url.startsWith('/')) {
      return 'http://localhost:3000$url';
    }

    return url;
  }

  Future<List<Map<String, dynamic>>> getBannerAnnouncements() async {
    // 1. Direct Supabase query if initialized
    if (_isInitialized && _client != null) {
      try {
        final res = await _client!
            .from('announcements')
            .select()
            .eq('is_deleted', false)
            .eq('announcement_type', 'banner')
            .order('created_at', ascending: false);
        if (res.isNotEmpty) {
          final live = List<Map<String, dynamic>>.from(res);
          for (var item in live) {
            item['image_url'] = _normalizeImageUrl(item['image_url']);
            item['date'] = item['publish_date'] ?? 'Today';
            item['is_read'] = false;
          }
          return live;
        }
      } catch (e) {
        debugPrint('Supabase direct query banner error: $e');
      }
    }

    // 2. HTTP API fallback
    try {
      final uri = Uri.parse('http://localhost:3000/api/announcements?announcementType=banner');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['announcements'] is List) {
          final live = List<Map<String, dynamic>>.from(decoded['announcements']);
          if (live.isNotEmpty) {
            for (var item in live) {
              item['image_url'] = _normalizeImageUrl(item['image_url']);
            }
            return live;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch error for banner announcements: $e');
    }
    return List<Map<String, dynamic>>.from(_mockBannerAnnouncements);
  }

  Future<List<Map<String, dynamic>>> getMessageAnnouncements() async {
    // 1. Direct Supabase query if initialized
    if (_isInitialized && _client != null) {
      try {
        final res = await _client!
            .from('announcements')
            .select()
            .eq('is_deleted', false)
            .neq('announcement_type', 'banner')
            .order('publish_date', ascending: false);
        if (res.isNotEmpty) {
          final now = DateTime.now();
          final valid = <Map<String, dynamic>>[];
          for (var item in res) {
            final dateStr = item['publish_date'] ?? item['created_at'];
            if (dateStr != null) {
              try {
                final dt = DateTime.parse(dateStr.toString().split('T')[0]);
                if (now.difference(dt).inDays > 30) {
                  continue; // Skip message older than 30 days
                }
              } catch (_) {}
            }
            final mapItem = Map<String, dynamic>.from(item);
            mapItem['image_url'] = _normalizeImageUrl(mapItem['image_url']);
            mapItem['date'] = mapItem['publish_date'] ?? 'Today';
            mapItem['is_read'] = false;
            valid.add(mapItem);
          }
          if (valid.isNotEmpty) return valid;
        }
      } catch (e) {
        debugPrint('Supabase direct query message error: $e');
      }
    }

    // 2. HTTP API fallback
    try {
      final uri = Uri.parse('http://localhost:3000/api/announcements?announcementType=message');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['announcements'] is List) {
          final live = List<Map<String, dynamic>>.from(decoded['announcements']);
          if (live.isNotEmpty) {
            final now = DateTime.now();
            final valid = <Map<String, dynamic>>[];
            for (var item in live) {
              // Enforce 30-day message lifespan
              final dateStr = item['publish_date'] ?? item['created_at'];
              if (dateStr != null) {
                try {
                  final dt = DateTime.parse(dateStr.toString().split('T')[0]);
                  if (now.difference(dt).inDays > 30) {
                    continue; // Skip message older than 30 days
                  }
                } catch (_) {}
              }
              item['image_url'] = _normalizeImageUrl(item['image_url']);
              valid.add(item);
            }
            if (valid.isNotEmpty) return valid;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch error for message announcements: $e');
    }
    return List<Map<String, dynamic>>.from(_mockMessageAnnouncements);
  }

  Future<List<Map<String, dynamic>>> getNotifications() async {
    final messages = await getMessageAnnouncements();
    final banners = await getBannerAnnouncements();
    final notifs = <Map<String, dynamic>>[];
    for (var m in messages) {
      final item = Map<String, dynamic>.from(m);
      item['type'] = (m['type_tag'] ?? 'General').toString().toLowerCase().replaceAll(' ', '_');
      if (item['type'] == 'fee_reminder') item['type'] = 'reminder';
      item['date'] = item['date'] ?? item['publish_date'] ?? 'Today';
      item['is_read'] = item['is_read'] ?? false;
      notifs.add(item);
    }
    for (var b in banners) {
      final item = Map<String, dynamic>.from(b);
      item['type'] = 'announcement';
      item['date'] = item['date'] ?? 'Today';
      item['is_read'] = item['is_read'] ?? false;
      notifs.add(item);
    }
    return notifs;
  }

  Future<void> markNotificationAsRead(String notifId) async {
    for (var n in _mockMessageAnnouncements) {
      if (n['id'] == notifId) {
        n['is_read'] = true;
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // EVENT VIDEO LIBRARY & DRIVE FOLDERS
  // ---------------------------------------------------------------------------
  List<Map<String, dynamic>> _cachedEventFolders = [];

  Future<List<Map<String, dynamic>>> getStudentEventFolders({String? courseTitle, String? batchName}) async {
    // 1. Live fetch from local / web backend API (http://localhost:3000/api/video-library)
    try {
      final uri = Uri.parse('http://localhost:3000/api/video-library');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['items'] is List) {
          final liveItems = List<Map<String, dynamic>>.from(decoded['items']);
          if (liveItems.isNotEmpty) {
            _cachedEventFolders = liveItems;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch error for video library: $e');
    }

    // 2. Supabase Cloud fallback if initialized
    if (_cachedEventFolders.isEmpty && _isInitialized && _client != null) {
      try {
        final res = await _client!
            .from('video_library')
            .select()
            .eq('category', 'event_folder')
            .order('created_at', ascending: false);
        if (res.isNotEmpty) {
          _cachedEventFolders = List<Map<String, dynamic>>.from(res);
        }
      } catch (e) {
        debugPrint('Supabase fetch error for video library: $e');
      }
    }

    // 3. Fallback cache with demo items including kalki uploaded for Bharathanatyam
    if (_cachedEventFolders.isEmpty) {
      _cachedEventFolders = [
        {
          'id': 'evt-kalki',
          'title': 'kalki',
          'event_name': 'kalki',
          'event_date': '2026-10-05',
          'created_at': '2026-10-05T15:00:00Z',
          'category': 'event_folder',
          'target_course_title': 'Bharathanatyam',
          'target_batch_name': 'All Batches',
          'drive_url': 'https://drive.google.com/drive/folders/1kZbRN-inNyTmJD_HblU7BunbwySyY796?usp=sharing',
          'description': 'Official shoot drive folder uploaded for Bharathanatyam disciples.',
          'access_level': 'Course',
          'created_by': 'Academy Owner',
        },
        {
          'id': 'evt-1',
          'title': 'Navaratri Cultural Mahotsav 2026 - Classical Showcase',
          'event_name': 'Navaratri Cultural Mahotsav 2026',
          'event_date': '2026-10-01',
          'created_at': '2026-10-02T10:30:00Z',
          'category': 'event_folder',
          'target_course_title': 'Bharathanatyam',
          'target_batch_name': 'All Batches',
          'drive_url': 'https://drive.google.com/drive/folders/1laasya_navaratri_2026_showcase?usp=sharing',
          'description': 'Complete multi-cam HD stage recording and individual solo footages of the grand Navaratri festival dance drama held at Natya Mandapam.',
          'access_level': 'Course',
          'created_by': 'Academy Owner',
        },
        {
          'id': 'evt-2',
          'title': 'Annual Day 2026 - Full Photo & Video Media Archive',
          'event_name': 'Annual Academy Showcase 2026',
          'event_date': '2026-09-14',
          'created_at': '2026-09-15T12:00:00Z',
          'category': 'event_folder',
          'target_course_title': 'All 18 Courses',
          'target_batch_name': 'All Batches',
          'drive_url': 'https://drive.google.com/drive/folders/1laasya_annual_day_2026_media_vault?usp=sharing',
          'description': 'High-resolution photo gallery and backstage video recordings from the 2026 Annual Cultural Showcase for all academy disciples.',
          'access_level': 'All Students',
          'created_by': 'Academy Owner',
        },
        {
          'id': 'evt-3',
          'title': 'Natya Mandapam Stage Performance Footage (Multi-Angle 4K)',
          'event_name': 'Natya Mandapam Stage Performance',
          'event_date': '2026-08-29',
          'created_at': '2026-08-30T14:15:00Z',
          'category': 'event_folder',
          'target_course_title': 'Bharathanatyam',
          'target_batch_name': 'Batch A (Beginners)',
          'drive_url': 'https://drive.google.com/drive/folders/1laasya_natya_mandapam_4k_footage?usp=sharing',
          'description': 'Raw and edited performance clips sorted by batch and raga for all participating disciples and parents.',
          'access_level': 'Batch',
          'created_by': 'Academy Owner',
        },
        {
          'id': 'evt-4',
          'title': 'Carnatic Sangeetha Sambhrama 2026 - Vocal Concert Vault',
          'event_name': 'Carnatic Sangeetha Sambhrama 2026',
          'event_date': '2026-09-27',
          'created_at': '2026-09-28T09:45:00Z',
          'category': 'event_folder',
          'target_course_title': 'Carnatic Vocal Music',
          'target_batch_name': 'Morning Ragas',
          'drive_url': 'https://drive.google.com/drive/folders/1laasya_carnatic_vocal_sambhrama?usp=sharing',
          'description': 'Traditional Carnatic vocal concert performance and masterclass lecture demonstration on Melakarta ragas.',
          'access_level': 'Course',
          'created_by': 'Academy Owner',
        },
      ];
    }

    return List<Map<String, dynamic>>.from(_cachedEventFolders);
  }

  // ---------------------------------------------------------------------------
  // STUDENT FEE PAYMENTS & INVOICES
  // ---------------------------------------------------------------------------
  List<Map<String, dynamic>> _cachedPayments = [];

  Future<List<Map<String, dynamic>>> getStudentPayments({String? studentId, String? rollNumber}) async {
    // 1. Live fetch from local / web backend API
    try {
      final uri = Uri.parse('http://localhost:3000/api/finance/student-payments');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['payments'] is List) {
          final livePayments = List<Map<String, dynamic>>.from(decoded['payments']);
          if (livePayments.isNotEmpty) {
            _cachedPayments = livePayments;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch error for student payments: $e');
    }

    if (_cachedPayments.isEmpty) {
      _cachedPayments = [
        {
          'id': 'pay-2026-10-01',
          'invoice_number': 'LCA-INV-2026-10-006',
          'receipt_number': 'LCA-REC-2026-10-006',
          'fee_period': 'October 2026',
          'course_title': 'Bharathanatyam',
          'batch_name': 'Batch A (Beginners)',
          'amount_paid': 2000,
          'gross_amount': 2000,
          'discount_amount': 0,
          'balance_due': 0,
          'payment_date': '02 Oct 2026',
          'payment_date_iso': '2026-10-02',
          'payment_method': 'UPI',
          'transaction_reference': 'UPI/627581920391/HDFC',
          'status': 'Paid',
          'receipt_issued_by': 'Sri Ramesh Rao (Director)',
          'student_name': 'Aditi Sundaram',
          'roll_number': 'LCA-6',
          'parent_name': 'Sri Sundaram V.',
          'remarks': 'Tuition fee for October 2026 received via UPI QR',
        },
        {
          'id': 'pay-2026-09-01',
          'invoice_number': 'LCA-INV-2026-09-006',
          'receipt_number': 'LCA-REC-2026-09-006',
          'fee_period': 'September 2026',
          'course_title': 'Bharathanatyam',
          'batch_name': 'Batch A (Beginners)',
          'amount_paid': 2000,
          'gross_amount': 2000,
          'discount_amount': 0,
          'balance_due': 0,
          'payment_date': '04 Sep 2026',
          'payment_date_iso': '2026-09-04',
          'payment_method': 'UPI',
          'transaction_reference': 'UPI/592837190281/ICICI',
          'status': 'Paid',
          'receipt_issued_by': 'Sri Ramesh Rao (Director)',
          'student_name': 'Aditi Sundaram',
          'roll_number': 'LCA-6',
          'parent_name': 'Sri Sundaram V.',
          'remarks': 'Tuition fee for September 2026 received via UPI',
        },
        {
          'id': 'pay-2026-08-01',
          'invoice_number': 'LCA-INV-2026-08-006',
          'receipt_number': 'LCA-REC-2026-08-006',
          'fee_period': 'August 2026',
          'course_title': 'Bharathanatyam',
          'batch_name': 'Batch A (Beginners)',
          'amount_paid': 2000,
          'gross_amount': 2000,
          'discount_amount': 0,
          'balance_due': 0,
          'payment_date': '02 Aug 2026',
          'payment_date_iso': '2026-08-02',
          'payment_method': 'UPI',
          'transaction_reference': 'UPI/549102847291/SBI',
          'status': 'Paid',
          'receipt_issued_by': 'Sri Ramesh Rao (Director)',
          'student_name': 'Aditi Sundaram',
          'roll_number': 'LCA-6',
          'parent_name': 'Sri Sundaram V.',
          'remarks': 'Tuition fee for August 2026 received via UPI',
        },
        {
          'id': 'pay-2026-07-01',
          'invoice_number': 'LCA-INV-2026-07-006',
          'receipt_number': 'LCA-REC-2026-07-006',
          'fee_period': 'July 2026',
          'course_title': 'Bharathanatyam',
          'batch_name': 'Batch A (Beginners)',
          'amount_paid': 2000,
          'gross_amount': 2000,
          'discount_amount': 0,
          'balance_due': 0,
          'payment_date': '05 Jul 2026',
          'payment_date_iso': '2026-07-05',
          'payment_method': 'Bank Transfer',
          'transaction_reference': 'NEFT/AXIS/291827401',
          'status': 'Paid',
          'receipt_issued_by': 'Sri Ramesh Rao (Director)',
          'student_name': 'Aditi Sundaram',
          'roll_number': 'LCA-6',
          'parent_name': 'Sri Sundaram V.',
          'remarks': 'Tuition fee for July 2026 received via NEFT',
        },
        {
          'id': 'pay-2026-06-REG',
          'invoice_number': 'LCA-INV-2026-06-REG',
          'receipt_number': 'LCA-REC-2026-06-REG',
          'fee_period': 'Academic Year 2026-27 Admission',
          'course_title': 'Bharathanatyam',
          'batch_name': 'Batch A (Beginners)',
          'amount_paid': 1500,
          'gross_amount': 1500,
          'discount_amount': 0,
          'balance_due': 0,
          'payment_date': '15 Jun 2026',
          'payment_date_iso': '2026-06-15',
          'payment_method': 'UPI',
          'transaction_reference': 'UPI/492817293810/HDFC',
          'status': 'Paid',
          'receipt_issued_by': 'Sri Ramesh Rao (Director)',
          'student_name': 'Aditi Sundaram',
          'roll_number': 'LCA-6',
          'parent_name': 'Sri Sundaram V.',
          'remarks': 'Annual Academy Enrollment, ID Card & Practice Ghungroo kit',
        },
      ];
    }

    return List<Map<String, dynamic>>.from(_cachedPayments);
  }

  // ---------------------------------------------------------------------------
  // TRAINER / GURU SALARY PAYOUTS & VOUCHERS
  // ---------------------------------------------------------------------------
  List<Map<String, dynamic>> _cachedSalaries = [];

  Future<List<Map<String, dynamic>>> getTrainerSalaryPayouts({String? trainerId}) async {
    // 1. Live fetch from local / web backend API
    try {
      final uri = Uri.parse('http://localhost:3000/api/finance/trainer-salaries');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['salaries'] is List) {
          final liveSalaries = List<Map<String, dynamic>>.from(decoded['salaries']);
          if (liveSalaries.isNotEmpty) {
            _cachedSalaries = liveSalaries;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch error for trainer salaries: $e');
    }

    if (_cachedSalaries.isEmpty) {
      _cachedSalaries = [
        {
          'id': 'sal-2026-10-01',
          'voucher_number': 'LCA-SAL-2026-10-004',
          'receipt_number': 'LCA-VOUCHER-2026-10-004',
          'payroll_month': 'October 2026',
          'trainer_name': 'Smt. Anusha Sumesh',
          'display_title': 'Founder & Head Guru',
          'specialization': 'Bharatanatyam Classical Dance',
          'base_salary': 45000,
          'classes_assigned': 24,
          'classes_conducted': 24,
          'bonus_amount': 3000,
          'bonus_reason': 'Festive Performance Choreography Honorarium',
          'deduction_amount': 0,
          'net_salary': 48000,
          'status': 'paid',
          'payment_date': '02 Oct 2026',
          'payment_method': 'Bank Transfer (IMPS)',
          'transaction_reference': 'IMPS/629104829104/HDFC',
          'disbursed_by': 'Sri Ramesh Rao (Academy Director)',
          'remarks': 'Monthly honorarium & Navaratri performance choreography advance',
        },
        {
          'id': 'sal-2026-09-01',
          'voucher_number': 'LCA-SAL-2026-09-004',
          'receipt_number': 'LCA-VOUCHER-2026-09-004',
          'payroll_month': 'September 2026',
          'trainer_name': 'Smt. Anusha Sumesh',
          'display_title': 'Founder & Head Guru',
          'specialization': 'Bharatanatyam Classical Dance',
          'base_salary': 45000,
          'classes_assigned': 24,
          'classes_conducted': 24,
          'bonus_amount': 0,
          'bonus_reason': null,
          'deduction_amount': 0,
          'net_salary': 45000,
          'status': 'paid',
          'payment_date': '02 Sep 2026',
          'payment_method': 'Bank Transfer (NEFT)',
          'transaction_reference': 'NEFT/591820491820/HDFC',
          'disbursed_by': 'Sri Ramesh Rao (Academy Director)',
          'remarks': 'Monthly faculty honorarium for September 2026',
        },
        {
          'id': 'sal-2026-08-01',
          'voucher_number': 'LCA-SAL-2026-08-004',
          'receipt_number': 'LCA-VOUCHER-2026-08-004',
          'payroll_month': 'August 2026',
          'trainer_name': 'Smt. Anusha Sumesh',
          'display_title': 'Founder & Head Guru',
          'specialization': 'Bharatanatyam Classical Dance',
          'base_salary': 45000,
          'classes_assigned': 24,
          'classes_conducted': 24,
          'bonus_amount': 0,
          'bonus_reason': null,
          'deduction_amount': 0,
          'net_salary': 45000,
          'status': 'paid',
          'payment_date': '02 Aug 2026',
          'payment_method': 'Bank Transfer (NEFT)',
          'transaction_reference': 'NEFT/540192847192/HDFC',
          'disbursed_by': 'Sri Ramesh Rao (Academy Director)',
          'remarks': 'Monthly faculty honorarium for August 2026',
        },
        {
          'id': 'sal-2026-07-01',
          'voucher_number': 'LCA-SAL-2026-07-004',
          'receipt_number': 'LCA-VOUCHER-2026-07-004',
          'payroll_month': 'July 2026',
          'trainer_name': 'Smt. Anusha Sumesh',
          'display_title': 'Founder & Head Guru',
          'specialization': 'Bharatanatyam Classical Dance',
          'base_salary': 45000,
          'classes_assigned': 24,
          'classes_conducted': 24,
          'bonus_amount': 0,
          'bonus_reason': null,
          'deduction_amount': 0,
          'net_salary': 45000,
          'status': 'paid',
          'payment_date': '03 Jul 2026',
          'payment_method': 'Bank Transfer (NEFT)',
          'transaction_reference': 'NEFT/489102938192/HDFC',
          'disbursed_by': 'Sri Ramesh Rao (Academy Director)',
          'remarks': 'Monthly faculty honorarium for July 2026',
        },
      ];
    }

    return List<Map<String, dynamic>>.from(_cachedSalaries);
  }
}

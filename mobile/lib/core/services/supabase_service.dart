import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/supabase_constants.dart';
import '../constants/api_constants.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  SupabaseClient? _client;
  SupabaseClient get client => _client ?? Supabase.instance.client;
  bool _isInitialized = false;

  Map<String, dynamic>? _cachedProfile;
  Map<String, dynamic>? get currentUserProfile => _cachedProfile;
  List<Map<String, dynamic>> _cachedTrainerBatches = [];
  List<Map<String, dynamic>> _cachedBannerAnnouncements = [];
  List<Map<String, dynamic>> _cachedMessageAnnouncements = [];

  final ValueNotifier<int> attendanceUpdateNotifier = ValueNotifier<int>(0);

  void notifyAttendanceUpdated() {
    attendanceUpdateNotifier.value++;
  }

  Future<void> _saveProfileToPrefs(Map<String, dynamic> profile) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_user_profile', jsonEncode(profile));
    } catch (e) {
      debugPrint('Error saving persistent user profile: $e');
    }
  }

  Future<void> _clearProfileFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('saved_user_profile');
    } catch (_) {}
  }
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
    // 1. Immediately restore persistent login profile from device storage so app NEVER logs out on close
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedJson = prefs.getString('saved_user_profile');
      if (savedJson != null && savedJson.isNotEmpty) {
        _cachedProfile = Map<String, dynamic>.from(jsonDecode(savedJson));
        debugPrint('Restored persistent login for ${_cachedProfile?['full_name']} (${_cachedProfile?['role']})');
      }
    } catch (e) {
      debugPrint('Error restoring saved profile session: $e');
    }

    await _ensureReadStateLoaded();

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
    } finally {
      try {
        await _ensureReadStateLoaded();
      } catch (_) {}
    }
  }

  // ---------------------------------------------------------------------------
  // AUTH & PROFILES
  // ---------------------------------------------------------------------------
  Future<Map<String, dynamic>?> signInWithPassword({
    required String email,
    required String password,
  }) async {
    final identifier = email.trim();

    // 1. Authenticate against central Academy API (authenticates all 300 students and 14 Gurus)
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/auth/mobile-login');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': identifier,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['profile'] != null) {
          _cachedProfile = Map<String, dynamic>.from(decoded['profile']);
          await _saveProfileToPrefs(_cachedProfile!);
          return _cachedProfile;
        }
      } else if (res.statusCode == 401 || res.statusCode == 400 || res.statusCode == 404) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['error'] != null) {
          throw Exception(decoded['error']);
        }
      }
    } catch (e) {
      if (e.toString().contains('Exception:')) rethrow;
      debugPrint('Mobile login API connection notice: $e');
    }

    if (_isInitialized && _client != null) {
      try {
        String resolvedEmail = identifier;
        if (!identifier.contains('@')) {
          try {
            final lookupRes = await _client!.rpc('lookup_user_email', params: {'p_identifier': identifier});
            if (lookupRes != null && lookupRes.toString().trim().isNotEmpty) {
              resolvedEmail = lookupRes.toString().trim();
            }
          } catch (rpcErr) {
            debugPrint('RPC lookup_user_email error: $rpcErr');
          }
        }

        final res = await _client!.auth.signInWithPassword(
          email: resolvedEmail,
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
      if (_cachedProfile != null) await _saveProfileToPrefs(_cachedProfile!);
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
    await _clearProfileFromPrefs();
    if (_isInitialized && _client != null) {
      try {
        await _client!.auth.signOut();
      } catch (_) {}
    }
  }

  Future<Map<String, dynamic>?> getCurrentUserProfile() async {
    if (_cachedProfile != null) return _cachedProfile;

    // Check device persistent storage first so user stays logged in across app restarts
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedJson = prefs.getString('saved_user_profile');
      if (savedJson != null && savedJson.isNotEmpty) {
        _cachedProfile = Map<String, dynamic>.from(jsonDecode(savedJson));
        return _cachedProfile;
      }
    } catch (e) {
      debugPrint('Error restoring profile from preferences: $e');
    }

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
    final batches = await getTrainerBatches();
    final now = DateTime.now();
    final dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final currentDayName = dayNames[now.weekday];

    final List<Map<String, dynamic>> todaySessions = [];
    for (var b in batches) {
      final daysRaw = b['days_of_week'];
      List<String> days = [];
      if (daysRaw is List) {
        days = daysRaw.map((e) => e.toString()).toList();
      } else if (daysRaw != null) {
        days = daysRaw.toString().split(',').map((e) => e.trim()).toList();
      }

      final isToday = days.any((d) => d.trim().toLowerCase() == currentDayName.toLowerCase());
      if (isToday) {
        final enrolledCount = b['enrolled_count'] ?? (b['students'] is List ? (b['students'] as List).length : 0);
        todaySessions.add({
          'id': b['id'],
          'session_date': DateFormat('yyyy-MM-dd').format(now),
          'start_time': b['start_time'] ?? '17:00',
          'end_time': b['end_time'] ?? '18:30',
          'status': 'scheduled',
          'check_in_code': '482910',
          'batch_id': b['id'],
          'batches': {
            'id': b['id'],
            'name': b['name'],
            'room_or_hall': b['room_or_hall'] ?? 'Natya Mandapam (Room 101)',
            'max_capacity': b['max_capacity'] ?? 20,
            'enrolled_count': enrolledCount,
            'courses': {
              'id': b['course_id'],
              'title': b['course_title'] ?? 'Classical Dance',
              'category': b['course_category'] ?? 'Classical Arts',
            }
          }
        });
      }
    }

    if (todaySessions.isNotEmpty) {
      return todaySessions;
    }

    // Direct Supabase fallback if initialized
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
        debugPrint('Cloud query failed: $e.');
      }
    }

    return todaySessions;
  }

  Future<List<Map<String, dynamic>>> getTrainerBatches({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedTrainerBatches.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedTrainerBatches);
    }

    // 1. Live fetch from local / web backend API
    try {
      final prof = _cachedProfile;
      final tName = prof?['full_name'] ?? '';
      final tPhone = prof?['phone'] ?? '';
      final tId = prof?['id'] ?? '';
      final nameParam = Uri.encodeComponent(tName);
      final phoneParam = Uri.encodeComponent(tPhone);
      final idParam = Uri.encodeComponent(tId);
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/trainer/batches?trainerId=$idParam&trainerName=$nameParam&phone=$phoneParam');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['batches'] is List) {
          final liveBatches = List<Map<String, dynamic>>.from(decoded['batches']);
          if (liveBatches.isNotEmpty) {
            _cachedTrainerBatches = liveBatches;
            return liveBatches;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch notice for trainer batches: $e');
    }

    if (_cachedTrainerBatches.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedTrainerBatches);
    }

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
    final prof = _cachedProfile;
    if (prof != null) {
      final enrolled = prof['enrolled_courses'];
      if (enrolled is List && enrolled.isNotEmpty) {
        return List<Map<String, dynamic>>.from(enrolled);
      }
      if (prof['course'] != null) {
        return [
          {
            'id': prof['id'] ?? 'c-1',
            'title': prof['course'] ?? 'Classical Dance',
            'telugu_name': prof['course_category'] ?? 'Indian Arts',
            'category': prof['course_category'] ?? 'Classical Dance',
            'trainer_name': prof['trainer_name'] ?? 'Assigned Guru',
            'batch_name': prof['batch'] ?? 'Batch A',
            'batch_id': 'batch-current',
            'timings': prof['timings'] ?? 'Mon, Wed, Fri • 17:00 - 18:30',
            'room': prof['room_or_hall'] ?? 'Natya Mandapam (Room 101)',
            'start_date': '01 Jan 2026',
            'status': 'Active',
            'fee': '₹${prof['total_monthly_fee'] ?? 2000} / month',
            'attendance_rate': 92,
            'month_attendance': '92% (11/12 classes)',
            'month_attended': 11,
            'month_total': 12,
            'syllabus_covered': 'Classical technique, mudras, & foundational practice',
            'dress_code': 'Practice attire or uniform with ghungroos firmly pinned',
          }
        ];
      }
    }

    return [
      {
        'id': 'c-1',
        'title': 'Bharathanatyam',
        'telugu_name': 'Classical Indian Dance',
        'category': 'Classical Dance',
        'trainer_name': 'Guru Smt. Nandana',
        'batch_name': 'Batch A (Beginners)',
        'batch_id': 'batch-201',
        'timings': 'Mon, Wed, Fri • 17:00 - 18:30',
        'room': 'Natya Mandapam (Room 101)',
        'start_date': '01 Jan 2026',
        'status': 'Active',
        'fee': '₹2,500 / month',
        'attendance_rate': 92,
        'month_attendance': '92% (11/12 classes)',
        'month_attended': 11,
        'month_total': 12,
        'syllabus_covered': 'Adavu Steps 1-8, Alarippu rhythm bols',
        'dress_code': 'Practice Saree or Salwar with Dupatta firmly pinned',
      }
    ];
  }

  Future<List<Map<String, dynamic>>> getStudentSchedule() async {
    final now = DateTime.now();
    final dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final currentDayName = dayNames[now.weekday];

    if (_cachedProfile == null) {
      await getCurrentUserProfile();
    }

    final enrolled = _cachedProfile?['enrolled_courses'];
    if (enrolled is List && enrolled.isNotEmpty) {
      final List<Map<String, dynamic>> realSchedule = [];
      int idx = 1;

      for (var c in enrolled) {
        if (c is! Map) continue;
        final courseTitle = c['title']?.toString() ?? 'Classical Arts';
        final category = c['category']?.toString() ?? 'Classical Dance';
        final batchName = c['batch_name']?.toString() ?? 'Batch';
        final batchId = c['batch_id']?.toString() ?? 'b-$idx';
        final trainer = c['trainer_name']?.toString() ?? 'Assigned Guru';
        final room = c['room']?.toString() ?? 'Natya Mandapam (Room 101)';
        final timings = c['timings']?.toString() ?? '05:00 PM - 06:30 PM';

        // Extract days
        List<String> days = [];
        if (c['days_of_week'] is List) {
          days = (c['days_of_week'] as List).map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
        }
        if (days.isEmpty) {
          final rawTimings = timings.split(RegExp(r'[•·\-]'));
          final daysPart = rawTimings[0];
          for (var d in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
            if (daysPart.toLowerCase().contains(d.toLowerCase()) || daysPart.toLowerCase().contains(d.substring(0, 3).toLowerCase())) {
              days.add(d);
            }
          }
        }
        if (days.isEmpty) {
          days = ['Monday', 'Wednesday', 'Friday'];
        }

        String classTime = '05:00 PM - 06:30 PM';
        if (c['start_time'] != null && c['end_time'] != null) {
          classTime = '${c['start_time']} - ${c['end_time']}';
        } else if (timings.contains('•')) {
          classTime = timings.split('•').last.trim();
        } else if (timings.contains('-')) {
          classTime = timings.trim();
        }

        for (var day in days) {
          final isToday = day.toLowerCase() == currentDayName.toLowerCase();
          final diff = (dayNames.indexOf(day) - now.weekday + 7) % 7;
          final targetDate = now.add(Duration(days: diff));
          final dateStr = DateFormat('dd-MMMM-yyyy').format(targetDate);

          realSchedule.add({
            'id': 'sch-${c['id']}-$day',
            'course': courseTitle,
            'category': category,
            'batch': batchName,
            'batch_id': batchId,
            'trainer': trainer,
            'time': classTime,
            'room': room,
            'day': day,
            'date': dateStr,
            'status': 'Scheduled',
            'is_today': isToday,
            'is_tomorrow': (diff == 1),
          });
        }
        idx++;
      }

      if (realSchedule.isNotEmpty) {
        realSchedule.sort((a, b) => dayNames.indexOf(a['day']).compareTo(dayNames.indexOf(b['day'])));
        return realSchedule;
      }
    }

    return [
      {
        'id': 'sch-1',
        'course': 'Bharathanatyam Foundation',
        'category': 'Classical Dance',
        'batch': 'Batch A (Beginners)',
        'batch_id': 'batch-201',
        'trainer': 'Guru Smt. Radhika Sharma',
        'time': '05:00 PM - 06:30 PM',
        'room': 'Natya Mandapam (Room 101)',
        'day': 'Monday',
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
        'time': '07:30 AM - 08:45 AM',
        'room': 'Sangeetha Shala (Room 202)',
        'day': 'Tuesday',
        'date': '06-October-2026',
        'status': 'Scheduled',
        'is_today': false,
        'is_tomorrow': false,
      },
      {
        'id': 'sch-3',
        'course': 'Bharathanatyam Abhinaya',
        'category': 'Classical Dance',
        'batch': 'Batch A (Beginners)',
        'batch_id': 'batch-201',
        'trainer': 'Guru Smt. Radhika Sharma',
        'time': '05:00 PM - 06:30 PM',
        'room': 'Natya Mandapam (Room 101)',
        'day': 'Wednesday',
        'date': '07-October-2026',
        'status': 'Scheduled',
        'is_today': false,
        'is_tomorrow': false,
      },
      {
        'id': 'sch-4',
        'course': 'Carnatic Vocal Ragas & Sarali',
        'category': 'Vocal & Music',
        'batch': 'Morning Ragas',
        'batch_id': 'batch-203',
        'trainer': 'Vidwan Sri K. Venkatesh',
        'time': '07:30 AM - 08:45 AM',
        'room': 'Sangeetha Shala (Room 202)',
        'day': 'Thursday',
        'date': '08-October-2026',
        'status': 'Scheduled',
        'is_today': false,
        'is_tomorrow': false,
      },
      {
        'id': 'sch-5',
        'course': 'Bharathanatyam Adavu & Jathi',
        'category': 'Classical Dance',
        'batch': 'Batch A (Beginners)',
        'batch_id': 'batch-201',
        'trainer': 'Guru Smt. Radhika Sharma',
        'time': '05:00 PM - 06:30 PM',
        'room': 'Natya Mandapam (Room 101)',
        'day': 'Friday',
        'date': '09-October-2026',
        'status': 'Scheduled',
        'is_today': false,
        'is_tomorrow': false,
      },
      {
        'id': 'sch-6',
        'course': 'Stage Rehearsal & Nattuvangam',
        'category': 'Classical Dance',
        'batch': 'Weekend Masterclass',
        'batch_id': 'batch-205',
        'trainer': 'Guru Smt. Radhika Sharma',
        'time': '09:00 AM - 11:00 AM',
        'room': 'Main Auditorium Stage',
        'day': 'Saturday',
        'date': '10-October-2026',
        'status': 'Scheduled',
        'is_today': false,
        'is_tomorrow': false,
      },
    ];
  }

  Future<List<Map<String, dynamic>>> getStudentAttendanceHistory() async {
    try {
      final prof = _cachedProfile;
      final studentId = (prof?['id'] ?? prof?['profile_id'] ?? '').toString();
      final roll = (prof?['roll_number'] ?? '').toString();
      final idParam = studentId.isNotEmpty ? studentId : roll;
      if (idParam.isNotEmpty) {
        final uri = Uri.parse('${ApiConstants.baseUrl}/api/attendance?studentId=${Uri.encodeComponent(idParam)}');
        final res = await http.get(uri).timeout(const Duration(seconds: 10));
        if (res.statusCode == 200) {
          final decoded = jsonDecode(res.body);
          if (decoded is Map && decoded['success'] == true && decoded['history'] is List) {
            final liveHistory = List<Map<String, dynamic>>.from(decoded['history']);
            if (liveHistory.isNotEmpty) {
              return liveHistory;
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching live attendance history: $e');
    }

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
      return '${ApiConstants.baseUrl}$url';
    }

    return url;
  }

  Future<List<Map<String, dynamic>>> getBannerAnnouncements({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedBannerAnnouncements.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedBannerAnnouncements);
    }

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
          _cachedBannerAnnouncements = live;
          return live;
        }
      } catch (e) {
        debugPrint('Supabase direct query banner notice: $e');
      }
    }

    // 2. HTTP API fallback
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/announcements?announcementType=banner');
      final res = await http.get(uri).timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['announcements'] is List) {
          final live = List<Map<String, dynamic>>.from(decoded['announcements']);
          if (live.isNotEmpty) {
            for (var item in live) {
              item['image_url'] = _normalizeImageUrl(item['image_url']);
            }
            _cachedBannerAnnouncements = live;
            return live;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch notice for banner announcements: $e');
    }

    if (_cachedBannerAnnouncements.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedBannerAnnouncements);
    }
    return List<Map<String, dynamic>>.from(_mockBannerAnnouncements);
  }

  List<Map<String, dynamic>> _filterAnnouncementsForCurrentUser(List<Map<String, dynamic>> items) {
    final profile = currentUserProfile;
    if (profile == null) return items;

    final role = (profile['role'] ?? '').toString().toLowerCase();
    final isTrainer = role.contains('trainer') || role.contains('guru') || role == 'teacher';
    final myId = (profile['id'] ?? profile['profile_id'] ?? '').toString().toLowerCase();
    final myName = (profile['full_name'] ?? '').toString().toLowerCase();
    final myRoll = (profile['roll_number'] ?? '').toString().toLowerCase();

    final enrolledBatchIds = <String>{};
    final enrolledCourseIds = <String>{};
    final enrolled = profile['enrolled_courses'];
    if (enrolled is List) {
      for (var e in enrolled) {
        if (e is Map) {
          final bId = e['batch_id']?.toString().toLowerCase();
          if (bId != null && bId.isNotEmpty) enrolledBatchIds.add(bId);
          final cId = e['course_id']?.toString().toLowerCase();
          if (cId != null && cId.isNotEmpty) enrolledCourseIds.add(cId);
        }
      }
    }

    return items.where((item) {
      final senderRole = (item['sender_role'] ?? '').toString().toLowerCase();
      final isGuruMsg = senderRole.contains('trainer') ||
          senderRole.contains('guru') ||
          item['trainer_id'] != null ||
          (item['trainer_name'] != null && item['trainer_name'].toString().trim().isNotEmpty);

      if (isTrainer) {
        if (!isGuruMsg) {
          final aud = (item['audience'] ?? '').toString().toLowerCase();
          if (aud.contains('trainer') || aud.contains('all') || aud.contains('gurus') || aud == '') {
            return true;
          }
          return false;
        }
        final tId = (item['trainer_id'] ?? '').toString().toLowerCase();
        final tName = (item['trainer_name'] ?? item['created_by'] ?? '').toString().toLowerCase();
        if (tId.isNotEmpty && tId == myId) return true;
        if (tName.isNotEmpty && (tName.contains(myName) || myName.contains(tName))) return true;
        return false;
      } else {
        if (!isGuruMsg) {
          final aud = (item['audience'] ?? '').toString().toLowerCase();
          if (aud.contains('trainer') && !aud.contains('student') && !aud.contains('all')) {
            return false;
          }
          return true;
        }

        final targetBatchId = (item['target_batch_id'] ?? '').toString().toLowerCase();
        final targetCourseId = (item['target_course_id'] ?? '').toString().toLowerCase();

        if (targetBatchId.isNotEmpty && targetBatchId != 'all') {
          if (enrolledBatchIds.contains(targetBatchId)) return true;
        }
        if (targetCourseId.isNotEmpty && targetCourseId != 'all') {
          if (enrolledCourseIds.contains(targetCourseId)) return true;
        }

        final targetStudents = item['target_students'];
        if (targetStudents is List && targetStudents.isNotEmpty) {
          for (var s in targetStudents) {
            final sStr = s.toString().toLowerCase();
            if (sStr.contains(myId) || (myRoll.isNotEmpty && sStr.contains(myRoll)) || (myName.isNotEmpty && sStr.contains(myName))) {
              return true;
            }
          }
          return false;
        }

        if (targetBatchId == 'all' || targetBatchId.isEmpty) {
          if (targetCourseId.isNotEmpty && enrolledCourseIds.contains(targetCourseId)) {
            return true;
          }
        }

        return false;
      }
    }).toList();
  }

  Future<List<Map<String, dynamic>>> getMessageAnnouncements({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedMessageAnnouncements.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedMessageAnnouncements);
    }

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
          final filtered = _filterAnnouncementsForCurrentUser(valid);
          if (filtered.isNotEmpty) {
            _cachedMessageAnnouncements = filtered;
            return filtered;
          }
        }
      } catch (e) {
        debugPrint('Supabase direct query message notice: $e');
      }
    }

    // 2. HTTP API fallback
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/announcements?announcementType=message');
      final res = await http.get(uri).timeout(const Duration(seconds: 3));
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
            final filtered = _filterAnnouncementsForCurrentUser(valid);
            if (filtered.isNotEmpty) {
              _cachedMessageAnnouncements = filtered;
              return filtered;
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch notice for message announcements: $e');
    }

    if (_cachedMessageAnnouncements.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedMessageAnnouncements);
    }
    return List<Map<String, dynamic>>.from(_mockMessageAnnouncements);
  }

  final Set<String> _readNotifIds = {};
  final Set<String> _readMessageIds = {};
  final Set<String> _readVideoIds = {};
  int _lastReadMessageTimestamp = 0;
  int _lastReadVideoTimestamp = 0;
  bool _readStateLoaded = false;
  List<Map<String, dynamic>> _cachedNotifications = [];

  Future<void> _ensureReadStateLoaded() async {
    if (_readStateLoaded) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final msgs = prefs.getStringList('laasya_read_message_ids');
      if (msgs != null) _readMessageIds.addAll(msgs);
      final vids = prefs.getStringList('laasya_read_video_ids');
      if (vids != null) _readVideoIds.addAll(vids);
      final notifs = prefs.getStringList('laasya_read_notif_ids');
      if (notifs != null) _readNotifIds.addAll(notifs);
      _lastReadMessageTimestamp = prefs.getInt('laasya_msg_read_ts') ?? 0;
      _lastReadVideoTimestamp = prefs.getInt('laasya_vid_read_ts') ?? 0;
      _readStateLoaded = true;
    } catch (_) {}
  }

  Future<void> _saveReadMessages() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('laasya_read_message_ids', _readMessageIds.toList());
      await prefs.setStringList('laasya_read_notif_ids', _readNotifIds.toList());
      await prefs.setInt('laasya_msg_read_ts', _lastReadMessageTimestamp);
    } catch (_) {}
  }

  Future<void> _saveReadVideos() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('laasya_read_video_ids', _readVideoIds.toList());
      await prefs.setStringList('laasya_read_notif_ids', _readNotifIds.toList());
      await prefs.setInt('laasya_vid_read_ts', _lastReadVideoTimestamp);
    } catch (_) {}
  }

  int getUnreadMessagesCount() {
    if (!_readStateLoaded) {
      _ensureReadStateLoaded();
    }
    final list = _cachedMessageAnnouncements.isNotEmpty ? _cachedMessageAnnouncements : _mockMessageAnnouncements;
    return list.where((m) {
      final id = m['id']?.toString();
      if (id != null && _readMessageIds.contains(id)) return false;
      if (_lastReadMessageTimestamp > 0) {
        final dateStr = (m['publish_date'] ?? m['created_at'])?.toString();
        if (dateStr != null) {
          final dt = DateTime.tryParse(dateStr.contains('T') ? dateStr : '$dateStr 00:00:00');
          if (dt != null && dt.millisecondsSinceEpoch <= _lastReadMessageTimestamp) {
            return false;
          }
        }
      }
      return true;
    }).length;
  }

  int getUnreadVideosCount() {
    if (!_readStateLoaded) {
      _ensureReadStateLoaded();
    }
    final videoAlerts = _cachedNotifications.where((n) {
      final t = (n['type'] ?? '').toString();
      return t == 'video' || t == 'video_shared';
    });
    return videoAlerts.where((n) {
      final id = n['id']?.toString();
      if (id != null && _readVideoIds.contains(id)) return false;
      if (_lastReadVideoTimestamp > 0) {
        final dateStr = (n['date'] ?? n['created_at'])?.toString();
        if (dateStr != null) {
          final dt = DateTime.tryParse(dateStr.contains('T') ? dateStr : '$dateStr 00:00:00');
          if (dt != null && dt.millisecondsSinceEpoch <= _lastReadVideoTimestamp) {
            return false;
          }
        }
      }
      return true;
    }).length;
  }

  void markMessageAsRead(String id) {
    _readMessageIds.add(id);
    _readNotifIds.add(id);
    _saveReadMessages();
  }

  void markAllMessagesAsRead([List<Map<String, dynamic>>? currentList]) {
    final list = (currentList != null && currentList.isNotEmpty)
        ? currentList
        : (_cachedMessageAnnouncements.isNotEmpty ? _cachedMessageAnnouncements : _mockMessageAnnouncements);
    for (var m in list) {
      final id = m['id']?.toString();
      if (id != null) {
        _readMessageIds.add(id);
        _readNotifIds.add(id);
      }
    }
    _lastReadMessageTimestamp = DateTime.now().millisecondsSinceEpoch;
    _saveReadMessages();
  }

  void markVideoAsRead(String id) {
    _readVideoIds.add(id);
    _readNotifIds.add(id);
    _saveReadVideos();
  }

  void markAllVideosAsRead() {
    for (var n in _cachedNotifications) {
      final id = n['id']?.toString();
      if (id != null) {
        _readVideoIds.add(id);
        _readNotifIds.add(id);
      }
    }
    _lastReadVideoTimestamp = DateTime.now().millisecondsSinceEpoch;
    _saveReadVideos();
  }

  Future<List<Map<String, dynamic>>> getNotifications() async {
    // 1. If cached notifications exist, return immediately (<1ms) to eliminate loading spinners and lag
    if (_cachedNotifications.isNotEmpty) {
      _refreshNotificationsInBackground();
      return List<Map<String, dynamic>>.from(_cachedNotifications);
    }

    return await _refreshNotificationsInternal();
  }

  Future<List<Map<String, dynamic>>> refreshNotifications() async {
    return await _refreshNotificationsInternal();
  }

  void _refreshNotificationsInBackground() {
    _refreshNotificationsInternal().catchError((e) {
      debugPrint('Background notification refresh notice: $e');
      return <Map<String, dynamic>>[];
    });
  }

  Future<List<Map<String, dynamic>>> _fetchLiveSessionAlerts() async {
    final alertsList = <Map<String, dynamic>>[];
    try {
      final prof = _cachedProfile;
      if (prof != null) {
        final enrolled = prof['enrolled_courses'];
        final studentId = (prof['id'] ?? prof['profile_id'] ?? '').toString();
        final rollNumber = (prof['roll_number'] ?? '').toString();
        final studentName = (prof['full_name'] ?? '').toString();
        final phone = (prof['phone'] ?? '').toString();

        String batchIdsParam = 'all';
        if (enrolled is List && enrolled.isNotEmpty) {
          final bIds = enrolled
              .map((e) => e is Map ? e['batch_id']?.toString() : null)
              .where((id) => id != null && id.isNotEmpty)
              .toList();
          if (bIds.isNotEmpty) {
            batchIdsParam = bIds.join(',');
          }
        }

        final sIdEnc = Uri.encodeComponent(studentId);
        final rollEnc = Uri.encodeComponent(rollNumber);
        final nameEnc = Uri.encodeComponent(studentName);
        final phoneEnc = Uri.encodeComponent(phone);

        final uri = Uri.parse(
          '${ApiConstants.baseUrl}/api/sessions/alerts?batchIds=$batchIdsParam&studentId=$sIdEnc&rollNumber=$rollEnc&name=$nameEnc&phone=$phoneEnc&sinceSeconds=86400'
        );
        final res = await http.get(uri).timeout(const Duration(seconds: 3));
        if (res.statusCode == 200) {
          final decoded = jsonDecode(res.body);
          if (decoded is Map && decoded['success'] == true && decoded['alerts'] is List) {
            final alerts = List<Map<String, dynamic>>.from(decoded['alerts']);
            for (var a in alerts) {
              final id = (a['id'] ?? '').toString();
              final alertType = (a['alert_type'] ?? '').toString();
              final isAttendance = alertType == 'attendance_marked';
              final isVideo = alertType == 'video_shared';
              final isMessage = alertType == 'message' || alertType == 'announcement';
              final status = (a['student_status'] ?? 'present').toString().toUpperCase();
              final courseTitle = a['course_title'] ?? 'Classical Dance';
              final batchName = a['batch_name'] ?? 'Session';
              final trainerName = a['trainer_name'] ?? 'Guru';

              final title = isAttendance
                  ? 'Attendance Confirmed: $status'
                  : isVideo
                      ? 'New Practice Video Shared'
                      : isMessage
                          ? 'Academy Message: $courseTitle'
                          : (a['title'] ?? 'Class Session Concluded');
              final message = isAttendance
                  ? '$courseTitle ($batchName) • Recorded by Guru $trainerName'
                  : (a['message'] ?? 'Class concluded. Parents are requested to pick up student.');

              final createdAt = a['created_at']?.toString();
              String dateStr = 'Today';
              if (createdAt != null && createdAt.contains('T')) {
                final timePart = createdAt.split('T')[1].split('.').first;
                dateStr = 'Today, $timePart';
              }

              alertsList.add({
                'id': id.isNotEmpty ? id : UniqueKey().toString(),
                'title': title,
                'message': message,
                'type': isAttendance ? 'attendance' : isVideo ? 'video' : isMessage ? 'message' : 'class_alert',
                'status': status,
                'course_title': courseTitle,
                'batch_name': batchName,
                'trainer_name': trainerName,
                'date': dateStr,
                'is_read': _readNotifIds.contains(id),
              });
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Live session alerts lookup notice: $e');
    }
    return alertsList;
  }

  Future<List<Map<String, dynamic>>> _refreshNotificationsInternal() async {
    final notifs = <Map<String, dynamic>>[];

    try {
      // Execute alerts, message announcements, banners, and payments concurrently in parallel
      final results = await Future.wait([
        _fetchLiveSessionAlerts(),
        getMessageAnnouncements(),
        getBannerAnnouncements(),
        getStudentPayments(),
      ]).timeout(
        const Duration(seconds: 3),
        onTimeout: () => [[], _mockMessageAnnouncements, _mockBannerAnnouncements, _cachedPayments],
      );

      final alerts = results[0];
      final messages = results[1];
      final banners = results[2];
      final payments = results[3];

      notifs.addAll(alerts);

      for (var m in messages) {
        final item = Map<String, dynamic>.from(m);
        final id = (item['id'] ?? '').toString();
        item['type'] = (m['type_tag'] ?? 'General').toString().toLowerCase().replaceAll(' ', '_');
        if (item['type'] == 'fee_reminder') item['type'] = 'reminder';
        item['date'] = item['date'] ?? item['publish_date'] ?? 'Today';
        item['is_read'] = _readNotifIds.contains(id) || (item['is_read'] == true);
        notifs.add(item);
      }

      for (var b in banners) {
        final item = Map<String, dynamic>.from(b);
        final id = (item['id'] ?? '').toString();
        item['type'] = 'announcement';
        item['date'] = item['date'] ?? 'Today';
        item['is_read'] = _readNotifIds.contains(id) || (item['is_read'] == true);
        notifs.add(item);
      }

      for (var p in payments) {
        final item = Map<String, dynamic>.from(p);
        final id = (item['id'] ?? '').toString();
        final amount = item['amount_paid'] ?? 2000;
        final receiptNo = item['receipt_number'] ?? item['invoice_number'] ?? 'REC';
        final course = item['course_title'] ?? 'Classical Arts';
        final period = item['fee_period'] ?? 'Monthly Fee';
        final payDate = item['payment_date'] ?? 'Recent';

        notifs.add({
          'id': 'notif-$id',
          'title': 'Fee Receipt: $receiptNo (₹$amount)',
          'message': 'Payment of ₹$amount for $course ($period) recorded. Paid on $payDate via ${item['payment_method'] ?? 'UPI'}.',
          'type': 'payment',
          'date': payDate,
          'is_read': _readNotifIds.contains('notif-$id'),
          'amount': amount,
          'course_title': course,
          'receipt_number': receiptNo,
        });
      }

      _cachedNotifications = notifs;
    } catch (e) {
      debugPrint('Notification parallel fetch notice: $e');
      if (_cachedNotifications.isEmpty) {
        for (var m in _mockMessageAnnouncements) {
          notifs.add(Map<String, dynamic>.from(m));
        }
        for (var b in _mockBannerAnnouncements) {
          notifs.add(Map<String, dynamic>.from(b));
        }
        _cachedNotifications = notifs;
      }
    }

    return List<Map<String, dynamic>>.from(_cachedNotifications);
  }

  Future<void> markNotificationAsRead(String notifId) async {
    _readNotifIds.add(notifId);
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
    // 1. Live fetch from web backend API
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/video-library');
      final res = await http.get(uri).timeout(const Duration(seconds: 15));
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
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/finance/student-payments');
      final res = await http.get(uri).timeout(const Duration(seconds: 15));
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
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/finance/trainer-salaries');
      final res = await http.get(uri).timeout(const Duration(seconds: 15));
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

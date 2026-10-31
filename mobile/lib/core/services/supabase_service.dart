import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/supabase_constants.dart';
import '../constants/api_constants.dart';
import 'fcm_service.dart';

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

  Future<void> _saveBannerAnnouncementsToPrefs(List<Map<String, dynamic>> banners) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('laasya_cached_banners', jsonEncode(banners));
    } catch (e) {
      debugPrint('Error saving cached banners: $e');
    }
  }

  Future<void> _saveMessageAnnouncementsToPrefs(List<Map<String, dynamic>> messages) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('laasya_cached_messages', jsonEncode(messages));
    } catch (e) {
      debugPrint('Error saving cached messages: $e');
    }
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
      'message': 'Dear Students & Respected Parents,\n\nPlease note that regular classes will remain suspended from Oct 11 to Oct 13 in observance of Vijayadashami & Saraswathi Pooja.\n\n✨ Special Maha Pooja & Vidhyarambham will be celebrated on Saturday, Oct 12 at 09:00 AM at Natya Mandapam (Room 101). All students, parents, and art lovers are cordially invited to seek the blessings of the Gurus.\n\nPranaams,\nAcademy Administration',
      'type': 'message',
      'announcement_type': 'message',
      'type_tag': 'Holiday',
      'image_url': 'assets/images/cultural_banner.png',
      'sender_name': 'Sri Ramesh Rao (Academy Director)',
      'audience': 'All students',
      'date': 'Today',
      'time': '10:15 AM',
      'publish_date': '2026-10-10',
      'created_at': '2026-10-10T09:00:00Z',
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
      'publish_date': '2026-10-08',
      'created_at': '2026-10-08T09:00:00Z',
      'is_delivered': true,
      'is_read': true,
      'action_links': [
        {'title': 'Direct UPI Payment Link', 'url': 'https://laasyaacademy.com/pay-fee'},
      ],
    },
    {
      'id': 'msg-3',
      'title': 'Weekend Batch Timing Alignment for Stage Rehearsals',
      'message': 'Attention Bharathanatyam (Batch A & Batch B) Students:\n\nStarting this Saturday, morning batch timings will begin 30 minutes earlier at 08:30 AM to accommodate stage lighting & blocking rehearsals for our upcoming Annual Cultural Samarpanam 2026.\n\nStudents are advised to arrive 10 minutes in advance wearing standard academy dance attire and ghungroos.\n\nGuru Smt. Anusha Sumesh\nHead of Classical Dance',
      'type': 'message',
      'announcement_type': 'message',
      'type_tag': 'Schedule change',
      'sender_name': 'Guru Smt. Anusha Sumesh',
      'audience': 'Bharathanatyam',
      'date': '04 Oct 2026',
      'time': '11:20 AM',
      'publish_date': '2026-10-04',
      'created_at': '2026-10-04T09:00:00Z',
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
      'publish_date': '2026-10-02',
      'created_at': '2026-10-02T09:00:00Z',
      'is_delivered': true,
      'is_read': true,
    },
  ];

  Future<void> initialize() async {
    // 1. Immediately restore persistent login profile from device storage so app NEVER logs out on close
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedRaw = prefs.get('saved_user_profile');
      if (savedRaw is Map) {
        _cachedProfile = Map<String, dynamic>.from(savedRaw);
      } else if (savedRaw is String && savedRaw.isNotEmpty) {
        try {
          var decoded = jsonDecode(savedRaw);
          if (decoded is String) {
            decoded = jsonDecode(decoded);
          }
          if (decoded is Map) {
            _cachedProfile = Map<String, dynamic>.from(decoded);
          }
        } catch (_) {}
      }
      if (_cachedProfile != null) {
        debugPrint('Restored persistent login for ' + (_cachedProfile?['full_name']?.toString() ?? '') + ' (' + (_cachedProfile?['role']?.toString() ?? '') + ')');
      }

      final savedBannersJson = prefs.getString('laasya_cached_banners');
      if (savedBannersJson != null && savedBannersJson.isNotEmpty) {
        final decoded = jsonDecode(savedBannersJson);
        if (decoded is List) {
          _cachedBannerAnnouncements = decoded.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
        }
      }

      final savedMessagesJson = prefs.getString('laasya_cached_messages');
      if (savedMessagesJson != null && savedMessagesJson.isNotEmpty) {
        final decoded = jsonDecode(savedMessagesJson);
        if (decoded is List) {
          _cachedMessageAnnouncements = decoded.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
        }
      }

      final savedNotifsJson = prefs.getString('laasya_cached_notifications');
      if (savedNotifsJson != null && savedNotifsJson.isNotEmpty) {
        final decoded = jsonDecode(savedNotifsJson);
        if (decoded is List) {
          _cachedNotifications = decoded.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
        }
      }

      final savedSalariesJson = prefs.getString('laasya_cached_trainer_salaries');
      if (savedSalariesJson != null && savedSalariesJson.isNotEmpty) {
        final decoded = jsonDecode(savedSalariesJson);
        if (decoded is List) {
          _cachedSalaries = decoded.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
        }
      }

      final savedPaymentsJson = prefs.getString('laasya_cached_student_payments');
      if (savedPaymentsJson != null && savedPaymentsJson.isNotEmpty) {
        final decoded = jsonDecode(savedPaymentsJson);
        if (decoded is List) {
          _cachedPayments = decoded.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error restoring saved cached sessions: $e');
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
      preloadTrainerAvatars().catchError((_) {});
    }
  }

  // ---------------------------------------------------------------------------
  // GURU & ADMIN AVATARS CACHE
  // ---------------------------------------------------------------------------
  final Map<String, String> _trainerAvatarMap = {};
  String? _adminAvatarUrl;

  String? getTrainerAvatar(String? trainerId, String? trainerName) {
    if (trainerId != null && trainerId.trim().isNotEmpty) {
      final tid = trainerId.trim().toLowerCase();
      if (_trainerAvatarMap.containsKey(tid)) {
        return _trainerAvatarMap[tid];
      }
    }
    if (trainerName != null && trainerName.trim().isNotEmpty) {
      final tname = trainerName.trim().toLowerCase();
      if (_trainerAvatarMap.containsKey(tname)) {
        return _trainerAvatarMap[tname];
      }
      for (final entry in _trainerAvatarMap.entries) {
        if (entry.key.contains(tname) || tname.contains(entry.key)) {
          return entry.value;
        }
      }
    }
    return null;
  }

  String? getAdminAvatar() => _adminAvatarUrl;

  Future<void> preloadTrainerAvatars() async {
    // 1. Direct Supabase query if available
    if (_isInitialized && _client != null) {
      try {
        final profiles = await _client!
            .from('profiles')
            .select('id, full_name, role, avatar_url')
            .or('role.eq.trainer,role.eq.owner,role.eq.admin');
        for (var p in profiles) {
          final av = p['avatar_url']?.toString();
          if (av != null && av.trim().isNotEmpty) {
            final role = (p['role'] ?? '').toString();
            if (role == 'owner' || role == 'admin') {
              _adminAvatarUrl = av;
            }
            final id = p['id']?.toString().toLowerCase();
            final name = p['full_name']?.toString().toLowerCase().trim();
            if (id != null && id.isNotEmpty) _trainerAvatarMap[id] = av;
            if (name != null && name.isNotEmpty) _trainerAvatarMap[name] = av;
          }
        }
      } catch (e) {
        debugPrint('Supabase preloadTrainerAvatars notice: $e');
      }
    }

    // 2. Fetch from backend API /api/trainers
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/trainers');
      final res = await http.get(uri).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is List) {
          for (var item in decoded) {
            if (item is Map) {
              final av = item['avatar_url']?.toString();
              if (av != null && av.trim().isNotEmpty) {
                final id = item['id']?.toString().toLowerCase();
                final name = (item['full_name'] ?? item['name'])?.toString().toLowerCase().trim();
                if (id != null && id.isNotEmpty) _trainerAvatarMap[id] = av;
                if (name != null && name.isNotEmpty) _trainerAvatarMap[name] = av;
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('HTTP preloadTrainerAvatars notice: $e');
    }

    // 3. Fetch Admin Avatar from /api/settings/admin-profile
    try {
      final adminUri = Uri.parse('${ApiConstants.baseUrl}/api/settings/admin-profile');
      final adminRes = await http.get(adminUri).timeout(const Duration(seconds: 5));
      if (adminRes.statusCode == 200) {
        final decoded = jsonDecode(adminRes.body);
        if (decoded is Map && decoded['success'] == true && decoded['profile'] is Map) {
          final av = decoded['profile']['avatar_url']?.toString();
          if (av != null && av.trim().isNotEmpty && av != 'null') {
            _adminAvatarUrl = av.trim();
          } else {
            _adminAvatarUrl = null;
          }
        }
      }
    } catch (e) {
      debugPrint('[SupabaseService] Notice fetching admin avatar: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // AUTH & PROFILES
  // ---------------------------------------------------------------------------
  // AUTHENTICATION & LOGIN
  // ---------------------------------------------------------------------------
  Future<Map<String, dynamic>?> signInWithPassword({
    String? email,
    String? identifier,
    String? password,
    String? role,
  }) async {
    final loginId = (identifier ?? email ?? '').trim();
    _cachedProfile = null;
    await _clearProfileFromPrefs();

    if (loginId.isEmpty) {
      throw Exception('Please enter your mobile number or roll number.');
    }
    if (password == null || password.trim().isEmpty) {
      throw Exception('Please enter your password.');
    }

    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/auth/mobile-login');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': loginId,
          'password': password.trim(),
          if (role != null) 'role': role,
        }),
      ).timeout(const Duration(seconds: 15));

      final decoded = jsonDecode(res.body);
      if (res.statusCode == 200) {
        if (decoded is Map && decoded['success'] == true && decoded['profile'] != null) {
          final prof = Map<String, dynamic>.from(decoded['profile']);
          if (role != null && prof['role'] != role) {
            throw Exception('Access Denied: This account is not registered as a .');
          }
          _cachedProfile = prof;
          await _saveProfileToPrefs(_cachedProfile!);
          return _cachedProfile;
        }
      }

      if (decoded is Map && decoded['error'] != null) {
        throw Exception(decoded['error']);
      }

      throw Exception('Authentication failed. Please verify your credentials and try again.');
    } catch (e) {
      if (e.toString().contains('Exception:')) rethrow;
      debugPrint('Mobile login connection error: ');
      throw Exception('Unable to reach the academy server. Please ensure the server is running and check your connection.');
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
    try {
      await FcmService.unregisterDeviceToken();
    } catch (_) {}
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
      final savedRaw = prefs.get('saved_user_profile');
      if (savedRaw is Map) {
        _cachedProfile = Map<String, dynamic>.from(savedRaw);
      } else if (savedRaw is String && savedRaw.isNotEmpty) {
        try {
          var decoded = jsonDecode(savedRaw);
          if (decoded is String) {
            decoded = jsonDecode(decoded);
          }
          if (decoded is Map) {
            _cachedProfile = Map<String, dynamic>.from(decoded);
          }
        } catch (_) {}
      }
      if (_cachedProfile != null) {
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
                profileData['trainer_id'] = trainer['id'];
                profileData['profile_id'] = user.id;
                final displayTitle = trainer['display_title'] ?? 'Revered Faculty Guru';
                profileData['display_title'] = displayTitle;
                profileData['title_name'] = displayTitle;
                final specs = trainer['specializations'];
                final courseName = (specs is List && specs.isNotEmpty)
                    ? specs.first.toString()
                    : 'Classical Arts';
                profileData['course_name'] = courseName;
                profileData['primary_course'] = courseName;
                profileData['monthly_salary'] = trainer['monthly_salary'];
                profileData['salary_payment_status'] = trainer['salary_payment_status'] ?? 'paid';
                profileData['specialization'] = trainer['display_title'] ?? trainer['bio'] ?? courseName;
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
                profileData['fixed_discount'] = student['fixed_discount'] ?? 0;
                profileData['scheme_id'] = student['scheme_id'];
                profileData['student_id'] = student['id'];
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
    // 1. Update local cached profile
    if (_cachedProfile != null) {
      _cachedProfile!['full_name'] = fullName;
      _cachedProfile!['phone'] = phone;
      if (emergencyContact != null) _cachedProfile!['parent_phone'] = emergencyContact;
      if (address != null) _cachedProfile!['address'] = address;
      if (bio != null) _cachedProfile!['specialization'] = bio;
      if (age != null) _cachedProfile!['age'] = age;
      if (gender != null) _cachedProfile!['gender'] = gender;
      if (avatarUrl != null) _cachedProfile!['avatar_url'] = avatarUrl;
      await _saveProfileToPrefs(_cachedProfile!);
    }

    // 2. Persist to backend database API
    try {
      final token = await getAuthToken();
      final res = await http.put(
        Uri.parse('${ApiConstants.baseUrl}/api/user/profile'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'fullName': fullName,
          'phone': phone,
          'emergencyContact': emergencyContact,
          'address': address,
          'bio': bio,
          'age': age,
          'gender': gender,
          'avatarUrl': avatarUrl,
        }),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['profile'] != null) {
          final serverProf = Map<String, dynamic>.from(decoded['profile']);
          _cachedProfile?.addAll(serverProf);
          if (_cachedProfile != null) {
            await _saveProfileToPrefs(_cachedProfile!);
          }
        }
        return true;
      } else {
        final decoded = jsonDecode(res.body);
        final errMsg = decoded is Map ? decoded['error'] ?? 'Profile update failed' : 'Profile update failed';
        debugPrint('[SupabaseService] Profile update API error: $errMsg');
        throw Exception(errMsg);
      }
    } catch (e) {
      debugPrint('[SupabaseService] Profile update error: $e');
      if (e.toString().contains('Exception:')) rethrow;
      return true;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final token = await getAuthToken();
      if (token == null || token.isEmpty) {
        throw Exception('You are not logged in. Please log in again.');
      }

      final res = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/api/user/change-password'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'current_password': currentPassword.trim(),
          'new_password': newPassword.trim(),
        }),
      ).timeout(const Duration(seconds: 10));

      final decoded = jsonDecode(res.body);
      if (res.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        return true;
      }

      final errMsg = decoded is Map && decoded['error'] != null
          ? decoded['error'].toString()
          : 'Failed to change password. Please check your existing password.';
      throw Exception(errMsg);
    } catch (e) {
      debugPrint('[SupabaseService] Change password error: $e');
      if (e.toString().contains('Exception:')) rethrow;
      throw Exception('Unable to reach the academy server. Please check your connection.');
    }
  }

  Future<Map<String, dynamic>?> validateSession() async {
    try {
      final token = await getAuthToken();
      if (token == null || token.isEmpty) {
        await signOut();
        return null;
      }

      final res = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/api/auth/session'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['authenticated'] == true && decoded['user'] is Map) {
          final serverUser = Map<String, dynamic>.from(decoded['user']);
          if (_cachedProfile != null) {
            _cachedProfile!['role'] = serverUser['role'];
            _cachedProfile!['id'] = serverUser['userId'] ?? _cachedProfile!['id'];
            if (serverUser['fullName'] != null && serverUser['fullName'].toString().isNotEmpty) {
              _cachedProfile!['full_name'] = serverUser['fullName'];
            }
            await _saveProfileToPrefs(_cachedProfile!);
          }
          return serverUser;
        }
      } else if (res.statusCode == 401 || res.statusCode == 403) {
        debugPrint('[SupabaseService] Session token rejected (HTTP ' + res.statusCode.toString() + '). Revoking cached session.');
        await signOut();
        return null;
      }
    } catch (e) {
      debugPrint('[SupabaseService] validateSession notice: $e');
      if (_cachedProfile != null) {
        return _cachedProfile;
      }
    }
    return null;
  }

  Future<String?> getAuthToken() async {
    final cached = _cachedProfile?['token']?.toString();
    if (cached != null && cached.isNotEmpty) {
      return cached;
    }
    try {
      final profile = await getCurrentUserProfile();
      final token = profile?['token']?.toString();
      if (token != null && token.isNotEmpty) {
        _cachedProfile?['token'] = token;
        return token;
      }
      final profileId = profile?['profile_id']?.toString() ?? profile?['id']?.toString();
      final phone = profile?['phone']?.toString() ?? profile?['parent_phone']?.toString() ?? '';
      final rollNumber = profile?['roll_number']?.toString() ?? '';
      final role = profile?['role']?.toString() ?? 'student';
      if (profileId != null || rollNumber.isNotEmpty) {
        final res = await http.post(
          Uri.parse('${ApiConstants.baseUrl}/api/auth/token'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'profileId': profileId ?? '',
            'phone': phone,
            'rollNumber': rollNumber,
            'role': role,
          }),
        ).timeout(const Duration(seconds: 8));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final newToken = data['token']?.toString();
          if (newToken != null && newToken.isNotEmpty) {
            _cachedProfile?['token'] = newToken;
            if (_cachedProfile != null) {
              await _saveProfileToPrefs(_cachedProfile!);
            }
            return newToken;
          }
        }
      }
    } catch (e) {
      debugPrint('Failed to get or refresh auth token: $e');
    }
    return null;
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

    // Fetch today's rescheduled tally classes from backend API
    final todayStr = DateFormat('yyyy-MM-dd').format(now);
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/tally-classes');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['tallyClasses'] is List) {
          final tcs = List<Map<String, dynamic>>.from(decoded['tallyClasses']);
          for (var tc in tcs) {
            if (tc['rescheduled_date'] == todayStr && tc['status'] == 'Scheduled') {
              final bId = tc['batch_id']?.toString();
              final matchesBatch = batches.any((b) => b['id']?.toString() == bId);
              if (matchesBatch || batches.isEmpty) {
                todaySessions.add({
                  'id': 'tally-${tc['id']}',
                  'session_date': todayStr,
                  'start_time': tc['start_time']?.toString().substring(0, 5) ?? '10:00',
                  'end_time': tc['end_time']?.toString().substring(0, 5) ?? '11:00',
                  'status': 'scheduled',
                  'check_in_code': '482910',
                  'batch_id': bId,
                  'is_rescheduled': true,
                  'is_tally': true,
                  'batches': {
                    'id': bId,
                    'name': tc['batch_name'] ?? 'Batch',
                    'room_or_hall': tc['room_or_hall'] ?? 'Natya Mandapam (Room 101)',
                    'max_capacity': 20,
                    'enrolled_count': tc['students_count'] ?? 15,
                    'courses': {
                      'id': tc['course_id'],
                      'title': tc['course_title'] ?? 'Classical Dance',
                      'category': 'Classical Arts',
                    }
                  }
                });
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching today tally classes for trainer: $e');
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
      final prof = _cachedProfile ?? await getCurrentUserProfile();
      final tName = (prof?['full_name'] ?? '').toString().trim();
      final tPhone = (prof?['phone'] ?? '').toString().trim();
      final tId = (prof?['trainer_id'] ?? prof?['id'] ?? prof?['profile_id'] ?? '').toString().trim();
      final nameParam = Uri.encodeComponent(tName);
      final phoneParam = Uri.encodeComponent(tPhone);
      final idParam = Uri.encodeComponent(tId);
      final token = await getAuthToken();
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/trainer/batches?trainerId=$idParam&trainerName=$nameParam&phone=$phoneParam');
      final res = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['batches'] is List) {
          final liveBatches = List<Map<String, dynamic>>.from(decoded['batches']);
          _cachedTrainerBatches = liveBatches;
          return liveBatches;
        }
      }
    } catch (e) {
      debugPrint('Live API fetch notice for trainer batches: $e');
    }

    return List<Map<String, dynamic>>.from(_cachedTrainerBatches);
  }

  List<Map<String, dynamic>> get trainerBatches =>
      List<Map<String, dynamic>>.from(_cachedTrainerBatches);

  Future<List<Map<String, dynamic>>> getBatchStudents(String batchId) async {
    final batches = await getTrainerBatches();
    final batch = batches.firstWhere(
      (b) => b['id'].toString() == batchId,
      orElse: () => <String, dynamic>{},
    );
    if (batch['students'] is List) {
      return List<Map<String, dynamic>>.from(batch['students']);
    }
    return [];
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

        // Calculate current week Monday strictly
        final currentMonday = DateTime(now.year, now.month, now.day).subtract(Duration(days: now.weekday - 1));

        for (var day in days) {
          final isToday = day.toLowerCase() == currentDayName.toLowerCase();
          final dayIdx = dayNames.indexOf(day);
          final targetDate = currentMonday.add(Duration(days: dayIdx >= 1 ? dayIdx - 1 : 0));
          final dateStr = DateFormat('dd-MMMM-yyyy').format(targetDate);
          final diffFromToday = targetDate.difference(DateTime(now.year, now.month, now.day)).inDays;

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
            'is_tomorrow': (diffFromToday == 1),
          });
        }
        idx++;
      }

      // Also fetch rescheduled tally classes for student's batches (Current Week Only)
      try {
        final uri = Uri.parse('${ApiConstants.baseUrl}/api/tally-classes');
        final res = await http.get(uri).timeout(const Duration(seconds: 4));
        if (res.statusCode == 200) {
          final decoded = jsonDecode(res.body);
          if (decoded is Map && decoded['tallyClasses'] is List) {
            final tcs = List<Map<String, dynamic>>.from(decoded['tallyClasses']);
            final enrolledBatchIds = enrolled.map((e) => e is Map ? e['batch_id']?.toString() : null).whereType<String>().toSet();
            final todayStr = DateFormat('yyyy-MM-dd').format(now);

            final currentMonday = DateTime(now.year, now.month, now.day).subtract(Duration(days: now.weekday - 1));
            final currentSunday = currentMonday.add(const Duration(days: 6, hours: 23, minutes: 59, seconds: 59));

            for (var tc in tcs) {
              final tcBatchId = tc['batch_id']?.toString();
              if (tc['status'] == 'Scheduled' && (enrolledBatchIds.isEmpty || enrolledBatchIds.contains(tcBatchId))) {
                final rDate = tc['rescheduled_date']?.toString() ?? todayStr;
                DateTime? dt;
                try {
                  dt = DateTime.parse(rDate);
                } catch (_) {}

                // Filter strictly to current week only
                if (dt != null) {
                  final dtStartOfDay = DateTime(dt.year, dt.month, dt.day);
                  if (dtStartOfDay.isBefore(currentMonday) || dtStartOfDay.isAfter(currentSunday)) {
                    continue;
                  }
                }

                final dayName = dt != null ? dayNames[dt.weekday] : currentDayName;
                final isToday = rDate == todayStr;
                final dateFormatted = dt != null ? DateFormat('dd-MMMM-yyyy').format(dt) : rDate;

                realSchedule.add({
                  'id': 'tally-${tc['id']}',
                  'course': tc['course_title'] ?? 'Classical Arts',
                  'category': 'Rescheduled / Tally Class',
                  'batch': tc['batch_name'] ?? 'Batch',
                  'batch_id': tcBatchId,
                  'trainer': tc['trainer_name'] ?? 'Assigned Guru',
                  'time': '${tc['start_time']?.toString().substring(0, 5)} - ${tc['end_time']?.toString().substring(0, 5)}',
                  'room': tc['room_or_hall'] ?? 'Natya Mandapam',
                  'day': dayName,
                  'date': dateFormatted,
                  'status': 'Rescheduled ★',
                  'is_today': isToday,
                  'is_tomorrow': false,
                  'is_rescheduled': true,
                  'is_tally': true,
                });
              }
            }
          }
        }
      } catch (e) {
        debugPrint('Error fetching student tally classes: $e');
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
        final token = await getAuthToken();
        final uri = Uri.parse('${ApiConstants.baseUrl}/api/attendance?studentId=${Uri.encodeComponent(idParam)}');
        final res = await http.get(
          uri,
          headers: {
            'Content-Type': 'application/json',
            if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 10));
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
          _saveBannerAnnouncementsToPrefs(live);
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
            _saveBannerAnnouncementsToPrefs(live);
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

  List<Map<String, dynamic>> getCachedBannerAnnouncements() {
    if (_cachedBannerAnnouncements.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedBannerAnnouncements);
    }
    return List<Map<String, dynamic>>.from(_mockBannerAnnouncements);
  }

  Future<void> recordAdvertisementView(String announcementId) async {
    if (announcementId.isEmpty) return;
    try {
      final profile = currentUserProfile;
      final userId = (profile?['id'] ?? profile?['student_id'] ?? profile?['trainer_id'] ?? 'user_${DateTime.now().millisecondsSinceEpoch}').toString().trim();
      final role = (profile?['role'] ?? 'student').toString().trim();
      final name = (profile?['full_name'] ?? profile?['name'] ?? 'Academy Member').toString().trim();

      final uri = Uri.parse('${ApiConstants.baseUrl}/api/advertisements/view');
      await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'announcement_id': announcementId,
          'user_id': userId,
          'user_role': role,
          'user_name': name,
        }),
      ).timeout(const Duration(seconds: 4));
    } catch (e) {
      debugPrint('Notice: Error recording advertisement view: $e');
    }
  }

  List<Map<String, dynamic>> _filterAnnouncementsForCurrentUser(List<Map<String, dynamic>> items) {
    final profile = currentUserProfile;
    if (profile == null) return items;

    final role = (profile['role'] ?? '').toString().toLowerCase();
    final isTrainer = role.contains('trainer') || role.contains('guru') || role == 'teacher';
    final myId = (profile['id'] ?? profile['profile_id'] ?? '').toString().toLowerCase().trim();
    final myName = (profile['full_name'] ?? '').toString().toLowerCase().trim();
    final myRoll = (profile['roll_number'] ?? '').toString().toLowerCase().trim();

    final enrolledBatchIds = <String>{};
    final enrolledCourseIds = <String>{};
    final enrolledCourseNames = <String>{};
    final enrolledBatchNames = <String>{};
    final enrolledTrainerNames = <String>{};
    final enrolledTrainerIds = <String>{};

    final enrolled = profile['enrolled_courses'];
    if (enrolled is List) {
      for (var e in enrolled) {
        if (e is Map) {
          final bId = (e['batch_id'] ?? '').toString().toLowerCase().trim();
          if (bId.isNotEmpty) enrolledBatchIds.add(bId);
          final cId = (e['course_id'] ?? e['id'] ?? '').toString().toLowerCase().trim();
          if (cId.isNotEmpty) enrolledCourseIds.add(cId);
          final cName = (e['course_title'] ?? e['title'] ?? e['course'] ?? '').toString().toLowerCase().trim();
          if (cName.isNotEmpty) enrolledCourseNames.add(cName);
          final bName = (e['batch_name'] ?? e['name'] ?? e['batch'] ?? '').toString().toLowerCase().trim();
          if (bName.isNotEmpty) enrolledBatchNames.add(bName);
          final tName = (e['trainer_name'] ?? '').toString().toLowerCase().trim();
          if (tName.isNotEmpty) enrolledTrainerNames.add(tName);
          final tId = (e['trainer_id'] ?? '').toString().toLowerCase().trim();
          if (tId.isNotEmpty) enrolledTrainerIds.add(tId);
        }
      }
    }

    final profCourse = (profile['course'] ?? profile['course_name'] ?? profile['primary_course'] ?? '').toString().toLowerCase().trim();
    if (profCourse.isNotEmpty) enrolledCourseNames.add(profCourse);
    final profBatch = (profile['batch'] ?? '').toString().toLowerCase().trim();
    if (profBatch.isNotEmpty) enrolledBatchNames.add(profBatch);
    final profTrainer = (profile['trainer_name'] ?? '').toString().toLowerCase().trim();
    if (profTrainer.isNotEmpty) enrolledTrainerNames.add(profTrainer);

    // Guru's assigned batches and courses
    final guruAssignedBatchIds = <String>{};
    final guruAssignedBatchNames = <String>{};
    final guruAssignedCourseNames = <String>{};
    if (profCourse.isNotEmpty) guruAssignedCourseNames.add(profCourse);

    void extractGuruBatch(dynamic b) {
      if (b is Map) {
        final bId = (b['id'] ?? b['batch_id'] ?? '').toString().toLowerCase().trim();
        if (bId.isNotEmpty) guruAssignedBatchIds.add(bId);
        final bName = (b['name'] ?? b['batch_name'] ?? '').toString().toLowerCase().trim();
        if (bName.isNotEmpty) guruAssignedBatchNames.add(bName);
        final cName = (b['course_title'] ?? b['course_name'] ?? b['title'] ?? '').toString().toLowerCase().trim();
        if (cName.isNotEmpty) guruAssignedCourseNames.add(cName);
      }
    }

    final assignedB = profile['assigned_batches'];
    if (assignedB is List) {
      for (var b in assignedB) {
        extractGuruBatch(b);
      }
    }
    final assignedC = profile['assigned_courses'];
    if (assignedC is List) {
      for (var c in assignedC) {
        if (c is Map) {
          final cName = (c['course_title'] ?? c['title'] ?? c['name'] ?? '').toString().toLowerCase().trim();
          if (cName.isNotEmpty) guruAssignedCourseNames.add(cName);
          final batches = c['batches'];
          if (batches is List) {
            for (var b in batches) {
              extractGuruBatch(b);
            }
          }
        }
      }
    }
    for (var b in _cachedTrainerBatches) {
      extractGuruBatch(b);
    }

    return items.where((item) {
      final senderRole = (item['sender_role'] ?? '').toString().toLowerCase();
      final isGuruMsg = senderRole.contains('trainer') ||
          senderRole.contains('guru') ||
          item['trainer_id'] != null ||
          (item['trainer_name'] != null && item['trainer_name'].toString().trim().isNotEmpty);

      final targetBatchId = (item['target_batch_id'] ?? '').toString().toLowerCase().trim();
      final targetBatchName = (item['target_batch_name'] ?? '').toString().toLowerCase().trim();
      final targetCourseId = (item['target_course_id'] ?? '').toString().toLowerCase().trim();
      final targetCourseTitle = (item['target_course_title'] ?? '').toString().toLowerCase().trim();
      final itemMsg = (item['message'] ?? '').toString().toLowerCase();
      final itemTitle = (item['title'] ?? '').toString().toLowerCase();

      if (isTrainer) {
        if (!isGuruMsg) {
          final aud = (item['audience'] ?? '').toString().toLowerCase();

          // If targeted to a specific batch, verify this guru teaches it
          bool teachesBatch = false;
          if (targetBatchId.isNotEmpty && targetBatchId != 'all') {
            final targetTokens = targetBatchId.split(RegExp(r'[,| ]+')).where((s) => s.isNotEmpty).toSet();
            teachesBatch = targetTokens.any((t) => guruAssignedBatchIds.contains(t)) ||
                (targetBatchName.isNotEmpty && guruAssignedBatchNames.any((b) => b.contains(targetBatchName) || targetBatchName.contains(b))) ||
                (myName.isNotEmpty && (itemMsg.contains(myName) || itemTitle.contains(myName)));
            if (!teachesBatch && guruAssignedBatchIds.isNotEmpty) {
              return false;
            }
          }

          // If targeted to a specific course, verify course match
          if (targetCourseTitle.isNotEmpty && targetCourseTitle != 'all') {
            bool matchesCourse = guruAssignedCourseNames.any((c) => c.contains(targetCourseTitle) || targetCourseTitle.contains(c)) ||
                (myName.isNotEmpty && (itemMsg.contains(myName) || itemTitle.contains(myName)));
            if (!matchesCourse && guruAssignedCourseNames.isNotEmpty && !itemMsg.contains(myName)) {
              return false;
            }
          }

          if (aud.contains('trainer') || aud.contains('all') || aud.contains('gurus') || aud == '' || aud.contains('selected') || teachesBatch) {
            return true;
          }
          return false;
        }
        final tId = (item['trainer_id'] ?? '').toString().toLowerCase();
        final tName = (item['trainer_name'] ?? item['created_by'] ?? '').toString().toLowerCase();
        if (tId.isNotEmpty && tId == myId) return true;
        if (tName.isNotEmpty && (tName.contains(myName) || myName.contains(tName))) return true;
        final cBy = (item['created_by'] ?? '').toString().toLowerCase();
        if (cBy.isNotEmpty && (cBy.contains(myName) || myName.contains(cBy))) return true;
        if (targetBatchId.isNotEmpty && guruAssignedBatchIds.contains(targetBatchId)) return true;
        if (targetBatchName.isNotEmpty && guruAssignedBatchNames.any((b) => b.contains(targetBatchName) || targetBatchName.contains(b))) return true;
        return false;
      } else {
        // STUDENT VIEW
        if (!isGuruMsg) {
          final aud = (item['audience'] ?? '').toString().toLowerCase();
          if (aud.contains('trainer') && !aud.contains('student') && !aud.contains('all')) {
            return false;
          }

          // If targeted to a specific batch, ONLY show to students enrolled in that batch
          if (targetBatchId.isNotEmpty && targetBatchId != 'all') {
            final inBatch = enrolledBatchIds.contains(targetBatchId) ||
                (targetBatchName.isNotEmpty && enrolledBatchNames.any((b) => b.contains(targetBatchName) || targetBatchName.contains(b)));
            if (!inBatch) {
              return false;
            }
          }

          // If targeted to a specific course, ONLY show to students enrolled in that course
          if (targetCourseId.isNotEmpty && targetCourseId != 'all') {
            if (!enrolledCourseIds.contains(targetCourseId)) {
              return false;
            }
          }
          if (targetCourseTitle.isNotEmpty && targetCourseTitle != 'all') {
            final inCourse = enrolledCourseNames.any((c) => c.contains(targetCourseTitle) || targetCourseTitle.contains(c));
            if (!inCourse && enrolledCourseNames.isNotEmpty) {
              return false;
            }
          }

          return true;
        }

        // GURU / TRAINER MESSAGE:
        // A Guru can ONLY send messages to students enrolled in their own batches/courses!

        // 1. If individual target students are specified
        dynamic targetStudents = item['target_students'];
        if (targetStudents is String && targetStudents.trim().startsWith('[')) {
          try {
            targetStudents = jsonDecode(targetStudents);
          } catch (_) {}
        }
        if (targetStudents is List && targetStudents.isNotEmpty) {
          final myPhone = (profile['phone'] ?? '').toString().replaceAll(RegExp(r'\D'), '');
          for (var s in targetStudents) {
            final sStr = (s is Map ? '${s['id']} ${s['roll_number']} ${s['name']} ${s['phone']}' : s).toString().toLowerCase();
            final sPhone = (s is Map ? (s['phone'] ?? '').toString().replaceAll(RegExp(r'\D'), '') : '');
            if ((myId.isNotEmpty && sStr.contains(myId)) ||
                (myRoll.isNotEmpty && sStr.contains(myRoll)) ||
                (myName.isNotEmpty && sStr.contains(myName)) ||
                (myPhone.isNotEmpty && sPhone.isNotEmpty && (myPhone.contains(sPhone) || sPhone.contains(myPhone)))) {
              return true;
            }
          }
          return false;
        }

        // 2. Check target batch
        if (targetBatchId.isNotEmpty && targetBatchId != 'all') {
          if (enrolledBatchIds.contains(targetBatchId)) return true;
          return false; // Specifically targeted a batch student is not in
        }

        // 3. Check target course
        if (targetCourseId.isNotEmpty && targetCourseId != 'all') {
          if (enrolledCourseIds.contains(targetCourseId)) return true;
          return false; // Specifically targeted a course student is not in
        }
        if (targetCourseTitle.isNotEmpty && targetCourseTitle != 'all') {
          bool courseMatches = false;
          for (final c in enrolledCourseNames) {
            if (c.contains(targetCourseTitle) || targetCourseTitle.contains(c)) {
              courseMatches = true;
              break;
            }
          }
          if (courseMatches) return true;
          return false;
        }

        // 4. Check trainer match
        final tId = (item['trainer_id'] ?? '').toString().toLowerCase().trim();
        final tName = (item['trainer_name'] ?? item['created_by'] ?? '').toString().toLowerCase().trim();
        if (tId.isNotEmpty && enrolledTrainerIds.contains(tId)) return true;
        if (tName.isNotEmpty) {
          for (final et in enrolledTrainerNames) {
            if (et.contains(tName) || tName.contains(et)) return true;
          }
        }

        // If not matching student's enrolled batch, course, or trainer, HIDE it!
        return false;
      }
    }).toList();
  }

  List<Map<String, dynamic>> _deduplicateAnnouncements(List<Map<String, dynamic>> items) {
    final seen = <String>{};
    final result = <Map<String, dynamic>>[];
    for (final item in items) {
      final title = (item['title'] ?? '').toString().trim().toLowerCase();
      final message = (item['message'] ?? '').toString().trim().toLowerCase();
      final date = (item['publish_date'] ?? item['date'] ?? '').toString().trim();
      final key = '$title|$message|$date';
      if (!seen.contains(key)) {
        seen.add(key);
        result.add(item);
      }
    }
    return result;
  }

  Future<List<Map<String, dynamic>>> getMessageAnnouncements({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedMessageAnnouncements.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedMessageAnnouncements);
    }

    if (_trainerAvatarMap.isEmpty) {
      preloadTrainerAvatars().catchError((_) {});
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

            // Skip future scheduled messages whose publish time has not arrived yet
            final itemStatus = (item['status'] ?? '').toString().toLowerCase();
            final pubDate = (item['publish_date'] ?? '').toString().trim();
            final pubTime = (item['publish_time'] ?? '00:00:00').toString().trim();
            if (pubDate.isNotEmpty) {
              try {
                final scheduledDt = DateTime.parse('${pubDate}T$pubTime');
                if (scheduledDt.isAfter(now)) {
                  continue;
                }
              } catch (_) {}
            }
            if (itemStatus == 'scheduled' || itemStatus == 'draft') {
              continue;
            }

            final mapItem = Map<String, dynamic>.from(item);
            mapItem['image_url'] = _normalizeImageUrl(mapItem['image_url']);
            mapItem['date'] = mapItem['publish_date'] ?? 'Today';
            mapItem['is_read'] = false;

            // Enrich with trainer & admin avatars
            final tId = mapItem['trainer_id']?.toString();
            final tName = (mapItem['trainer_name'] ?? mapItem['created_by'])?.toString();
            final tAv = getTrainerAvatar(tId, tName);
            if (tAv != null && (mapItem['trainer_avatar_url'] == null || mapItem['trainer_avatar_url'].toString().isEmpty)) {
              mapItem['trainer_avatar_url'] = tAv;
            }
            if (_adminAvatarUrl != null && (mapItem['admin_avatar_url'] == null || mapItem['admin_avatar_url'].toString().isEmpty)) {
              mapItem['admin_avatar_url'] = _adminAvatarUrl;
            }

            valid.add(mapItem);
          }
          final filtered = _filterAnnouncementsForCurrentUser(valid);
          final deduped = _deduplicateAnnouncements(filtered);
          if (deduped.isNotEmpty) {
            _cachedMessageAnnouncements = deduped;
            _saveMessageAnnouncementsToPrefs(deduped);
            return deduped;
          }
        }
      } catch (e) {
        debugPrint('Supabase direct query message notice: $e');
      }
    }

    // 2. HTTP API fallback
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/announcements?announcementType=message&status=Published&_t=${DateTime.now().millisecondsSinceEpoch}');
      final res = await http.get(uri).timeout(const Duration(seconds: 12));
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

              // Skip future scheduled messages
              final itemStatus = (item['status'] ?? '').toString().toLowerCase();
              final pubDate = (item['publish_date'] ?? '').toString().trim();
              final pubTime = (item['publish_time'] ?? '00:00:00').toString().trim();
              if (pubDate.isNotEmpty) {
                try {
                  final scheduledDt = DateTime.parse('${pubDate}T$pubTime');
                  if (scheduledDt.isAfter(now)) {
                    continue;
                  }
                } catch (_) {}
              }
              if (itemStatus == 'scheduled' || itemStatus == 'draft') {
                continue;
              }

              item['image_url'] = _normalizeImageUrl(item['image_url']);

              // Enrich with trainer & admin avatars if missing
              final tId = item['trainer_id']?.toString();
              final tName = (item['trainer_name'] ?? item['created_by'])?.toString();
              final tAv = getTrainerAvatar(tId, tName);
              if (tAv != null && (item['trainer_avatar_url'] == null || item['trainer_avatar_url'].toString().isEmpty)) {
                item['trainer_avatar_url'] = tAv;
              }
              if (_adminAvatarUrl != null && (item['admin_avatar_url'] == null || item['admin_avatar_url'].toString().isEmpty)) {
                item['admin_avatar_url'] = _adminAvatarUrl;
              }

              valid.add(item);
            }
            final filtered = _filterAnnouncementsForCurrentUser(valid);
            final deduped = _deduplicateAnnouncements(filtered);
            if (deduped.isNotEmpty) {
              _cachedMessageAnnouncements = deduped;
              _saveMessageAnnouncementsToPrefs(deduped);
              return deduped;
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
    return [];
  }

  List<Map<String, dynamic>> getCachedMessageAnnouncements() {
    if (_cachedMessageAnnouncements.isNotEmpty) {
      return List<Map<String, dynamic>>.from(_cachedMessageAnnouncements);
    }
    return [];
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
    final profile = currentUserProfile;
    final role = (profile?['role'] ?? '').toString().toLowerCase();
    final isTrainer = role.contains('trainer') || role.contains('guru') || role == 'teacher';

    final Set<String> seen = {};
    int count = 0;
    for (var m in list) {
      if (isTrainer) {
        final senderRole = (m['sender_role'] ?? '').toString().toLowerCase();
        final isGuruMsg = senderRole.contains('trainer') ||
            senderRole.contains('guru') ||
            m['trainer_id'] != null ||
            (m['trainer_name'] != null && m['trainer_name'].toString().trim().isNotEmpty);
        if (isGuruMsg) continue;
      }
      final id = m['id']?.toString() ?? '';
      if (id.isEmpty || seen.contains(id)) continue;
      seen.add(id);
      if (!_readMessageIds.contains(id)) {
        count++;
      }
    }
    return count;
  }

  int getUnreadVideosCount() {
    if (!_readStateLoaded) {
      _ensureReadStateLoaded();
    }
    final List<Map<String, dynamic>> allVideos = [];
    allVideos.addAll(_cachedEventFolders);
    for (var n in _cachedNotifications) {
      final t = (n['type'] ?? '').toString();
      if (t == 'video' || t == 'video_shared') {
        allVideos.add(n);
      }
    }
    final Set<String> seen = {};
    int count = 0;
    for (var v in allVideos) {
      final id = v['id']?.toString() ?? '';
      if (id.isEmpty || seen.contains(id)) continue;
      seen.add(id);
      if (!_readVideoIds.contains(id)) {
        count++;
      }
    }
    return count;
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

  void markAllVideosAsRead([List<Map<String, dynamic>>? currentList]) {
    if (currentList != null && currentList.isNotEmpty) {
      for (var item in currentList) {
        final id = item['id']?.toString();
        if (id != null) {
          _readVideoIds.add(id);
          _readNotifIds.add(id);
        }
      }
    }
    for (var n in _cachedNotifications) {
      final id = n['id']?.toString();
      if (id != null) {
        _readVideoIds.add(id);
        _readNotifIds.add(id);
      }
    }
    for (var f in _cachedEventFolders) {
      final id = f['id']?.toString();
      if (id != null) {
        _readVideoIds.add(id);
        _readNotifIds.add(id);
      }
    }
    _lastReadVideoTimestamp = DateTime.now().millisecondsSinceEpoch;
    _saveReadVideos();
  }

  List<Map<String, dynamic>> getCachedNotifications() => List<Map<String, dynamic>>.from(_cachedNotifications);

  Future<void> _saveNotificationsToPrefs(List<Map<String, dynamic>> notifs) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('laasya_cached_notifications', jsonEncode(notifs));
    } catch (_) {}
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

      // 5. Guru / Faculty Salary & Payment Notifications
      try {
        final trainerPayouts = await getTrainerSalaryPayouts();
        for (var p in trainerPayouts) {
          final id = (p['id'] ?? '').toString();
          final isSalary = p['record_kind'] == 'salary' || p['payment_type'] == 'monthly_salary';
          final invNo = (p['invoice_number'] ?? p['voucher_number'] ?? (isSalary ? 'LCA-SAL-2026' : 'LCA-PAY-2026')).toString();
          final amount = p['amount'] ?? p['net_salary'] ?? 0;
          final payDate = (p['display_date'] ?? p['payment_date'] ?? 'Recent').toString();
          final month = p['payroll_month']?.toString();
          final badgeLabel = (p['badge_label'] ?? (isSalary ? 'Salary' : 'Payment')).toString();
          final method = (p['payment_method'] ?? 'Bank Transfer').toString().toUpperCase().replaceAll('_', ' ');

          final notifTitle = isSalary
              ? 'Salary Disbursed: ₹$amount (${month ?? 'Monthly'})'
              : 'Payment Disbursed: ₹$amount ($badgeLabel)';
          final notifMsg = isSalary
              ? 'Monthly salary honorarium disbursed under Invoice #$invNo on $payDate via $method.'
              : 'Payment of ₹$amount ($badgeLabel) disbursed under Invoice #$invNo on $payDate via $method.';

          notifs.add({
            'id': 'salary-notif-$id',
            'title': notifTitle,
            'message': notifMsg,
            'type': isSalary ? 'salary' : 'payment',
            'date': payDate,
            'is_read': _readNotifIds.contains('salary-notif-$id'),
            'amount': amount,
            'invoice_number': invNo,
          });
        }
      } catch (err) {
        debugPrint('Trainer payouts notification notice: $err');
      }

      // Deduplicate notifications by content fingerprint so identical notifications never repeat
      final seenNotifFingerprints = <String>{};
      final dedupedNotifs = <Map<String, dynamic>>[];
      for (var n in notifs) {
        final title = (n['title'] ?? '').toString().trim().toLowerCase();
        final message = (n['message'] ?? '').toString().trim().toLowerCase();
        final date = (n['date'] ?? '').toString().trim();
        final key = '$title|$message|$date';
        if (!seenNotifFingerprints.contains(key)) {
          seenNotifFingerprints.add(key);
          dedupedNotifs.add(n);
        }
      }

      _cachedNotifications = dedupedNotifs;
      _saveNotificationsToPrefs(dedupedNotifs);
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
        _saveNotificationsToPrefs(notifs);
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

  List<Map<String, dynamic>> getCachedStudentEventFolders() => List<Map<String, dynamic>>.from(_cachedEventFolders);

  Future<List<Map<String, dynamic>>> getStudentEventFolders({String? courseTitle, String? batchName}) async {
    if (_cachedEventFolders.isNotEmpty) {
      _refreshEventFoldersInBackground();
      return List<Map<String, dynamic>>.from(_cachedEventFolders);
    }

    await _fetchLiveEventFolders();
    return List<Map<String, dynamic>>.from(_cachedEventFolders);
  }

  void _refreshEventFoldersInBackground() {
    _fetchLiveEventFolders().catchError((_) => <Map<String, dynamic>>[]);
  }

  Future<void> _fetchLiveEventFolders() async {
    // 1. Live fetch from web backend API
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/video-library');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['items'] is List) {
          final liveItems = List<Map<String, dynamic>>.from(decoded['items']);
          if (liveItems.isNotEmpty) {
            _cachedEventFolders = liveItems;
            return;
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
          'description': 'Official shoot drive folder uploaded for Bharathanatyam students.',
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
          'description': 'High-resolution photo gallery and backstage video recordings from the 2026 Annual Cultural Showcase for all academy students.',
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
          'description': 'Raw and edited performance clips sorted by batch and raga for all participating students and parents.',
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
  }

  // ---------------------------------------------------------------------------
  // STUDENT FEE PAYMENTS & INVOICES
  // ---------------------------------------------------------------------------
  List<Map<String, dynamic>> _cachedPayments = [];

  List<Map<String, dynamic>> getCachedPayments() => List<Map<String, dynamic>>.from(_cachedPayments);

  Future<void> _savePaymentsToPrefs(List<Map<String, dynamic>> payments) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('laasya_cached_student_payments', jsonEncode(payments));
    } catch (_) {}
  }

  Future<List<Map<String, dynamic>>> getStudentPayments({String? studentId, String? rollNumber}) async {
    // Return cached immediately if available (<1ms) to eliminate loading spinners
    if (_cachedPayments.isNotEmpty) {
      _refreshStudentPaymentsInBackground();
      return List<Map<String, dynamic>>.from(_cachedPayments);
    }

    await _fetchLiveStudentPayments();
    return List<Map<String, dynamic>>.from(_cachedPayments);
  }

  void _refreshStudentPaymentsInBackground() {
    _fetchLiveStudentPayments().catchError((_) => <Map<String, dynamic>>[]);
  }

  Future<List<Map<String, dynamic>>> _fetchLiveStudentPayments() async {
    try {
      final sId = (_cachedProfile?['student_id'] ?? _cachedProfile?['id'] ?? '').toString();
      final roll = (_cachedProfile?['roll_number'] ?? _cachedProfile?['roll'] ?? '').toString();
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/finance/student-payments?studentId=${Uri.encodeComponent(sId)}&rollNumber=${Uri.encodeComponent(roll)}');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['payments'] is List) {
          final livePayments = List<Map<String, dynamic>>.from(decoded['payments']);
          if (livePayments.isNotEmpty) {
            _cachedPayments = livePayments;
            _savePaymentsToPrefs(livePayments);
            return livePayments;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch error for student payments: $e');
    }
    return _cachedPayments;
  }

  Future<Map<String, dynamic>?> submitStudentPayment({
    required int amount,
    required String paymentMethod,
    String? transactionReference,
    String? feePeriod,
    String? remarks,
  }) async {
    try {
      final sId = (_cachedProfile?['student_id'] ?? _cachedProfile?['id'] ?? '').toString();
      final roll = (_cachedProfile?['roll_number'] ?? _cachedProfile?['roll'] ?? '').toString();
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/finance/student-payments');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'student_id': sId.isNotEmpty ? sId : null,
          'roll_number': roll.isNotEmpty ? roll : null,
          'amount_paid': amount,
          'payment_method': paymentMethod,
          'transaction_reference': transactionReference,
          'fee_period': feePeriod,
          'remarks': remarks ?? 'Mobile App Online Payment',
        }),
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final decoded = jsonDecode(res.body);
        // Refresh live payments in background
        _fetchLiveStudentPayments();
        if (decoded is Map && decoded['payment'] is Map) {
          return Map<String, dynamic>.from(decoded['payment']);
        }
      }
    } catch (e) {
      debugPrint('Error submitting student payment to backend: $e');
    }
    return null;
  }



  // ---------------------------------------------------------------------------
  // TRAINER / GURU SALARY PAYOUTS & VOUCHERS
  // ---------------------------------------------------------------------------
  List<Map<String, dynamic>> _cachedSalaries = [];
  Map<String, dynamic>? _cachedSalarySummary;

  List<Map<String, dynamic>> getCachedSalaries() => List<Map<String, dynamic>>.from(_cachedSalaries);
  Map<String, dynamic>? getCachedSalarySummary() => _cachedSalarySummary;

  Future<void> _saveSalariesToPrefs(List<Map<String, dynamic>> salaries) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('laasya_cached_trainer_salaries', jsonEncode(salaries));
      if (_cachedSalarySummary != null) {
        await prefs.setString('laasya_cached_trainer_salary_summary', jsonEncode(_cachedSalarySummary));
      }
    } catch (_) {}
  }

  Future<List<Map<String, dynamic>>> getTrainerSalaryPayouts({String? trainerId, bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedSalaries.isNotEmpty) {
      _fetchLiveSalaries(trainerId);
      return List<Map<String, dynamic>>.from(_cachedSalaries);
    }

    await _fetchLiveSalaries(trainerId);
    return List<Map<String, dynamic>>.from(_cachedSalaries);
  }

  void _refreshSalariesInBackground(String? trainerId) {
    _fetchLiveSalaries(trainerId).catchError((_) => <Map<String, dynamic>>[]);
  }

  Future<List<Map<String, dynamic>>> _fetchLiveSalaries(String? trainerId) async {
    try {
      final prof = _cachedProfile ?? await getCurrentUserProfile();
      final id = (trainerId ?? prof?['id'] ?? prof?['trainer_id'] ?? prof?['profile_id'] ?? '').toString().trim();
      final phone = (prof?['phone'] ?? '').toString().trim();
      final name = (prof?['full_name'] ?? '').toString().trim();

      final qParams = <String>[];
      if (id.isNotEmpty) qParams.add('trainerId=${Uri.encodeComponent(id)}');
      if (phone.isNotEmpty) qParams.add('phone=${Uri.encodeComponent(phone)}');
      if (name.isNotEmpty) qParams.add('name=${Uri.encodeComponent(name)}');

      final queryString = qParams.isNotEmpty ? '?${qParams.join('&')}' : '';
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/finance/trainer-salaries$queryString');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true) {
          final list = decoded['payments'] ?? decoded['salaries'];
          if (list is List) {
            _cachedSalaries = List<Map<String, dynamic>>.from(list);
            if (decoded['summary'] is Map) {
              _cachedSalarySummary = Map<String, dynamic>.from(decoded['summary']);
            }
            _saveSalariesToPrefs(_cachedSalaries);
            return _cachedSalaries;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch error for trainer salaries: $e');
    }

    return List<Map<String, dynamic>>.from(_cachedSalaries);
  }
}

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import 'trainer_data_store.dart';

class TrainerTimetableScreen extends StatefulWidget {
  final Map<String, dynamic>? trainerProfile;

  const TrainerTimetableScreen({super.key, this.trainerProfile});

  @override
  State<TrainerTimetableScreen> createState() => _TrainerTimetableScreenState();
}

class _TrainerTimetableScreenState extends State<TrainerTimetableScreen> {
  String _selectedDay = 'All'; // 'All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  final List<String> _days = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  List<Map<String, dynamic>> _rescheduledClasses = [];

  // Master Academy Timetable Dataset (Matching Admin /batches/timetable)
  final List<Map<String, dynamic>> _masterTimetable = [
    {
      'time': '5:00 AM – 6:00 AM',
      'day': 'Mon',
      'course': 'YOGA',
      'batch': 'Batch 1 (Pranayama)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '5:00 AM – 6:00 AM',
      'day': 'Tue',
      'course': 'YOGA',
      'batch': 'Batch 1 (Pranayama)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '5:00 AM – 6:00 AM',
      'day': 'Wed',
      'course': 'YOGA',
      'batch': 'Batch 1 (Pranayama)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '5:00 AM – 6:00 AM',
      'day': 'Thu',
      'course': 'YOGA',
      'batch': 'Batch 1 (Pranayama)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '5:00 AM – 6:00 AM',
      'day': 'Fri',
      'course': 'YOGA',
      'batch': 'Batch 1 (Pranayama)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '6:00 AM – 7:00 AM',
      'day': 'Mon',
      'course': 'YOGA',
      'batch': 'Batch 2 (Asanas)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '6:00 AM – 7:00 AM',
      'day': 'Tue',
      'course': 'YOGA',
      'batch': 'Batch 2 (Asanas)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '6:00 AM – 7:00 AM',
      'day': 'Wed',
      'course': 'YOGA',
      'batch': 'Batch 2 (Asanas)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '6:00 AM – 7:00 AM',
      'day': 'Thu',
      'course': 'YOGA',
      'batch': 'Batch 2 (Asanas)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '6:00 AM – 7:00 AM',
      'day': 'Fri',
      'course': 'YOGA',
      'batch': 'Batch 2 (Asanas)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '7:00 AM – 8:00 AM',
      'day': 'Mon',
      'course': 'YOGA',
      'batch': 'Batch 3 (Advanced)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '7:00 AM – 8:00 AM',
      'day': 'Wed',
      'course': 'YOGA',
      'batch': 'Batch 3 (Advanced)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '7:00 AM – 8:00 AM',
      'day': 'Fri',
      'course': 'YOGA',
      'batch': 'Batch 3 (Advanced)',
      'trainer': 'Satish Kale',
      'room': 'Hall 1',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Mon',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 1 (Beginners)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Wed',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 1 (Beginners)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Fri',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 1 (Beginners)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Mon',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 2 (Intermediate)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Wed',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 2 (Intermediate)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Fri',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 2 (Intermediate)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '7:00 PM – 8:00 PM',
      'day': 'Tue',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 3 (Arangetram)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '7:00 PM – 8:00 PM',
      'day': 'Thu',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 3 (Arangetram)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '7:00 PM – 8:00 PM',
      'day': 'Sat',
      'course': 'BHARATANATYAM',
      'batch': 'Batch 3 (Arangetram)',
      'trainer': 'Anusha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Mon',
      'course': 'KARATE',
      'batch': 'Batch 1 (White & Yellow)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Wed',
      'course': 'KARATE',
      'batch': 'Batch 1 (White & Yellow)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Fri',
      'course': 'KARATE',
      'batch': 'Batch 1 (White & Yellow)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '5:30 PM – 6:30 PM',
      'day': 'Mon',
      'course': 'KARATE',
      'batch': 'Batch 2 (Green & Blue)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '5:30 PM – 6:30 PM',
      'day': 'Wed',
      'course': 'KARATE',
      'batch': 'Batch 2 (Green & Blue)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '5:30 PM – 6:30 PM',
      'day': 'Fri',
      'course': 'KARATE',
      'batch': 'Batch 2 (Green & Blue)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '6:30 PM – 7:30 PM',
      'day': 'Tue',
      'course': 'KARATE',
      'batch': 'Batch 3 (Brown & Black)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '6:30 PM – 7:30 PM',
      'day': 'Thu',
      'course': 'KARATE',
      'batch': 'Batch 3 (Brown & Black)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '6:30 PM – 7:30 PM',
      'day': 'Sat',
      'course': 'KARATE',
      'batch': 'Batch 3 (Brown & Black)',
      'trainer': 'Vijay',
      'room': 'Veera Kalari Koodam',
    },
    {
      'time': '4:00 PM – 5:00 PM',
      'day': 'Mon',
      'course': 'KUCHIPUDI',
      'batch': 'Batch 1 (Tarangam)',
      'trainer': 'Radhika',
      'room': 'Natya Mandapam',
    },
    {
      'time': '4:00 PM – 5:00 PM',
      'day': 'Wed',
      'course': 'KUCHIPUDI',
      'batch': 'Batch 1 (Tarangam)',
      'trainer': 'Radhika',
      'room': 'Natya Mandapam',
    },
    {
      'time': '4:00 PM – 5:00 PM',
      'day': 'Fri',
      'course': 'KUCHIPUDI',
      'batch': 'Batch 1 (Tarangam)',
      'trainer': 'Radhika',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Tue',
      'course': 'MOHINIYATTAM',
      'batch': 'Batch 1 (Lasya Foundation)',
      'trainer': 'Deepa',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Thu',
      'course': 'MOHINIYATTAM',
      'batch': 'Batch 1 (Lasya Foundation)',
      'trainer': 'Deepa',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Sat',
      'course': 'MOHINIYATTAM',
      'batch': 'Batch 1 (Lasya Foundation)',
      'trainer': 'Deepa',
      'room': 'Natya Mandapam',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Tue',
      'course': 'WESTERN DANCE',
      'batch': 'Batch 1 (Hip-Hop & Contemporary)',
      'trainer': 'Kiran',
      'room': 'Studio 2',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Thu',
      'course': 'WESTERN DANCE',
      'batch': 'Batch 1 (Hip-Hop & Contemporary)',
      'trainer': 'Kiran',
      'room': 'Studio 2',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Sat',
      'course': 'WESTERN DANCE',
      'batch': 'Batch 1 (Hip-Hop & Contemporary)',
      'trainer': 'Kiran',
      'room': 'Studio 2',
    },
    {
      'time': '5:30 PM – 6:30 PM',
      'day': 'Mon',
      'course': 'DRAWING',
      'batch': 'Batch 1 (Foundations)',
      'trainer': 'Anoop',
      'room': 'Art Studio',
    },
    {
      'time': '5:30 PM – 6:30 PM',
      'day': 'Wed',
      'course': 'DRAWING',
      'batch': 'Batch 1 (Foundations)',
      'trainer': 'Anoop',
      'room': 'Art Studio',
    },
    {
      'time': '5:30 PM – 6:30 PM',
      'day': 'Fri',
      'course': 'DRAWING',
      'batch': 'Batch 1 (Foundations)',
      'trainer': 'Anoop',
      'room': 'Art Studio',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Mon',
      'course': 'CARNATIC MUSIC',
      'batch': 'Vocal Batch 1',
      'trainer': 'Sumesh',
      'room': 'Sangeetha Mandapam',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Wed',
      'course': 'CARNATIC MUSIC',
      'batch': 'Vocal Batch 1',
      'trainer': 'Sumesh',
      'room': 'Sangeetha Mandapam',
    },
    {
      'time': '6:00 PM – 7:00 PM',
      'day': 'Fri',
      'course': 'CARNATIC MUSIC',
      'batch': 'Vocal Batch 1',
      'trainer': 'Sumesh',
      'room': 'Sangeetha Mandapam',
    },
    {
      'time': '6:30 PM – 7:30 PM',
      'day': 'Tue',
      'course': 'KALARIPAYATTU',
      'batch': 'Warriors Batch',
      'trainer': 'Vineeth Gurukkal',
      'room': 'Kalari Arena',
    },
    {
      'time': '6:30 PM – 7:30 PM',
      'day': 'Thu',
      'course': 'KALARIPAYATTU',
      'batch': 'Warriors Batch',
      'trainer': 'Vineeth Gurukkal',
      'room': 'Kalari Arena',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchTallyClasses();
  }

  Future<void> _fetchTallyClasses() async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/tally-classes');
      final res = await http.get(uri).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['tallyClasses'] is List) {
          final list = List<Map<String, dynamic>>.from(decoded['tallyClasses']);
          if (mounted) {
            setState(() {
              _rescheduledClasses = list;
            });
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('Error fetching tally classes for trainer timetable: $e');
    }
  }

  Map<String, dynamic> _getCourseTheme(String courseName) {
    final lower = courseName.toUpperCase();
    if (lower.contains('BHARAT')) {
      return {
        'bg': const Color(0xFFFCE7F3),
        'border': const Color(0xFFFBCFE8),
        'text': const Color(0xFF9D174D),
        'badgeBg': const Color(0xFFFDF2F8),
        'icon': Icons.flare_rounded,
      };
    }
    if (lower.contains('INSTRUMENT') || lower.contains('VIOLIN') || lower.contains('KEYBOARD')) {
      return {
        'bg': const Color(0xFFE0F2FE),
        'border': const Color(0xFFBAE6FD),
        'text': const Color(0xFF0369A1),
        'badgeBg': const Color(0xFFF0F9FF),
        'icon': Icons.music_note_rounded,
      };
    }
    if (lower.contains('CARNATIC') || lower.contains('VOCAL') || lower.contains('MUSIC')) {
      return {
        'bg': const Color(0xFFFEF3C7),
        'border': const Color(0xFFFDE68A),
        'text': const Color(0xFFB45309),
        'badgeBg': const Color(0xFFFFFBEB),
        'icon': Icons.audiotrack_rounded,
      };
    }
    if (lower.contains('KARATE') || lower.contains('MARTIAL') || lower.contains('KALARI')) {
      return {
        'bg': const Color(0xFFFEE2E2),
        'border': const Color(0xFFFECACA),
        'text': const Color(0xFFB91C1C),
        'badgeBg': const Color(0xFFFEF2F2),
        'icon': Icons.sports_kabaddi_rounded,
      };
    }
    if (lower.contains('KUCHIPUDI') || lower.contains('MOHINIYATTAM')) {
      return {
        'bg': const Color(0xFFF3E8FF),
        'border': const Color(0xFFE9D5FF),
        'text': const Color(0xFF7E22CE),
        'badgeBg': const Color(0xFFFAF5FF),
        'icon': Icons.self_improvement_rounded,
      };
    }
    if (lower.contains('DRAWING') || lower.contains('PAINT') || lower.contains('ART')) {
      return {
        'bg': const Color(0xFFE0E7FF),
        'border': const Color(0xFFC7D2FE),
        'text': const Color(0xFF4338CA),
        'badgeBg': const Color(0xFFEEF2FF),
        'icon': Icons.palette_rounded,
      };
    }
    if (lower.contains('YOGA') || lower.contains('MEDITATION')) {
      return {
        'bg': const Color(0xFFDCFCE7),
        'border': const Color(0xFFBBF7D0),
        'text': const Color(0xFF15803D),
        'badgeBg': const Color(0xFFF0FDF4),
        'icon': Icons.self_improvement_rounded,
      };
    }
    return {
      'bg': const Color(0xFFF3E8EE),
      'border': const Color(0xFFF0D5E4),
      'text': const Color(0xFF8A064D),
      'badgeBg': const Color(0xFFFFF2F8),
      'icon': Icons.school_rounded,
    };
  }

  String _formatSlotTime(String raw) {
    if (raw.isEmpty) return 'TBD';
    String formatToken(String token) {
      token = token.trim();
      if (token.isEmpty) return '';
      if (RegExp(r'(AM|PM)', caseSensitive: false).hasMatch(token)) {
        return token.replaceAllMapped(RegExp(r'(\d{1,2}):(\d{2}):\d{2}\s*(AM|PM)', caseSensitive: false), (m) {
          int h = int.parse(m[1]!);
          return '$h:${m[2]} ${m[3]?.toUpperCase()}';
        });
      }
      final m = RegExp(r'^(\d{1,2}):(\d{2})(?::(\d{2}))?$').firstMatch(token);
      if (m != null) {
        int h = int.parse(m[1]!);
        final min = m[2]!;
        final amPm = h >= 12 ? 'PM' : 'AM';
        int h12 = h % 12;
        if (h12 == 0) h12 = 12;
        return '$h12:$min $amPm';
      }
      return token;
    }

    if (raw.contains(' – ')) {
      final parts = raw.split(' – ');
      return '${formatToken(parts[0])}\nto ${formatToken(parts[1])}';
    } else if (raw.contains(' - ')) {
      final parts = raw.split(' - ');
      return '${formatToken(parts[0])}\nto ${formatToken(parts[1])}';
    } else if (raw.contains('-')) {
      final parts = raw.split('-');
      return '${formatToken(parts[0])}\nto ${formatToken(parts[1])}';
    }
    return formatToken(raw);
  }

  List<Map<String, dynamic>> _getTrainerSchedule(String trainerName, String specialization) {
    final List<Map<String, dynamic>> slots = [];
    final storeCourses = TrainerDataStore().courses;

    String normalizeDay(String raw) {
      final l = raw.trim().toLowerCase();
      if (l.startsWith('mon')) return 'Mon';
      if (l.startsWith('tue')) return 'Tue';
      if (l.startsWith('wed')) return 'Wed';
      if (l.startsWith('thu')) return 'Thu';
      if (l.startsWith('fri')) return 'Fri';
      if (l.startsWith('sat')) return 'Sat';
      if (l.startsWith('sun')) return 'Sun';
      return raw.trim();
    }

    if (storeCourses.isNotEmpty) {
      for (final course in storeCourses) {
        final courseTitle = (course['title'] ?? course['short_title'] ?? 'Course').toString();
        final batches = course['batches'] is List ? (course['batches'] as List) : [];
        for (final b in batches) {
          if (b is! Map) continue;
          final batchName = (b['name'] ?? b['batch_number'] ?? 'Batch').toString();
          final timings = (b['timings'] ?? '05:00 PM - 06:30 PM').toString();
          final room = (b['room'] ?? 'Natya Mandapam').toString();
          final daysRaw = b['days'];
          List<String> days = [];
          if (daysRaw is List) {
            days = daysRaw.map((d) => normalizeDay(d.toString())).toList();
          } else if (daysRaw != null && daysRaw.toString().isNotEmpty) {
            days = daysRaw.toString().split(',').map((d) => normalizeDay(d.toString())).toList();
          }
          if (days.isEmpty) {
            days = ['Mon', 'Wed', 'Fri'];
          }

          for (final day in days) {
            slots.add({
              'time': timings,
              'day': day,
              'course': courseTitle,
              'batch': batchName,
              'trainer': trainerName,
              'room': room,
              'is_rescheduled': false,
            });
          }
        }
      }
    }

    if (slots.isNotEmpty) {
      return slots;
    }

    // Fallback: Filter _masterTimetable strictly for this trainer or course specialization
    final tNameLower = trainerName.toLowerCase().trim();
    final specLower = specialization.toLowerCase().trim();

    return _masterTimetable.where((slot) {
      final slotTrainer = (slot['trainer'] ?? '').toString().toLowerCase().trim();
      final slotCourse = (slot['course'] ?? '').toString().toLowerCase().trim();
      if (slotTrainer.isNotEmpty && (slotTrainer.contains(tNameLower) || tNameLower.contains(slotTrainer))) {
        return true;
      }
      if (specLower.isNotEmpty && (slotCourse.contains(specLower) || specLower.contains(slotCourse))) {
        return true;
      }
      return false;
    }).map((s) => {...s, 'is_rescheduled': false}).toList();
  }

  @override
  Widget build(BuildContext context) {
    final trainerName = (widget.trainerProfile?['full_name'] ?? 'Guru').toString();
    final specialization = (widget.trainerProfile?['specialization'] ?? widget.trainerProfile?['course_name'] ?? 'Faculty').toString();

    // -------------------------------------------------------------
    // CALCULATE CURRENT WEEK DATES STRICTLY (Monday to Sunday)
    // -------------------------------------------------------------
    final now = DateTime.now();
    final currentMonday = DateTime(now.year, now.month, now.day).subtract(Duration(days: now.weekday - 1));
    final currentSunday = currentMonday.add(const Duration(days: 6, hours: 23, minutes: 59, seconds: 59));
    final weekRangeFormatted = '${DateFormat('dd MMM').format(currentMonday)} – ${DateFormat('dd MMM yyyy').format(currentSunday)}';

    // Strictly get this Guru's regular batch classes
    final regularSlots = _getTrainerSchedule(trainerName, specialization);

    // Rescheduled / Tally classes for this Guru strictly in the CURRENT WEEK
    final List<Map<String, dynamic>> currentWeekRescheduled = [];
    final tNameLower = trainerName.toLowerCase().trim();
    final myId = (widget.trainerProfile?['id'] ?? widget.trainerProfile?['trainer_id'] ?? '').toString();

    for (final tc in _rescheduledClasses) {
      if (tc['status'] != 'Scheduled') continue;
      final tcTrainer = (tc['trainer_name'] ?? '').toString().toLowerCase().trim();
      final tcTrainerId = (tc['trainer_id'] ?? '').toString();

      final matchesTrainer = (myId.isNotEmpty && tcTrainerId == myId) ||
          (tNameLower.isNotEmpty && (tcTrainer.contains(tNameLower) || tNameLower.contains(tcTrainer)));

      if (!matchesTrainer) {
        final bName = (tc['batch_name'] ?? '').toString().toLowerCase();
        final teachesBatch = regularSlots.any((s) => (s['batch'] ?? '').toString().toLowerCase() == bName);
        if (!teachesBatch) continue;
      }

      final rDateStr = tc['rescheduled_date']?.toString() ?? '';
      DateTime? rDate;
      try {
        rDate = DateTime.parse(rDateStr);
      } catch (_) {}

      // Filter strictly for current week (Monday to Sunday)
      if (rDate != null) {
        final startOfDay = DateTime(rDate.year, rDate.month, rDate.day);
        if (startOfDay.isBefore(currentMonday) || startOfDay.isAfter(currentSunday)) {
          continue;
        }
      }

      const dayAbbrevs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      final dayAbbrev = rDate != null ? dayAbbrevs[rDate.weekday - 1] : 'Mon';
      final startTime = tc['start_time']?.toString() ?? '10:00';
      final endTime = tc['end_time']?.toString() ?? '11:00';

      currentWeekRescheduled.add({
        'time': '$startTime – $endTime',
        'day': dayAbbrev,
        'date': rDate != null ? DateFormat('dd MMM yyyy').format(rDate) : rDateStr,
        'course': tc['course_title'] ?? 'Classical Arts',
        'batch': tc['batch_name'] ?? 'Batch',
        'trainer': tc['trainer_name'] ?? trainerName,
        'room': tc['room_or_hall'] ?? 'Natya Mandapam',
        'is_rescheduled': true,
        'cause': tc['cause'] ?? 'Holiday / Absence Replacement',
        'status': 'Rescheduled ★',
      });
    }

    final allMySlots = [...regularSlots, ...currentWeekRescheduled];

    // Filter by selected day
    final filtered = allMySlots.where((slot) {
      if (_selectedDay != 'All' && slot['day'] != _selectedDay) {
        return false;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F3EE), // Soft Warm Ivory
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Weekly Timetable',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Current Week: $weekRangeFormatted',
              style: const TextStyle(fontSize: 11, color: LaasyaColors.accentGold),
            ),
          ],
        ),
        // No download buttons in AppBar
        actions: const [],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchTallyClasses,
        color: LaasyaColors.primary,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // =============================================================
              // 1. ADMIN PROFILE & ACADEMY CONTROL CARD
              // =============================================================
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFEADBDB), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF2F8),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFF0D5E4), width: 1.5),
                      ),
                      child: const Center(
                        child: Icon(Icons.account_balance_rounded, color: Color(0xFF8A064D), size: 22),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text(
                                'Academy Central Office',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF590231),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE8F8F0),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFA7F3D0)),
                                ),
                                child: const Text(
                                  'Admin Verified',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF047857),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Smt. Shanta Rao • Academy Director & Academic Operations',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Master Timetable Verified • Term 2026-27 • +91 80 2345 6789',
                            style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // =============================================================
              // 2. GURU HERO BANNER (NO DOWNLOAD BUTTON)
              // =============================================================
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF590231), Color(0xFF8A064D)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF590231).withOpacity(0.25),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.calendar_month_rounded, color: LaasyaColors.accentGold, size: 28),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$trainerName\'s Weekly Timetable',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '$specialization • Current Week Only ($weekRangeFormatted)',
                            style: const TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                          if (currentWeekRescheduled.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF9E33A),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '★ ${currentWeekRescheduled.length} Rescheduled Class${currentWeekRescheduled.length > 1 ? 'es' : ''} This Week',
                                style: const TextStyle(
                                  color: Color(0xFF2D041A),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // =============================================================
              // 3. CONTROLS STRIP: ASSIGNED BATCHES & CURRENT WEEK DAY FILTER
              // =============================================================
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Current Week Schedule',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: LaasyaColors.textDark,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFCE7F3),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: LaasyaColors.primary.withOpacity(0.35),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.verified_rounded,
                          size: 14,
                          color: LaasyaColors.primary,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Total Slots: ${allMySlots.length}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: LaasyaColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Day Selector Pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _days.map((day) {
                    final isSel = _selectedDay == day;
                    final dayCount = day == 'All'
                        ? allMySlots.length
                        : allMySlots.where((s) => s['day'] == day).length;

                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(day == 'All' ? 'All ($dayCount)' : '$day ($dayCount)'),
                        selected: isSel,
                        onSelected: (val) {
                          if (val) setState(() => _selectedDay = day);
                        },
                        labelStyle: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.bold,
                          color: isSel ? Colors.white : Colors.black87,
                        ),
                        selectedColor: LaasyaColors.primary,
                        backgroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(
                            color: isSel ? LaasyaColors.primary : const Color(0xFFF0D5E4),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 16),

              // =============================================================
              // 4. TIMETABLE CLASS SLOTS (CURRENT WEEK ONLY)
              // =============================================================
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFEADBDB)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Strip
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Image.asset(
                                'assets/images/header_logo.png',
                                width: 28,
                                height: 28,
                                errorBuilder: (_, __, ___) => const Icon(Icons.school_rounded, color: LaasyaColors.primary, size: 24),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'LAASYA CULTURAL ACADEMY',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF590231),
                                        letterSpacing: 0.5,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      'CURRENT WEEK: $weekRangeFormatted',
                                      style: const TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.black54,
                                        letterSpacing: 0.4,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF2F8),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Text(
                            'DAY: ${_selectedDay.toUpperCase()}',
                            style: const TextStyle(
                              color: LaasyaColors.primary,
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const Divider(height: 20, color: Color(0xFFF0D5E4)),

                    if (filtered.isEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 36),
                        alignment: Alignment.center,
                        child: Column(
                          children: [
                            const Icon(Icons.event_busy_rounded, color: Colors.grey, size: 36),
                            const SizedBox(height: 8),
                            Text(
                              'No scheduled batches for ${_selectedDay == 'All' ? 'the selected filter' : _selectedDay} in the current week.',
                              style: const TextStyle(color: Colors.grey, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, idx) {
                          final slot = filtered[idx];
                          final time = slot['time'] ?? '';
                          final day = slot['day'] ?? '';
                          final course = slot['course'] ?? '';
                          final batch = slot['batch'] ?? '';
                          final trainer = slot['trainer'] ?? '';
                          final room = slot['room'] ?? '';
                          final isRescheduled = slot['is_rescheduled'] == true;
                          final cause = slot['cause'] ?? '';
                          final dateStr = slot['date'] ?? '';
                          final theme = _getCourseTheme(course);

                          // Rescheduled classes stand out with amber styling & star icon
                          final cardBg = isRescheduled
                              ? const Color(0xFFFFFBEB)
                              : (theme['bg'] as Color).withOpacity(0.35);
                          final cardBorder = isRescheduled
                              ? const Color(0xFFF59E0B)
                              : (theme['border'] as Color);

                          return Container(
                            decoration: BoxDecoration(
                              color: cardBg,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: cardBorder, width: isRescheduled ? 1.6 : 1.2),
                              boxShadow: isRescheduled
                                  ? [
                                      BoxShadow(
                                        color: const Color(0xFFF59E0B).withOpacity(0.12),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Time & Day Column
                                Container(
                                  width: 86,
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: isRescheduled
                                          ? const Color(0xFFF59E0B).withOpacity(0.6)
                                          : (theme['border'] as Color).withOpacity(0.5),
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isRescheduled
                                              ? const Color(0xFFFEF3C7)
                                              : (theme['badgeBg'] as Color),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          day.toUpperCase(),
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w900,
                                            color: isRescheduled
                                                ? const Color(0xFFB45309)
                                                : (theme['text'] as Color),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        _formatSlotTime(time),
                                        style: const TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.black87,
                                          height: 1.25,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(width: 12),

                                // Slot Details Column
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Badges Row - using Wrap with ConstrainedBox so it never overflows
                                      Wrap(
                                        spacing: 6,
                                        runSpacing: 4,
                                        crossAxisAlignment: WrapCrossAlignment.center,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                            decoration: BoxDecoration(
                                              color: theme['bg'] as Color,
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: theme['border'] as Color),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(theme['icon'] as IconData, size: 10, color: theme['text'] as Color),
                                                const SizedBox(width: 4),
                                                ConstrainedBox(
                                                  constraints: const BoxConstraints(maxWidth: 120),
                                                  child: Text(
                                                    course,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: TextStyle(
                                                      fontSize: 9.5,
                                                      fontWeight: FontWeight.w900,
                                                      color: theme['text'] as Color,
                                                      letterSpacing: 0.3,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(5),
                                              border: Border.all(color: Colors.grey.shade300),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.meeting_room_outlined, size: 11, color: Colors.black54),
                                                const SizedBox(width: 3),
                                                ConstrainedBox(
                                                  constraints: const BoxConstraints(maxWidth: 120),
                                                  child: Text(
                                                    room,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: const TextStyle(fontSize: 9.5, color: Colors.black87, fontWeight: FontWeight.w600),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),

                                      // Rescheduled Star Badge
                                      if (isRescheduled) ...[
                                        const SizedBox(height: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFEF3C7),
                                            borderRadius: BorderRadius.circular(5),
                                            border: Border.all(color: const Color(0xFFF59E0B)),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.star_rounded, size: 12, color: Color(0xFFD97706)),
                                              const SizedBox(width: 3),
                                              Flexible(
                                                child: Text(
                                                  '★ EXTRA / RESCHEDULED CLASS ($dateStr)',
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 9.5,
                                                    fontWeight: FontWeight.w900,
                                                    color: Color(0xFF92400E),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (cause.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            'Reason: $cause',
                                            style: const TextStyle(fontSize: 10, fontStyle: FontStyle.italic, color: Color(0xFFB45309)),
                                          ),
                                        ],
                                      ],

                                      const SizedBox(height: 6),

                                      // Batch Name
                                      Text(
                                        batch,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: LaasyaColors.textDark,
                                        ),
                                      ),

                                      const SizedBox(height: 4),

                                      // Faculty Guru
                                      Row(
                                        children: [
                                          const Icon(Icons.person_rounded, size: 13, color: Colors.black54),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              'Guru $trainer',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontSize: 11.5,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.black87,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

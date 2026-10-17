import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import '../../core/constants/colors.dart';

class TrainerTimetableScreen extends StatefulWidget {
  final Map<String, dynamic>? trainerProfile;

  const TrainerTimetableScreen({super.key, this.trainerProfile});

  @override
  State<TrainerTimetableScreen> createState() => _TrainerTimetableScreenState();
}

class _TrainerTimetableScreenState extends State<TrainerTimetableScreen> {
  final GlobalKey _timetableKey = GlobalKey();

  String _selectedDay = 'All'; // 'All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  bool _filterOnlyMyBatches = false;
  bool _isDownloading = false;

  final List<String> _days = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
      'time': '8:30 AM – 9:30 AM',
      'day': 'Tue',
      'course': 'BHARATANATYAM',
      'batch': 'Semi-Classical',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '8:30 AM – 9:30 AM',
      'day': 'Thu',
      'course': 'BHARATANATYAM',
      'batch': 'Semi-Classical',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '8:30 AM – 9:30 AM',
      'day': 'Fri',
      'course': 'BHARATANATYAM',
      'batch': 'Semi-Classical',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '9:30 AM – 10:30 AM',
      'day': 'Sat',
      'course': 'BHARATANATYAM',
      'batch': 'Nrityam (Morning)',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '9:30 AM – 10:30 AM',
      'day': 'Sun',
      'course': 'BHARATANATYAM',
      'batch': 'Nrityam (Morning)',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '10:30 AM – 11:30 AM',
      'day': 'Sat',
      'course': 'BHARATANATYAM',
      'batch': 'Kartari Mukham',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '10:30 AM – 11:30 AM',
      'day': 'Sat',
      'course': 'BHARATANATYAM',
      'batch': 'Spanda',
      'trainer': 'Vismaya',
      'room': 'Room 102',
    },
    {
      'time': '10:30 AM – 11:30 AM',
      'day': 'Sun',
      'course': 'BHARATANATYAM',
      'batch': 'Kartari Mukham',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '10:30 AM – 11:30 AM',
      'day': 'Sun',
      'course': 'BHARATANATYAM',
      'batch': 'Spanda',
      'trainer': 'Vismaya',
      'room': 'Room 102',
    },
    {
      'time': '11:30 AM – 12:30 PM',
      'day': 'Sat',
      'course': 'BHARATANATYAM',
      'batch': 'Shikharam',
      'trainer': 'Kavya',
      'room': 'Natya Mandapam',
    },
    {
      'time': '11:30 AM – 12:30 PM',
      'day': 'Sat',
      'course': 'BHARATANATYAM',
      'batch': 'Blossom',
      'trainer': 'Amrutha',
      'room': 'Room 101',
    },
    {
      'time': '11:30 AM – 12:30 PM',
      'day': 'Sun',
      'course': 'BHARATANATYAM',
      'batch': 'Shikharam',
      'trainer': 'Kavya',
      'room': 'Natya Mandapam',
    },
    {
      'time': '11:30 AM – 12:30 PM',
      'day': 'Sun',
      'course': 'BHARATANATYAM',
      'batch': 'Blossom',
      'trainer': 'Amrutha',
      'room': 'Room 101',
    },
    {
      'time': '2:00 PM – 3:00 PM',
      'day': 'Sat',
      'course': 'BHARATANATYAM',
      'batch': 'Ladies Bharatanatyam',
      'trainer': 'Kavya',
      'room': 'Natya Mandapam',
    },
    {
      'time': '2:00 PM – 3:00 PM',
      'day': 'Sun',
      'course': 'BHARATANATYAM',
      'batch': 'Ladies Bharatanatyam',
      'trainer': 'Kavya',
      'room': 'Natya Mandapam',
    },
    {
      'time': '3:30 PM – 4:30 PM',
      'day': 'Sat',
      'course': 'WESTERN DANCE',
      'batch': 'Weekend Batch',
      'trainer': 'Manjunath',
      'room': 'Studio 2',
    },
    {
      'time': '3:30 PM – 4:30 PM',
      'day': 'Sun',
      'course': 'WESTERN DANCE',
      'batch': 'Weekend Batch',
      'trainer': 'Manjunath',
      'room': 'Studio 2',
    },
    {
      'time': '4:00 PM – 5:00 PM',
      'day': 'Tue',
      'course': 'BHARATANATYAM',
      'batch': 'Ragam',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '4:00 PM – 5:00 PM',
      'day': 'Wed',
      'course': 'INSTRUMENT CLASSES',
      'batch': 'Weekday Batch (Violin)',
      'trainer': 'Amos',
      'room': 'Room 103',
    },
    {
      'time': '4:00 PM – 5:00 PM',
      'day': 'Thu',
      'course': 'BHARATANATYAM',
      'batch': 'Ragam',
      'trainer': 'Nandana',
      'room': 'Natya Mandapam',
    },
    {
      'time': '4:00 PM – 5:00 PM',
      'day': 'Fri',
      'course': 'INSTRUMENT CLASSES',
      'batch': 'Weekday Batch (Violin)',
      'trainer': 'Amos',
      'room': 'Room 103',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Mon',
      'course': 'BHARATANATYAM',
      'batch': 'Anjali',
      'trainer': 'Kavya',
      'room': 'Natya Mandapam',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Tue',
      'course': 'KARATE',
      'batch': 'Dojo Beginners',
      'trainer': 'Balraj',
      'room': 'Ground Hall',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Thu',
      'course': 'KARATE',
      'batch': 'Dojo Beginners',
      'trainer': 'Balraj',
      'room': 'Ground Hall',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Fri',
      'course': 'BHARATANATYAM',
      'batch': 'Anjali',
      'trainer': 'Kavya',
      'room': 'Natya Mandapam',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Sat',
      'course': 'BHARATANATYAM',
      'batch': 'Alapadma',
      'trainer': 'Vismaya',
      'room': 'Natya Mandapam',
    },
    {
      'time': '4:30 PM – 5:30 PM',
      'day': 'Sun',
      'course': 'BHARATANATYAM',
      'batch': 'Thalam',
      'trainer': 'Amrutha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Mon',
      'course': 'BHARATANATYAM',
      'batch': 'Mudra',
      'trainer': 'Amrutha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Tue',
      'course': 'BHARATANATYAM',
      'batch': 'Pataka',
      'trainer': 'Vismaya',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Wed',
      'course': 'BHARATANATYAM',
      'batch': 'Mudra',
      'trainer': 'Amrutha',
      'room': 'Natya Mandapam',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Wed',
      'course': 'INSTRUMENT CLASSES',
      'batch': 'Weekday Batch',
      'trainer': 'Amos',
      'room': 'Room 103',
    },
    {
      'time': '5:00 PM – 6:00 PM',
      'day': 'Fri',
      'course': 'INSTRUMENT CLASSES',
      'batch': 'Weekday Batch',
      'trainer': 'Amos',
      'room': 'Room 103',
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
    if (lower.contains('DRAWING') || lower.contains('ART')) {
      return {
        'bg': const Color(0xFFDCFCE7),
        'border': const Color(0xFFBBF7D0),
        'text': const Color(0xFF15803D),
        'badgeBg': const Color(0xFFF0FDF4),
        'icon': Icons.brush_rounded,
      };
    }
    if (lower.contains('WESTERN')) {
      return {
        'bg': const Color(0xFFEDE9FE),
        'border': const Color(0xFFDDD6FE),
        'text': const Color(0xFF6D28D9),
        'badgeBg': const Color(0xFFF5F3FF),
        'icon': Icons.nightlife_rounded,
      };
    }
    if (lower.contains('KALARI')) {
      return {
        'bg': const Color(0xFFFFEDD5),
        'border': const Color(0xFFFED7AA),
        'text': const Color(0xFFC2410C),
        'badgeBg': const Color(0xFFFFF7ED),
        'icon': Icons.sports_martial_arts_rounded,
      };
    }
    if (lower.contains('KARATE')) {
      return {
        'bg': const Color(0xFFCCFBF1),
        'border': const Color(0xFF99F6E4),
        'text': const Color(0xFF0F766E),
        'badgeBg': const Color(0xFFF0FDFA),
        'icon': Icons.sports_kabaddi_rounded,
      };
    }
    if (lower.contains('YOGA')) {
      return {
        'bg': const Color(0xFFFEF9C3),
        'border': const Color(0xFFFEF08A),
        'text': const Color(0xFFA16207),
        'badgeBg': const Color(0xFFFEFCE8),
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

  Future<void> _downloadTimetableAsPng() async {
    if (_isDownloading) return;
    setState(() => _isDownloading = true);

    try {
      await Future.delayed(const Duration(milliseconds: 150));
      final boundary = _timetableKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        throw Exception('Timetable preview could not be captured.');
      }

      final ui.Image image = await boundary.toImage(pixelRatio: 2.5);
      final ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) {
        throw Exception('PNG serialization failed.');
      }

      final Uint8List pngBytes = byteData.buffer.asUint8List();
      final fileName = 'laasya_timetable_${DateTime.now().millisecondsSinceEpoch}.png';

      // Save via native Android MediaStore / Pictures directory
      const channel = MethodChannel('com.laasyaacademy.app/notifications');
      final bool? success = await channel.invokeMethod<bool>('saveImage', {
        'bytes': pngBytes,
        'fileName': fileName,
      });

      if (!mounted) return;

      if (success == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF03543F),
            duration: const Duration(seconds: 4),
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Timetable PNG saved successfully to Gallery & Downloads!\n($fileName)',
                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        );
      } else {
        throw Exception('File write failed.');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: LaasyaColors.error,
            content: Text('Failed to save timetable PNG: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final trainerName = (widget.trainerProfile?['full_name'] ?? 'Guru').toString();
    final specialization = (widget.trainerProfile?['specialization'] ?? widget.trainerProfile?['course_name'] ?? 'Faculty').toString();

    // Filter master list
    final filtered = _masterTimetable.where((slot) {
      if (_selectedDay != 'All' && slot['day'] != _selectedDay) {
        return false;
      }
      if (_filterOnlyMyBatches) {
        final slotTrainer = (slot['trainer'] ?? '').toString().toLowerCase();
        final slotCourse = (slot['course'] ?? '').toString().toLowerCase();
        final tNameLower = trainerName.toLowerCase();
        final specLower = specialization.toLowerCase();
        if (!slotTrainer.contains(tNameLower) && !tNameLower.contains(slotTrainer) && !slotCourse.contains(specLower)) {
          return false;
        }
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Weekly Timetable',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Academy Master Schedule & Batch Timings',
              style: TextStyle(fontSize: 11, color: LaasyaColors.accentGold),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _isDownloading ? null : _downloadTimetableAsPng,
            tooltip: 'Download PNG',
            icon: _isDownloading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: LaasyaColors.accentGold),
                  )
                : const Icon(Icons.download_rounded, color: LaasyaColors.accentGold, size: 24),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Overview Banner
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
                    color: Colors.black.withOpacity(0.08),
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
                          '$trainerName\'s Schedule',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '$specialization • Full Weekly Grid View',
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: _isDownloading ? null : _downloadTimetableAsPng,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF9E33A),
                      foregroundColor: const Color(0xFF2D041A),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.photo_library_rounded, size: 14),
                    label: const Text(
                      'Download PNG',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Controls Strip: Filter by Assigned vs All + Day Selector
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Weekly Schedule',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: LaasyaColors.textDark,
                  ),
                ),
                InkWell(
                  onTap: () => setState(() => _filterOnlyMyBatches = !_filterOnlyMyBatches),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: _filterOnlyMyBatches ? const Color(0xFFFCE7F3) : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _filterOnlyMyBatches ? LaasyaColors.primary : Colors.grey.shade300,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _filterOnlyMyBatches ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                          size: 14,
                          color: _filterOnlyMyBatches ? LaasyaColors.primary : Colors.grey,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'My Batches Only',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _filterOnlyMyBatches ? LaasyaColors.primary : Colors.black87,
                          ),
                        ),
                      ],
                    ),
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
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ChoiceChip(
                      label: Text(day),
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

            // Timetable RepaintBoundary Container (Exportable as High-Res PNG)
            RepaintBoundary(
              key: _timetableKey,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFF0D5E4)),
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
                    // Exportable Header Strip
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Image.asset(
                              'assets/images/header_logo.png',
                              width: 28,
                              height: 28,
                              errorBuilder: (_, __, ___) => const Icon(Icons.school_rounded, color: LaasyaColors.primary, size: 24),
                            ),
                            const SizedBox(width: 8),
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'LAASYA CULTURAL ACADEMY',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF590231),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                Text(
                                  'OFFICIAL WEEKLY BATCH TIMETABLE',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black54,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
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
                              'No scheduled batches for ${_selectedDay == 'All' ? 'the selected filter' : _selectedDay}.',
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
                          final theme = _getCourseTheme(course);

                          return Container(
                            decoration: BoxDecoration(
                              color: (theme['bg'] as Color).withOpacity(0.35),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: theme['border'] as Color, width: 1.2),
                            ),
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Time & Day Column
                                Container(
                                  width: 82,
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: (theme['border'] as Color).withOpacity(0.5)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: theme['badgeBg'] as Color,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          day.toUpperCase(),
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w900,
                                            color: theme['text'] as Color,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        time,
                                        style: const TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.black87,
                                          height: 1.2,
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
                                      // Course Badge
                                      Row(
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
                                                Text(
                                                  course,
                                                  style: TextStyle(
                                                    fontSize: 9.5,
                                                    fontWeight: FontWeight.w900,
                                                    color: theme['text'] as Color,
                                                    letterSpacing: 0.3,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const Spacer(),
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
                                                Text(
                                                  room,
                                                  style: const TextStyle(fontSize: 9.5, color: Colors.black87, fontWeight: FontWeight.w600),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),

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
                                          Text(
                                            'Guru $trainer',
                                            style: const TextStyle(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.black87,
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
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

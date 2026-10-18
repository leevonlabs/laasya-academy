import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import 'event_folder_details_screen.dart';

class StudentVideoLibraryScreen extends StatefulWidget {
  final String? studentCourse;
  final String? studentBatch;
  final String? studentId;
  final String? studentRoll;
  final bool isTrainer;

  const StudentVideoLibraryScreen({
    super.key,
    this.studentCourse,
    this.studentBatch,
    this.studentId,
    this.studentRoll,
    this.isTrainer = false,
  });

  @override
  State<StudentVideoLibraryScreen> createState() => _StudentVideoLibraryScreenState();
}

class _StudentVideoLibraryScreenState extends State<StudentVideoLibraryScreen> {
  List<Map<String, dynamic>> _folders = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _activeTab = 'my_course'; // 'my_course' or 'all'
  bool _isTrainerUser = false;
  String _studentId = '';
  String _studentRoll = '';
  String _studentCourse = '';
  String _studentBatch = '';
  Map<String, dynamic>? _userProfile;

  // Multi-Year & Month Filter State (Side-scrolling multi-year selection up to 2050)
  Set<int> _selectedYears = {DateTime.now().year};
  int? _selectedMonth = 10; // Default: October (10), null = All Months

  static final List<int> _availableYears = List<int>.generate(31, (i) => 2020 + i);

  static const List<String> _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  static const List<String> _shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  String get _displayMonthYear {
    String yearPart;
    if (_selectedYears.isEmpty) {
      yearPart = '${DateTime.now().year}';
    } else if (_selectedYears.length == 1) {
      yearPart = '${_selectedYears.first}';
    } else {
      final sorted = _selectedYears.toList()..sort();
      yearPart = sorted.join(', ');
    }

    if (_selectedMonth == null) {
      return 'All Months ($yearPart)';
    }
    return '${_monthNames[_selectedMonth! - 1]} ($yearPart)';
  }

  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    SupabaseService().markAllVideosAsRead();
    _unreadCount = 0;
    _folders = SupabaseService().getCachedStudentEventFolders();
    _isLoading = _folders.isEmpty;

    final prof = SupabaseService().currentUserProfile;
    final role = (prof?['role'] ?? '').toString().toLowerCase();
    _isTrainerUser = widget.isTrainer || role.contains('trainer') || role.contains('guru') || role == 'teacher';
    _studentId = widget.studentId ?? prof?['id']?.toString() ?? '';
    _studentRoll = widget.studentRoll ?? prof?['roll_number']?.toString() ?? '';
    _studentCourse = widget.studentCourse ?? prof?['course']?.toString() ?? 'Bharathanatyam';
    _studentBatch = widget.studentBatch ?? prof?['batch']?.toString() ?? '';
    _userProfile = prof;

    _loadEventFolders();
  }

  Future<void> _loadEventFolders() async {
    if (_folders.isEmpty) {
      setState(() => _isLoading = true);
    }
    final data = await SupabaseService().getStudentEventFolders(
      courseTitle: widget.studentCourse,
      batchName: widget.studentBatch,
    );
    if (mounted) {
      setState(() {
        _folders = data;
        _isLoading = false;
      });
      SupabaseService().markAllVideosAsRead();
    }
  }

  // Parse any date representation into DateTime
  DateTime? _parseDate(dynamic dateVal) {
    if (dateVal == null) return null;
    final s = dateVal.toString().trim();
    if (s.isEmpty) return null;
    try {
      if (s.contains('T')) {
        return DateTime.parse(s);
      } else if (s.contains('-') && s.length >= 10) {
        final parts = s.split('-');
        if (parts.length >= 3) {
          return DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2].substring(0, 2)));
        }
      }
      return DateTime.parse(s);
    } catch (_) {
      return null;
    }
  }

  // Format date nicely as '05 Oct 2026'
  String _formatDate(dynamic dateVal) {
    final dt = _parseDate(dateVal);
    if (dt == null) return dateVal?.toString() ?? '--';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final dayStr = dt.day.toString().padLeft(2, '0');
    final monthStr = months[dt.month - 1];
    return '$dayStr $monthStr ${dt.year}';
  }

  // Get upload date (using created_at with fallback to event_date)
  DateTime? _getUploadDate(Map<String, dynamic> item) {
    final created = item['created_at'];
    if (created != null && created.toString().isNotEmpty) {
      final parsed = _parseDate(created);
      if (parsed != null) return parsed;
    }
    return _parseDate(item['event_date']);
  }

  void _stepMonth(int delta) {
    setState(() {
      if (_selectedMonth == null) {
        _selectedMonth = delta > 0 ? 1 : 12;
      } else {
        int m = _selectedMonth! + delta;
        if (m > 12) {
          _selectedMonth = 1;
          if (_selectedYears.isNotEmpty) {
            final maxYear = _selectedYears.reduce((a, b) => a > b ? a : b);
            if (maxYear < 2030) _selectedYears = {maxYear + 1};
          }
        } else if (m < 1) {
          _selectedMonth = 12;
          if (_selectedYears.isNotEmpty) {
            final minYear = _selectedYears.reduce((a, b) => a < b ? a : b);
            if (minYear > 2022) _selectedYears = {minYear - 1};
          }
        } else {
          _selectedMonth = m;
        }
      }
    });
  }

  // Month & Year Filter Selection Sheet (Side scrolling multi-year selection)
  void _openMonthYearFilterSheet() {
    Set<int> tempYears = Set<int>.from(_selectedYears);
    int? tempMonth = _selectedMonth;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Select Month & Years',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: LaasyaColors.textDark,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Text(
                'Side-scroll to select multiple years and target month',
                style: TextStyle(fontSize: 12, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 14),

              // Side-Scrolling Multi-Year Selector Header
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'SELECT YEARS (SIDE-SCROLL)',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: Color(0xFF8A064D),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Horizontal Side-Scrolling Year Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: [
                    ..._availableYears.map((y) {
                      final isSelected = tempYears.contains(y);
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: InkWell(
                          onTap: () {
                            setSheetState(() {
                              if (isSelected) {
                                if (tempYears.length > 1) {
                                  tempYears.remove(y);
                                }
                              } else {
                                tempYears.add(y);
                              }
                            });
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? LaasyaColors.primary : const Color(0xFFFFF9FB),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? LaasyaColors.primary : const Color(0xFFF0D5E4),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (isSelected) ...[
                                  const Icon(Icons.check, size: 13, color: Colors.white),
                                  const SizedBox(width: 4),
                                ],
                                Text(
                                  '$y',
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : Colors.black87,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Month Selector Grid (12 months)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'MONTH',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: Color(0xFF8A064D),
                    ),
                  ),
                  if (tempMonth != null)
                    InkWell(
                      onTap: () => setSheetState(() => tempMonth = null),
                      child: const Text(
                        'Select All Months',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF8A064D),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                  childAspectRatio: 2.1,
                ),
                itemCount: 12,
                itemBuilder: (context, idx) {
                  final m = idx + 1;
                  final isSelected = tempMonth == m;
                  return InkWell(
                    onTap: () {
                      setSheetState(() => tempMonth = isSelected ? null : m);
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? LaasyaColors.primary : const Color(0xFFFFF9FB),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? LaasyaColors.primary : const Color(0xFFF0D5E4),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _shortMonths[idx],
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.black87,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                          fontSize: 12.5,
                        ),
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 18),

              // Action Buttons: Apply Filter
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _selectedYears = tempYears;
                      _selectedMonth = tempMonth;
                    });
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: LaasyaColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    'Apply Filter (${tempYears.length == _availableYears.length ? "All Years" : "${tempYears.length} Years Selected"}${tempMonth != null ? " • ${_shortMonths[tempMonth! - 1]}" : " • All Months"})',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Launch external URL safely
  Future<void> _launchExternalUrl(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) return;
    try {
      final uri = Uri.parse(cleanUrl);
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(uri);
      }
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: cleanUrl));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Link copied to clipboard: $cleanUrl'),
            backgroundColor: LaasyaColors.primary,
          ),
        );
      }
    }
  }

  void _copyUrlToClipboard(String url, String label) {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) return;
    Clipboard.setData(ClipboardData(text: cleanUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: const Color(0xFF03543F),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // Media options bottom sheet (shows YouTube and Drive options or only the link that exists)
  void _openMediaOptions(Map<String, dynamic> item) {
    final driveUrl = (item['drive_url'] ?? '').toString().trim();
    final youtubeUrl = (item['youtube_url'] ?? '').toString().trim();
    final hasDrive = driveUrl.isNotEmpty;
    final hasYoutube = youtubeUrl.isNotEmpty;
    final title = (item['title'] ?? 'Event Media').toString();

    if (!hasDrive && !hasYoutube) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No media link available for this item')),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Access Event Media',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: LaasyaColors.textDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF8A064D),
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Google Drive Section (Show ONLY if hasDrive)
            if (hasDrive) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3FAF7),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFC7EBD9)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDEF7EC),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.add_to_drive_rounded, color: Color(0xFF03543F), size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Google Drive Folder',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF03543F),
                                ),
                              ),
                              Text(
                                'Photos, videos & high-res media clips',
                                style: TextStyle(fontSize: 11, color: Colors.black54),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(ctx);
                              _launchExternalUrl(driveUrl);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF03543F),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 9),
                              elevation: 0,
                            ),
                            icon: const Icon(Icons.open_in_new_rounded, size: 14),
                            label: const Text('Open in Drive', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton.icon(
                          onPressed: () {
                            _copyUrlToClipboard(driveUrl, 'Drive link');
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF03543F),
                            side: const BorderSide(color: Color(0xFF03543F)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                          ),
                          icon: const Icon(Icons.copy_rounded, size: 14),
                          label: const Text('Copy', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (hasYoutube) const SizedBox(height: 12),
            ],

            // YouTube Section (Show ONLY if hasYoutube)
            if (hasYoutube) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF5F5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFED7D7)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFDE8E8),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.play_circle_fill_rounded, color: Color(0xFFE53E3E), size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'YouTube Video / Playlist',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF9B1C1C),
                                ),
                              ),
                              Text(
                                'Performance streams & choreography recordings',
                                style: TextStyle(fontSize: 11, color: Colors.black54),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(ctx);
                              _launchExternalUrl(youtubeUrl);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE53E3E),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 9),
                              elevation: 0,
                            ),
                            icon: const Icon(Icons.play_arrow_rounded, size: 16),
                            label: const Text('Open YouTube', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton.icon(
                          onPressed: () {
                            _copyUrlToClipboard(youtubeUrl, 'YouTube link');
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFE53E3E),
                            side: const BorderSide(color: Color(0xFFE53E3E)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                          ),
                          icon: const Icon(Icons.copy_rounded, size: 14),
                          label: const Text('Copy', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  bool _isItemVisible(Map<String, dynamic> item) {
    if (_isTrainerUser) {
      // 4. Video Library page (Guru Login)
      // - Display only video links shared by the Admin.
      // - Do not display video links shared by the Guru to students.
      final sharedByType = (item['shared_by_type'] ?? '').toString().toLowerCase();
      final trId = (item['trainer_id'] ?? '').toString();
      if (sharedByType == 'guru' || trId.isNotEmpty) {
        return false;
      }
      return true;
    }

    // 9. Video Library page (Student Login)
    // - Do not display every video link shared by every Guru.
    // - Display links only when the Admin or Guru has shared them with the specific student's enrolled batch or course.
    // - Display the student's performance videos shared by the Guru as well.
    final cat = (item['category'] ?? '').toString().toLowerCase();
    final isPerformance = cat == 'performance' || cat == 'student_performance' || item['target_student_id'] != null;

    // 1. Student's own performance videos shared by Guru
    if (isPerformance) {
      final tStudentId = (item['target_student_id'] ?? '').toString().toLowerCase().trim();
      final tStudentRoll = (item['target_student_roll'] ?? item['roll_number'] ?? '').toString().toLowerCase().trim();
      final tStudentName = (item['target_student_name'] ?? '').toString().toLowerCase().trim();
      final myId = _studentId.toLowerCase().trim();
      final myRoll = _studentRoll.toLowerCase().trim();
      final myName = (_userProfile?['full_name'] ?? '').toString().toLowerCase().trim();

      if (myId.isNotEmpty && tStudentId.isNotEmpty && tStudentId == myId) return true;
      if (myRoll.isNotEmpty && tStudentRoll.isNotEmpty && (tStudentRoll == myRoll || tStudentRoll.contains(myRoll))) return true;
      if (myName.isNotEmpty && tStudentName.isNotEmpty && (tStudentName == myName || tStudentName.contains(myName) || myName.contains(tStudentName))) return true;
      if (item['target_students'] is List) {
        for (final ts in item['target_students'] as List) {
          if (ts is Map) {
            final sId = ts['id']?.toString().toLowerCase().trim() ?? '';
            final sRoll = ts['roll']?.toString().toLowerCase().trim() ?? '';
            if (myId.isNotEmpty && sId == myId) return true;
            if (myRoll.isNotEmpty && sRoll == myRoll) return true;
          }
        }
      }
      // Strictly hide performance videos of other students
      return false;
    }

    // 2. Admin Universal broadcast links (available to all students across all courses)
    final sharedBy = (item['shared_by_type'] ?? '').toString().toLowerCase();
    final trId = (item['trainer_id'] ?? '').toString();
    final access = (item['access_level'] ?? '').toString().toLowerCase();
    final itemCourse = (item['target_course_title'] ?? '').toString().trim().toLowerCase();
    final itemBatch = (item['target_batch_name'] ?? '').toString().trim().toLowerCase();
    final isUniversal = access == 'all students' || access == 'universal' ||
        (itemCourse.contains('all 18') && itemBatch.contains('all'));

    if (sharedBy != 'guru' && trId.isEmpty && isUniversal) {
      return true;
    }

    // 3. Admin or Guru General links matching student's enrolled course & batch
    final enrolledCourseNames = <String>{};
    final enrolledBatchNames = <String>{};
    if (_studentCourse.isNotEmpty) enrolledCourseNames.add(_studentCourse.toLowerCase().trim());
    if (_studentBatch.isNotEmpty) enrolledBatchNames.add(_studentBatch.toLowerCase().trim());

    final enrolledList = _userProfile?['enrolled_courses'];
    if (enrolledList is List) {
      for (final e in enrolledList) {
        if (e is Map) {
          final cName = (e['course_title'] ?? e['title'] ?? e['course'] ?? '').toString().toLowerCase().trim();
          if (cName.isNotEmpty) enrolledCourseNames.add(cName);
          final bName = (e['batch_name'] ?? e['name'] ?? e['batch'] ?? '').toString().toLowerCase().trim();
          if (bName.isNotEmpty) enrolledBatchNames.add(bName);
        }
      }
    }

    bool courseMatches = false;
    if (itemCourse.isEmpty || itemCourse == 'all courses' || itemCourse.contains('all 18') || itemCourse == 'all') {
      courseMatches = true;
    } else {
      for (final mc in enrolledCourseNames) {
        if (itemCourse.contains(mc) || mc.contains(itemCourse)) {
          courseMatches = true;
          break;
        }
      }
      if (!courseMatches && item['target_courses'] is List) {
        for (var c in item['target_courses'] as List) {
          final cTitle = (c is Map ? c['title'] : c).toString().toLowerCase();
          for (final mc in enrolledCourseNames) {
            if (cTitle.contains(mc) || mc.contains(cTitle)) {
              courseMatches = true;
              break;
            }
          }
          if (courseMatches) break;
        }
      }
    }

    if (!courseMatches) return false;

    // Must also match batch (or be for all batches in that course)
    if (itemBatch.isEmpty || itemBatch == 'all batches' || itemBatch == 'all') {
      return true;
    }
    for (final mb in enrolledBatchNames) {
      if (itemBatch.contains(mb) || mb.contains(itemBatch)) {
        return true;
      }
    }

    return false;
  }

  // Check upload date matches selected month and year
  bool _matchesUploadDate(Map<String, dynamic> item) {
    final itemDate = _getUploadDate(item);
    if (itemDate == null) return true;

    // Check year match (matches all if empty or contains)
    final matchesYear = _selectedYears.isEmpty || _selectedYears.contains(itemDate.year);
    if (!matchesYear) return false;

    if (_selectedMonth != null) {
      return itemDate.month == _selectedMonth;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final currentCourseName = _isTrainerUser ? 'Academy Library' : _studentCourse;

    final visibleFolders = _folders.where(_isItemVisible).toList();
    final myCourseFolders = visibleFolders.where((item) {
      final cat = (item['category'] ?? '').toString().toLowerCase();
      return cat != 'universal' && (item['target_course_title'] ?? '').toString().toLowerCase().contains(_studentCourse.toLowerCase());
    }).toList();
    final basePool = (_activeTab == 'my_course' && !_isTrainerUser) ? myCourseFolders : visibleFolders;

    // Apply Upload Date filter
    final dateFilteredPool = basePool.where(_matchesUploadDate).toList();

    // Apply Search Query within the list
    final displayedList = dateFilteredPool.where((item) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase().trim();
      final title = (item['title'] ?? '').toString().toLowerCase();
      final course = (item['target_course_title'] ?? '').toString().toLowerCase();
      final desc = (item['description'] ?? '').toString().toLowerCase();
      return title.contains(q) || course.contains(q) || desc.contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                  margin: const EdgeInsets.only(bottom: 2),
                  decoration: BoxDecoration(
                    color: _unreadCount > 0 ? const Color(0xFFF9E33A) : Colors.white24,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _unreadCount > 0 ? '$_unreadCount NEW MATERIALS' : 'VAULT UP TO DATE',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: _unreadCount > 0 ? const Color(0xFF590231) : Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              _isTrainerUser ? 'Academy Video Library' : 'Event Video Library',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              _isTrainerUser ? 'Official Admin Broadcasts & Media' : 'Enrolled: $currentCourseName',
              style: const TextStyle(fontSize: 10.5, color: LaasyaColors.accentGold),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : RefreshIndicator(
              onRefresh: _loadEventFolders,
              color: LaasyaColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // =========================================================
                    // 1. PROMINENT ACTIVE MONTH & YEAR ON TOP (USER REQUIREMENT)
                    // =========================================================
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFF0D5E4)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.025),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(9),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF2F8),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFF0D5E4)),
                            ),
                            child: const Icon(
                              Icons.calendar_month_rounded,
                              color: LaasyaColors.primary,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: InkWell(
                              onTap: _openMonthYearFilterSheet,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'MONTH & YEAR FILTER',
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      letterSpacing: 0.8,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF8A064D),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          _displayMonthYear,
                                          style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: LaasyaColors.textDark,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 3),
                                      const Icon(Icons.arrow_drop_down, color: LaasyaColors.primary, size: 18),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          // Month Nav Stepper: Previous Month (<)
                          IconButton(
                            icon: const Icon(Icons.chevron_left_rounded, size: 24, color: LaasyaColors.primary),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            tooltip: 'Previous Month',
                            onPressed: () => _stepMonth(-1),
                          ),
                          const SizedBox(width: 4),
                          // Month Nav Stepper: Next Month (>)
                          IconButton(
                            icon: const Icon(Icons.chevron_right_rounded, size: 24, color: LaasyaColors.primary),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            tooltip: 'Next Month',
                            onPressed: () => _stepMonth(1),
                          ),
                          const SizedBox(width: 8),
                          // Month & Year Picker Button
                          InkWell(
                            onTap: _openMonthYearFilterSheet,
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                              decoration: BoxDecoration(
                                color: const Color(0xFF590231),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.tune_rounded, color: LaasyaColors.accentGold, size: 13),
                                  SizedBox(width: 4),
                                  Text(
                                    'Filter',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // =========================================================
                    // 2. SEGMENTED TABS: MY ENROLLED COURSE vs ALL ACADEMY (Hidden for Guru Login)
                    // =========================================================
                    if (!_isTrainerUser)
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFF0D5E4)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: _tabButton(
                              title: 'My Course',
                              count: myCourseFolders.where(_matchesUploadDate).length,
                              isSelected: _activeTab == 'my_course',
                              onTap: () => setState(() => _activeTab = 'my_course'),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: _tabButton(
                              title: 'All Events',
                              count: visibleFolders.where(_matchesUploadDate).length,
                              isSelected: _activeTab == 'all',
                              onTap: () => setState(() => _activeTab = 'all'),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // =========================================================
                    // 3. SEARCH BAR (SEARCH WITHIN ACTIVE MONTH OR CUSTOM RANGE)
                    // =========================================================
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFF0D5E4)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextField(
                        onChanged: (val) => setState(() => _searchQuery = val),
                        decoration: InputDecoration(
                          icon: const Icon(Icons.search_rounded, color: Colors.grey, size: 20),
                          border: InputBorder.none,
                          hintText: 'Search shoot title or course name...',
                          hintStyle: const TextStyle(fontSize: 12.5, color: Colors.black38),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear_rounded, size: 18, color: Colors.grey),
                                  onPressed: () => setState(() => _searchQuery = ''),
                                )
                              : null,
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // =========================================================
                    // 4. HEADER: COUNT & GOOGLE DRIVE LABEL
                    // =========================================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _isTrainerUser
                              ? 'Admin Video Vault (${displayedList.length})'
                              : (_activeTab == 'my_course'
                                  ? 'Course Media for $currentCourseName (${displayedList.length})'
                                  : 'All Academy Media Vault (${displayedList.length})'),
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.bold,
                            color: LaasyaColors.textDark,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // =========================================================
                    // 5. FOLDERS LIST OR EMPTY STATE
                    // =========================================================
                    if (displayedList.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(28),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.folder_off_outlined, size: 44, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'No Shoot Folders Found for "$_searchQuery"'
                                  : 'No Event Videos in $_displayMonthYear',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _selectedMonth != null
                                  ? 'No videos found for $_displayMonthYear. Use the month & year filter above to explore other dates.'
                                  : 'Try adjusting your search keyword or selecting a specific month.',
                              style: const TextStyle(fontSize: 11.5, color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                            if (_selectedMonth != null) ...[
                              const SizedBox(height: 14),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: LaasyaColors.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                                ),
                                onPressed: () {
                                  setState(() {
                                    _selectedMonth = null;
                                  });
                                },
                                icon: const Icon(Icons.history_rounded, size: 15),
                                label: const Text('Show All Months', style: TextStyle(fontSize: 12)),
                              ),
                            ],
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: displayedList.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final item = displayedList[index];
                          final title = (item['title'] ?? 'Event Shoot').toString();
                          final course = (item['target_course_title'] ?? 'All Academy Courses').toString();
                          final eventDateRaw = item['event_date'];
                          final uploadDateRaw = item['created_at'] ?? item['event_date'];

                          final eventDateFormatted = _formatDate(eventDateRaw);
                          final uploadDateFormatted = _formatDate(uploadDateRaw);

                          final isTargetCourse = course.toLowerCase().contains(currentCourseName.toLowerCase());

                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isTargetCourse ? const Color(0xFF8A064D).withOpacity(0.35) : const Color(0xFFF0D5E4),
                                width: isTargetCourse ? 1.4 : 1.0,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.025),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Event Title
                                  Text(
                                    title,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: LaasyaColors.textDark,
                                      height: 1.25,
                                    ),
                                  ),

                                  // Sender Attribution: Name and Role
                                  Builder(
                                    builder: (context) {
                                      final sharedByType = (item['shared_by_type'] ?? '').toString().toLowerCase();
                                      final trainerName = item['trainer_name']?.toString();
                                      final bool isGuru = sharedByType == 'guru' || (trainerName != null && trainerName.isNotEmpty);
                                      final senderRole = isGuru ? 'Guru / Trainer' : 'Admin / Director';
                                      final senderName = isGuru ? (trainerName ?? 'Guru') : (item['created_by'] ?? 'Academy Director');

                                      return Container(
                                        margin: const EdgeInsets.only(top: 6, bottom: 2),
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                                        decoration: BoxDecoration(
                                          color: isGuru ? const Color(0xFFFFF7ED) : const Color(0xFFF0FDF4),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(
                                            color: isGuru ? const Color(0xFFFDBA74) : const Color(0xFFBBF7D0),
                                            width: 0.8,
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              isGuru ? Icons.person_pin_rounded : Icons.admin_panel_settings_rounded,
                                              size: 13,
                                              color: isGuru ? const Color(0xFFC2410C) : const Color(0xFF15803D),
                                            ),
                                            const SizedBox(width: 5),
                                            Text(
                                              'Shared by: $senderName ($senderRole)',
                                              style: TextStyle(
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.bold,
                                                color: isGuru ? const Color(0xFF9A3412) : const Color(0xFF166534),
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),

                                  const SizedBox(height: 12),

                                  // ===========================================
                                  // CLEAR DUAL DATES DISPLAY: EVENT DATE & UPLOAD DATE
                                  // ===========================================
                                  Row(
                                    children: [
                                      // Event Date
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFF9FB),
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(color: const Color(0xFFF0D5E4)),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  const Icon(Icons.event_available_rounded, size: 13, color: LaasyaColors.primary),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    'Event Date',
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                      color: Colors.grey.shade600,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 3),
                                              Text(
                                                eventDateFormatted,
                                                style: const TextStyle(
                                                  fontSize: 12.5,
                                                  fontWeight: FontWeight.bold,
                                                  color: LaasyaColors.textDark,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      // Upload Date
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF3FAF7),
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(color: const Color(0xFFC7EBD9)),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Row(
                                                children: [
                                                  Icon(Icons.cloud_upload_rounded, size: 13, color: Color(0xFF03543F)),
                                                  SizedBox(width: 4),
                                                  Text(
                                                    'Upload Date',
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                      color: Color(0xFF03543F),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 3),
                                              Text(
                                                uploadDateFormatted,
                                                style: const TextStyle(
                                                  fontSize: 12.5,
                                                  fontWeight: FontWeight.bold,
                                                  color: Color(0xFF03543F),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 14),
                                  const Divider(height: 1),
                                  const SizedBox(height: 12),

                                  // ===========================================
                                  // BUTTONS: "DETAILS" (OPENS DEDICATED PAGE) & "OPEN IN DRIVE" (DIRECT REDIRECT)
                                  // ===========================================
                                  Row(
                                    children: [
                                      // Details Button: Navigates to dedicated EventFolderDetailsScreen
                                      Expanded(
                                        child: OutlinedButton.icon(
                                          onPressed: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => EventFolderDetailsScreen(folder: item),
                                              ),
                                            );
                                          },
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: LaasyaColors.primary,
                                            side: const BorderSide(color: Color(0xFFF0D5E4), width: 1.2),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                          ),
                                          icon: const Icon(Icons.info_outline_rounded, size: 15),
                                          label: const Text(
                                            'Details',
                                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      // Open Button: Opens media options (Drive / YouTube)
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: () => _openMediaOptions(item),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF590231),
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            elevation: 1,
                                          ),
                                          icon: const Icon(Icons.open_in_new_rounded, size: 15, color: LaasyaColors.accentGold),
                                          label: const Text(
                                            'Open',
                                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _tabButton({
    required String title,
    required int count,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? LaasyaColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: TextStyle(
                color: isSelected ? Colors.white : LaasyaColors.textDark,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                fontSize: 12,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withOpacity(0.25) : const Color(0xFFF3E8EE),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: isSelected ? Colors.white : LaasyaColors.primary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

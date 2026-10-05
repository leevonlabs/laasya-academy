import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import 'event_folder_details_screen.dart';

class StudentVideoLibraryScreen extends StatefulWidget {
  final String? studentCourse;
  final String? studentBatch;

  const StudentVideoLibraryScreen({
    super.key,
    this.studentCourse,
    this.studentBatch,
  });

  @override
  State<StudentVideoLibraryScreen> createState() => _StudentVideoLibraryScreenState();
}

class _StudentVideoLibraryScreenState extends State<StudentVideoLibraryScreen> {
  List<Map<String, dynamic>> _folders = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _activeTab = 'my_course'; // 'my_course' or 'all'

  // Standard Website Date Range Filter State
  // Default to This Month (October 2026 - Academic calendar active month)
  String _activePreset = 'This Month';
  DateTime? _startDate = DateTime(2026, 10, 1);
  DateTime? _endDate = DateTime(2026, 10, 31, 23, 59, 59);
  String _displayMonthYear = 'October 2026';

  @override
  void initState() {
    super.initState();
    _loadEventFolders();
  }

  Future<void> _loadEventFolders() async {
    setState(() => _isLoading = true);
    final data = await SupabaseService().getStudentEventFolders(
      courseTitle: widget.studentCourse,
      batchName: widget.studentBatch,
    );
    if (mounted) {
      setState(() {
        _folders = data;
        _isLoading = false;
      });
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

  // Standard preset switcher
  void _applyPreset(String preset) {
    final now = DateTime(2026, 10, 5); // Reference calendar anchor
    DateTime? sDate;
    DateTime? eDate;
    String monthYear = 'October 2026';

    switch (preset) {
      case 'This Month':
        sDate = DateTime(2026, 10, 1);
        eDate = DateTime(2026, 10, 31, 23, 59, 59);
        monthYear = 'October 2026';
        break;
      case 'Last Month':
        sDate = DateTime(2026, 9, 1);
        eDate = DateTime(2026, 9, 30, 23, 59, 59);
        monthYear = 'September 2026';
        break;
      case 'Last 30 Days':
        sDate = now.subtract(const Duration(days: 30));
        eDate = now;
        monthYear = 'Sep - Oct 2026';
        break;
      case 'Last 7 Days':
        sDate = now.subtract(const Duration(days: 7));
        eDate = now;
        monthYear = 'Oct 2026 (Last 7 Days)';
        break;
      case 'All Time':
        sDate = null;
        eDate = null;
        monthYear = 'All Time Archive';
        break;
      default:
        break;
    }

    setState(() {
      _activePreset = preset;
      _startDate = sDate;
      _endDate = eDate;
      _displayMonthYear = monthYear;
    });
  }

  // Standard Date Range Filter Sheet matching website & student attendance
  void _openDateFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
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
                    'Select Upload Period',
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
                'Filter event videos by their publishing/upload date',
                style: TextStyle(fontSize: 12, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 12),

              _presetTile(
                ctx,
                label: 'This Month (October 2026)',
                presetKey: 'This Month',
                badgeText: 'Default',
              ),
              _presetTile(
                ctx,
                label: 'Last Month (September 2026)',
                presetKey: 'Last Month',
              ),
              _presetTile(
                ctx,
                label: 'Last 30 Days',
                presetKey: 'Last 30 Days',
              ),
              _presetTile(
                ctx,
                label: 'Last 7 Days',
                presetKey: 'Last 7 Days',
              ),
              _presetTile(
                ctx,
                label: 'All Time (Full Video Archive)',
                presetKey: 'All Time',
              ),

              const SizedBox(height: 10),
              // Custom Date Range Picker
              OutlinedButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  final picked = await showDateRangePicker(
                    context: context,
                    firstDate: DateTime(2025, 1, 1),
                    lastDate: DateTime(2027, 12, 31),
                    initialDateRange: _startDate != null && _endDate != null
                        ? DateTimeRange(start: _startDate!, end: _endDate!)
                        : DateTimeRange(start: DateTime(2026, 10, 1), end: DateTime(2026, 10, 31)),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: const ColorScheme.light(
                            primary: LaasyaColors.primary,
                            onPrimary: Colors.white,
                            onSurface: LaasyaColors.textDark,
                          ),
                        ),
                        child: child!,
                      );
                    },
                  );

                  if (picked != null) {
                    setState(() {
                      _activePreset = 'Custom';
                      _startDate = picked.start;
                      _endDate = picked.end.add(const Duration(hours: 23, minutes: 59, seconds: 59));
                      _displayMonthYear = '${picked.start.day}/${picked.start.month}/${picked.start.year} - ${picked.end.day}/${picked.end.month}/${picked.end.year}';
                    });
                  }
                },
                icon: const Icon(Icons.date_range_rounded, size: 18),
                label: const Text('Custom Date Range...'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: LaasyaColors.primary,
                  side: const BorderSide(color: Color(0xFFF0D5E4)),
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _presetTile(
    BuildContext ctx, {
    required String label,
    required String presetKey,
    String? badgeText,
  }) {
    final isSelected = _activePreset == presetKey;
    return InkWell(
      onTap: () {
        Navigator.pop(ctx);
        _applyPreset(presetKey);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFF2F8) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? LaasyaColors.primary : Colors.grey.shade200,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
              color: isSelected ? LaasyaColors.primary : Colors.grey,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? LaasyaColors.primary : LaasyaColors.textDark,
                ),
              ),
            ),
            if (badgeText != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFDEF7EC),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badgeText,
                  style: const TextStyle(
                    color: Color(0xFF03543F),
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

  // Direct redirection to Google Drive URL via url_launcher
  Future<void> _openDriveUrlDirectly(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No Google Drive link available')),
      );
      return;
    }

    try {
      final uri = Uri.parse(cleanUrl);
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(uri);
      }
    } catch (e) {
      // Fallback: copy to clipboard
      await Clipboard.setData(ClipboardData(text: cleanUrl));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Drive link copied: $cleanUrl'),
            backgroundColor: LaasyaColors.primary,
          ),
        );
      }
    }
  }

  bool _matchesCourse(Map<String, dynamic> item) {
    final studentCourse = (widget.studentCourse ?? 'Bharathanatyam').toLowerCase().trim();
    final access = (item['access_level'] ?? '').toString().toLowerCase();
    if (access == 'all students' || access.contains('all')) return true;

    final itemCourse = (item['target_course_title'] ?? '').toString().toLowerCase().trim();
    if (itemCourse.contains(studentCourse) || studentCourse.contains(itemCourse)) {
      return true;
    }

    final tc = item['target_courses'];
    if (tc is List) {
      for (var c in tc) {
        final cTitle = (c is Map ? c['title'] : c).toString().toLowerCase();
        if (cTitle.contains(studentCourse) || studentCourse.contains(cTitle)) {
          return true;
        }
      }
    }

    if (itemCourse.isEmpty) return true;
    return false;
  }

  // Check upload date matches selected date range
  bool _matchesUploadDate(Map<String, dynamic> item) {
    if (_startDate == null && _endDate == null) return true;
    final itemDate = _getUploadDate(item);
    if (itemDate == null) return true;

    if (_startDate != null) {
      final startDay = DateTime(_startDate!.year, _startDate!.month, _startDate!.day);
      final itemDay = DateTime(itemDate.year, itemDate.month, itemDate.day);
      if (itemDay.isBefore(startDay)) return false;
    }

    if (_endDate != null) {
      final endDay = DateTime(_endDate!.year, _endDate!.month, _endDate!.day, 23, 59, 59);
      if (itemDate.isAfter(endDay)) return false;
    }

    return true;
  }

  @override
  Widget build(BuildContext context) {
    final currentCourseName = widget.studentCourse ?? 'Bharathanatyam';

    final myCourseFolders = _folders.where(_matchesCourse).toList();
    final basePool = _activeTab == 'my_course' ? myCourseFolders : _folders;

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
            const Text(
              'Event Video Library',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Enrolled: $currentCourseName',
              style: const TextStyle(fontSize: 11, color: LaasyaColors.accentGold),
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
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF2F8),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFF0D5E4)),
                            ),
                            child: const Icon(
                              Icons.calendar_month_rounded,
                              color: LaasyaColors.primary,
                              size: 22,
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
                                      'ACTIVE MONTH & YEAR',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        letterSpacing: 0.8,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF8A064D),
                                      ),
                                    ),
                                    if (_activePreset == 'This Month') ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDEF7EC),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'DEFAULT',
                                          style: TextStyle(
                                            fontSize: 8.5,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF03543F),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  _displayMonthYear,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: LaasyaColors.textDark,
                                  ),
                                ),
                                const SizedBox(height: 1),
                                const Text(
                                  'Videos filtered by upload date',
                                  style: TextStyle(fontSize: 10.5, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          // Date Filter Selector Button
                          InkWell(
                            onTap: _openDateFilterSheet,
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                              decoration: BoxDecoration(
                                color: const Color(0xFF590231),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.tune_rounded, color: LaasyaColors.accentGold, size: 14),
                                  const SizedBox(width: 5),
                                  Text(
                                    _activePreset,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(width: 2),
                                  const Icon(Icons.arrow_drop_down, color: Colors.white70, size: 16),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // =========================================================
                    // 2. SEGMENTED TABS: MY ENROLLED COURSE vs ALL ACADEMY
                    // =========================================================
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
                              count: _folders.where(_matchesUploadDate).length,
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
                          _activeTab == 'my_course'
                              ? 'Shoot Folders for $currentCourseName (${displayedList.length})'
                              : 'All Academy Shoot Folders (${displayedList.length})',
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.bold,
                            color: LaasyaColors.textDark,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDEF7EC),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.cloud_done_rounded, size: 12, color: Color(0xFF03543F)),
                              SizedBox(width: 4),
                              Text(
                                'Drive Links',
                                style: TextStyle(
                                  color: Color(0xFF03543F),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
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
                              _activePreset == 'This Month'
                                  ? 'Only this month\'s videos are displayed by default. Tap "All Time" to explore older event recordings.'
                                  : 'Try adjusting your date range filter or search keyword.',
                              style: const TextStyle(fontSize: 11.5, color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                            if (_activePreset != 'All Time') ...[
                              const SizedBox(height: 14),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: LaasyaColors.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                                ),
                                onPressed: () => _applyPreset('All Time'),
                                icon: const Icon(Icons.history_rounded, size: 15),
                                label: const Text('View All Time Archive', style: TextStyle(fontSize: 12)),
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
                          final batch = (item['target_batch_name'] ?? 'All Batches').toString();
                          final eventDateRaw = item['event_date'];
                          final uploadDateRaw = item['created_at'] ?? item['event_date'];
                          final driveUrl = (item['drive_url'] ?? '').toString();

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
                                  // Top Tags Row
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDEF7EC),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.folder_shared_rounded, size: 12, color: Color(0xFF03543F)),
                                            SizedBox(width: 4),
                                            Text(
                                              'EVENT FOLDER',
                                              style: TextStyle(
                                                color: Color(0xFF03543F),
                                                fontSize: 9.5,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFF2F8),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: const Color(0xFFF0D5E4)),
                                        ),
                                        child: Text(
                                          '$course • $batch',
                                          style: const TextStyle(
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w600,
                                            color: LaasyaColors.primary,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 10),

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
                                      // Open in Drive Button: Directly redirects to Google Drive URL
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: () => _openDriveUrlDirectly(driveUrl),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF590231),
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            elevation: 1,
                                          ),
                                          icon: const Icon(Icons.open_in_new_rounded, size: 15, color: LaasyaColors.accentGold),
                                          label: const Text(
                                            'Open in Drive',
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

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import 'trainer_create_share_video_screen.dart';

class TrainerShareVideoScreen extends StatefulWidget {
  final Map<String, dynamic>? trainerProfile;

  const TrainerShareVideoScreen({
    super.key,
    this.trainerProfile,
  });

  @override
  State<TrainerShareVideoScreen> createState() => _TrainerShareVideoScreenState();
}

class _TrainerShareVideoScreenState extends State<TrainerShareVideoScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _mySharedItems = [];
  List<Map<String, dynamic>> _myCourses = [];
  List<Map<String, dynamic>> _myBatches = [];

  // Active tab: 'performance' or 'shared'
  String _activeTab = 'performance';

  // Sub tab for Performance: 'pending' or 'success'
  String _perfSubTab = 'pending';

  // Filters for Performance tab
  String _perfCourseFilter = 'all';
  String _perfBatchFilter = 'all';
  final Set<String> _perfSelectedStudentIds = {};
  String _perfSearchQuery = '';

  // Filters for Shared tab
  String _sharedMonthFilter = 'all'; // 'all' or '1'..'12'
  String _sharedYearFilter = 'all';  // 'all' or '2026', etc.
  String _sharedBatchFilter = 'all';
  String _sharedSearchQuery = '';

  String get _trainerName =>
      widget.trainerProfile?['full_name'] ?? 'Faculty Guru';
  String get _trainerPhone =>
      widget.trainerProfile?['phone'] ?? '';
  String get _trainerId =>
      widget.trainerProfile?['id'] ?? '';

  static const List<String> _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  String get _currentMonthName {
    final now = DateTime.now();
    return '${_monthNames[now.month - 1]} ${now.year}';
  }

  @override
  void initState() {
    super.initState();
    // Default shared month & year to current month
    final now = DateTime.now();
    _sharedMonthFilter = now.month.toString();
    _sharedYearFilter = now.year.toString();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    await Future.wait([
      _loadTrainerBatches(),
      _loadSharedVideos(),
    ]);
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadTrainerBatches() async {
    try {
      final nameParam = Uri.encodeComponent(_trainerName);
      final phoneParam = Uri.encodeComponent(_trainerPhone);
      final idParam = Uri.encodeComponent(_trainerId);
      final uri = Uri.parse(
        '${ApiConstants.baseUrl}/api/trainer/batches?trainerId=$idParam&trainerName=$nameParam&phone=$phoneParam',
      );
      final res = await http.get(uri).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          _myCourses = List<Map<String, dynamic>>.from(data['courses'] ?? []);
          _myBatches = List<Map<String, dynamic>>.from(data['batches'] ?? []);
        }
      }
    } catch (e) {
      debugPrint('Error loading trainer batches: $e');
    }
  }

  Future<void> _loadSharedVideos() async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/video-library');
      final res = await http.get(uri).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['items'] is List) {
          final all = List<Map<String, dynamic>>.from(data['items']);
          final tName = _trainerName.toLowerCase();
          _mySharedItems = all.where((item) {
            final sharedBy = (item['shared_by_type'] ?? '').toString();
            final itemTrainer = (item['trainer_name'] ?? item['created_by'] ?? '').toString().toLowerCase();
            final trId = (item['trainer_id'] ?? '').toString();

            if (sharedBy == 'guru' && (itemTrainer.contains(tName) || tName.contains(itemTrainer))) {
              return true;
            }
            if (_trainerId.isNotEmpty && trId == _trainerId) {
              return true;
            }
            return false;
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Error loading shared videos: $e');
    }
  }

  // --- MULTI-BATCH PENDING COMPUTATION ---
  // A student can be enrolled in multiple batches. They must receive at least 1 video for EACH batch in the current month!
  // If a student is enrolled in 2 batches but only received 1, they remain in [Pending].
  List<Map<String, dynamic>> _computeStudentComplianceList() {
    final now = DateTime.now();

    // 1. Gather this month's performance videos
    final thisMonthPerfVideos = _mySharedItems.where((item) {
      final cat = (item['category'] ?? '').toString().toLowerCase();
      if (cat != 'performance' && cat != 'student_performance') return false;
      final dateVal = item['event_date'] ?? item['created_at'];
      if (dateVal == null) return false;
      try {
        final dt = DateTime.parse(
          dateVal.toString().contains('T') ? dateVal.toString() : '${dateVal.toString()} 00:00:00',
        );
        return dt.month == now.month && dt.year == now.year;
      } catch (_) {
        return false;
      }
    }).toList();

    // 2. Map all assigned students with all their enrolled batches
    final Map<String, Map<String, dynamic>> studentMap = {};
    for (final b in _myBatches) {
      final students = b['students'];
      if (students is List) {
        for (final s in students) {
          if (s is Map && s['id'] != null) {
            final sId = s['id'].toString();
            if (!studentMap.containsKey(sId)) {
              studentMap[sId] = {
                'id': sId,
                'name': s['name'] ?? s['full_name'] ?? 'Student',
                'roll_number': s['roll_number'] ?? s['roll'] ?? '',
                'avatar_url': s['avatar_url'],
                'phone': s['phone'],
                'batches': <Map<String, dynamic>>[],
              };
            }
            final bList = studentMap[sId]!['batches'] as List<Map<String, dynamic>>;
            final bId = b['id'].toString();
            if (!bList.any((existing) => existing['id'].toString() == bId)) {
              bList.add({
                'id': bId,
                'name': b['name'] ?? 'Batch',
                'course_id': b['course_id']?.toString(),
                'course_title': b['course_title'] ?? 'Course',
              });
            }
          }
        }
      }
    }

    // 3. For each student, check which batches are covered
    final List<Map<String, dynamic>> result = [];
    for (final s in studentMap.values) {
      final sId = s['id'].toString();
      final enrolledBatches = s['batches'] as List<Map<String, dynamic>>;

      final List<Map<String, dynamic>> pendingBatches = [];
      final List<Map<String, dynamic>> completedBatches = [];

      for (final batch in enrolledBatches) {
        final batchId = batch['id'].toString();
        // Check if there is any performance video for this student in this batch this month
        final isCovered = thisMonthPerfVideos.any((v) {
          final targetStudentId = v['target_student_id']?.toString();
          bool matchesStudent = targetStudentId == sId;
          if (!matchesStudent && v['target_students'] is List) {
            matchesStudent = (v['target_students'] as List).any((ts) => ts is Map && ts['id']?.toString() == sId);
          }
          if (!matchesStudent) return false;

          final vBatchId = v['target_batch_id']?.toString();
          // Matches if video was batch-specific for this batch or course-wide/all batches
          return vBatchId == null || vBatchId == 'all' || vBatchId == batchId;
        });

        if (isCovered) {
          completedBatches.add(batch);
        } else {
          pendingBatches.add(batch);
        }
      }

      final isPending = pendingBatches.isNotEmpty;
      result.add({
        ...s,
        'is_pending': isPending,
        'pending_batches': pendingBatches,
        'completed_batches': completedBatches,
        'total_batches_count': enrolledBatches.length,
      });
    }

    return result;
  }

  // Pending students for current month
  List<Map<String, dynamic>> get _pendingStudentsThisMonth {
    return _computeStudentComplianceList().where((s) => s['is_pending'] == true).toList();
  }

  // Success students for current month (completed for all enrolled batches)
  List<Map<String, dynamic>> get _successStudentsThisMonth {
    return _computeStudentComplianceList().where((s) => s['is_pending'] == false).toList();
  }

  // Filtered performance students based on sub-tab (pending vs success), course, batch, student multi-select, and search bar
  List<Map<String, dynamic>> get _filteredPerformanceStudents {
    final baseList = _perfSubTab == 'pending' ? _pendingStudentsThisMonth : _successStudentsThisMonth;
    return baseList.where((s) {
      // 1. Course Filter
      if (_perfCourseFilter != 'all') {
        final batches = s['batches'] as List<Map<String, dynamic>>;
        final inCourse = batches.any((b) => b['course_id'] == _perfCourseFilter);
        if (!inCourse) return false;
      }

      // 2. Batch Filter
      if (_perfBatchFilter != 'all') {
        final batches = s['batches'] as List<Map<String, dynamic>>;
        final inBatch = batches.any((b) => b['id'] == _perfBatchFilter);
        if (!inBatch) return false;
      }

      // 3. Multi-selection student filter
      if (_perfSelectedStudentIds.isNotEmpty) {
        if (!_perfSelectedStudentIds.contains(s['id'].toString())) {
          return false;
        }
      }

      // 4. Search bar (name or roll)
      if (_perfSearchQuery.trim().isNotEmpty) {
        final q = _perfSearchQuery.toLowerCase().trim();
        final name = (s['name'] ?? '').toString().toLowerCase();
        final roll = (s['roll_number'] ?? '').toString().toLowerCase();
        final phone = (s['phone'] ?? '').toString().toLowerCase();
        final batches = s['batches'] as List<Map<String, dynamic>>;
        final matchBatch = batches.any((b) => (b['name'] ?? '').toString().toLowerCase().contains(q));
        if (!name.contains(q) && !roll.contains(q) && !phone.contains(q) && !matchBatch) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  // Filtered shared videos
  List<Map<String, dynamic>> get _filteredSharedVideos {
    return _mySharedItems.where((item) {
      // 1. Month filter
      if (_sharedMonthFilter != 'all') {
        final dateVal = item['event_date'] ?? item['created_at'];
        if (dateVal != null) {
          try {
            final dt = DateTime.parse(
              dateVal.toString().contains('T') ? dateVal.toString() : '${dateVal.toString()} 00:00:00',
            );
            if (dt.month.toString() != _sharedMonthFilter) return false;
          } catch (_) {
            return false;
          }
        }
      }

      // 2. Year filter
      if (_sharedYearFilter != 'all') {
        final dateVal = item['event_date'] ?? item['created_at'];
        if (dateVal != null) {
          try {
            final dt = DateTime.parse(
              dateVal.toString().contains('T') ? dateVal.toString() : '${dateVal.toString()} 00:00:00',
            );
            if (dt.year.toString() != _sharedYearFilter) return false;
          } catch (_) {
            return false;
          }
        }
      }

      // 3. Batch filter
      if (_sharedBatchFilter != 'all') {
        final bId = item['target_batch_id']?.toString();
        if (bId != _sharedBatchFilter) return false;
      }

      // 5. Search bar
      if (_sharedSearchQuery.trim().isNotEmpty) {
        final q = _sharedSearchQuery.toLowerCase().trim();
        final title = (item['title'] ?? '').toString().toLowerCase();
        final desc = (item['description'] ?? '').toString().toLowerCase();
        final course = (item['target_course_title'] ?? '').toString().toLowerCase();
        final batch = (item['target_batch_name'] ?? '').toString().toLowerCase();
        final student = (item['target_student_name'] ?? '').toString().toLowerCase();
        if (!title.contains(q) && !desc.contains(q) && !course.contains(q) && !batch.contains(q) && !student.contains(q)) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  // --- ACTIONS ---

  // Opens form for a specific student (pending or success)
  Future<void> _shareForStudent(Map<String, dynamic> student) async {
    final pendingBatches = student['pending_batches'] as List<Map<String, dynamic>>? ?? [];
    final allBatches = student['batches'] as List<Map<String, dynamic>>? ?? [];
    final targetBatch = pendingBatches.isNotEmpty
        ? pendingBatches.first
        : (allBatches.isNotEmpty ? allBatches.first : null);

    final studentDataForForm = {
      'id': student['id'],
      'name': student['name'],
      'roll_number': student['roll_number'],
      'phone': student['phone'],
      'batch_name': targetBatch?['name'] ?? '',
      'course_title': targetBatch?['course_title'] ?? '',
    };

    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => TrainerCreateShareVideoScreen(
          trainerProfile: widget.trainerProfile,
          initialCourses: _myCourses,
          initialBatches: _myBatches,
          preselectedStudent: studentDataForForm,
          preselectedCourseId: targetBatch?['course_id'],
          preselectedBatchId: targetBatch?['id'],
        ),
      ),
    );

    if (result == true && mounted) {
      _loadData();
    }
  }

  // Opens form for General Video Share (via top button)
  Future<void> _openGeneralShare() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => TrainerCreateShareVideoScreen(
          trainerProfile: widget.trainerProfile,
          initialCourses: _myCourses,
          initialBatches: _myBatches,
          isGeneralShare: true,
        ),
      ),
    );

    if (result == true && mounted) {
      _loadData();
    }
  }

  // Opens prefilled form to View Details, Edit or Delete
  Future<void> _openDetails(Map<String, dynamic> item) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => TrainerCreateShareVideoScreen(
          trainerProfile: widget.trainerProfile,
          initialCourses: _myCourses,
          initialBatches: _myBatches,
          editingItem: item,
        ),
      ),
    );

    if (result == true && mounted) {
      _loadData();
    }
  }

  // Single button Month & Year picker modal for Shared Videos page
  void _openMonthYearPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        String tempMonth = _sharedMonthFilter;
        String tempYear = _sharedYearFilter;
        return StatefulBuilder(
          builder: (sheetCtx, setSheetState) {
            return Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Filter Month & Year',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF2D041A)),
                      ),
                      TextButton(
                        onPressed: () {
                          setSheetState(() {
                            tempMonth = 'all';
                            tempYear = 'all';
                          });
                        },
                        child: const Text('Reset to All', style: TextStyle(color: Color(0xFF8A064D), fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: tempMonth,
                          decoration: InputDecoration(
                            labelText: 'Month',
                            labelStyle: const TextStyle(fontSize: 12),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          items: [
                            const DropdownMenuItem(value: 'all', child: Text('All Months', style: TextStyle(fontSize: 13))),
                            ...List.generate(12, (i) => DropdownMenuItem(
                              value: (i + 1).toString(),
                              child: Text(_monthNames[i], style: const TextStyle(fontSize: 13)),
                            )),
                          ],
                          onChanged: (val) {
                            if (val != null) setSheetState(() => tempMonth = val);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: tempYear,
                          decoration: InputDecoration(
                            labelText: 'Year',
                            labelStyle: const TextStyle(fontSize: 12),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'all', child: Text('All Years', style: TextStyle(fontSize: 13))),
                            DropdownMenuItem(value: '2025', child: Text('2025', style: TextStyle(fontSize: 13))),
                            DropdownMenuItem(value: '2026', child: Text('2026', style: TextStyle(fontSize: 13))),
                            DropdownMenuItem(value: '2027', child: Text('2027', style: TextStyle(fontSize: 13))),
                          ],
                          onChanged: (val) {
                            if (val != null) setSheetState(() => tempYear = val);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF590231),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        setState(() {
                          _sharedMonthFilter = tempMonth;
                          _sharedYearFilter = tempYear;
                        });
                        Navigator.pop(sheetCtx);
                      },
                      child: const Text('Apply Filter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String get _sharedMonthYearLabel {
    if (_sharedMonthFilter == 'all' && _sharedYearFilter == 'all') {
      return 'All Time';
    }
    if (_sharedMonthFilter != 'all' && _sharedYearFilter != 'all') {
      final mIdx = int.tryParse(_sharedMonthFilter);
      final mName = (mIdx != null && mIdx >= 1 && mIdx <= 12) ? _monthNames[mIdx - 1].substring(0, 3) : '';
      return '$mName $_sharedYearFilter';
    }
    if (_sharedMonthFilter != 'all') {
      final mIdx = int.tryParse(_sharedMonthFilter);
      return (mIdx != null && mIdx >= 1 && mIdx <= 12) ? _monthNames[mIdx - 1] : 'Month';
    }
    return _sharedYearFilter;
  }

  // Modal to select multiple students searchably (cascading with course & batch filter)
  void _openStudentFilterModal() {
    final baseList = _perfSubTab == 'pending' ? _pendingStudentsThisMonth : _successStudentsThisMonth;
    final candidates = baseList.where((s) {
      if (_perfCourseFilter != 'all') {
        final batches = s['batches'] as List<Map<String, dynamic>>;
        if (!batches.any((b) => b['course_id'] == _perfCourseFilter)) return false;
      }
      if (_perfBatchFilter != 'all') {
        final batches = s['batches'] as List<Map<String, dynamic>>;
        if (!batches.any((b) => b['id'] == _perfBatchFilter)) return false;
      }
      return true;
    }).toList();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        String modalSearch = '';
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            final filtered = candidates.where((s) {
              if (modalSearch.isEmpty) return true;
              final q = modalSearch.toLowerCase();
              final name = (s['name'] ?? '').toString().toLowerCase();
              final roll = (s['roll_number'] ?? '').toString().toLowerCase();
              return name.contains(q) || roll.contains(q);
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(top: 10, bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),

                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Filter by Students',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2D041A),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            setModalState(() {
                              _perfSelectedStudentIds.clear();
                            });
                            setState(() {});
                          },
                          child: const Text('Clear Filter', style: TextStyle(color: Color(0xFF8A064D))),
                        ),
                      ],
                    ),
                  ),

                  // Search Box
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                    child: TextField(
                      onChanged: (val) => setModalState(() => modalSearch = val),
                      decoration: InputDecoration(
                        hintText: 'Search student name or roll...',
                        prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Colors.grey),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade200),
                        ),
                      ),
                    ),
                  ),

                  // Student list with checkboxes
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade100),
                      itemBuilder: (ctx, idx) {
                        final stu = filtered[idx];
                        final sId = stu['id'].toString();
                        final isChecked = _perfSelectedStudentIds.contains(sId);
                        final sName = stu['name'] ?? 'Student';
                        final sRoll = stu['roll_number'] ?? '';
                        final isPending = stu['is_pending'] == true;

                        return CheckboxListTile(
                          value: isChecked,
                          activeColor: const Color(0xFF590231),
                          dense: true,
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  sName,
                                  style: TextStyle(
                                    fontWeight: isChecked ? FontWeight.bold : FontWeight.w600,
                                    color: const Color(0xFF1E1E1E),
                                  ),
                                ),
                              ),
                              if (isPending)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade50,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: Colors.red.shade200),
                                  ),
                                  child: Text(
                                    'Pending',
                                    style: TextStyle(
                                      color: Colors.red.shade700,
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          subtitle: sRoll.isNotEmpty ? Text('Roll: $sRoll', style: const TextStyle(fontSize: 11)) : null,
                          onChanged: (val) {
                            setModalState(() {
                              if (val == true) {
                                _perfSelectedStudentIds.add(sId);
                              } else {
                                _perfSelectedStudentIds.remove(sId);
                              }
                            });
                            setState(() {});
                          },
                        );
                      },
                    ),
                  ),

                  // Bottom Apply Button
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF590231),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => Navigator.pop(modalCtx),
                        child: Text(
                          _perfSelectedStudentIds.isEmpty
                              ? 'Show All Students'
                              : 'Apply (${_perfSelectedStudentIds.length} Selected)',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _launchExternalUrl(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) return;
    try {
      final uri = Uri.parse(cleanUrl);
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) await launchUrl(uri);
    } catch (_) {
      Clipboard.setData(ClipboardData(text: cleanUrl));
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

  String _formatDate(dynamic dateVal) {
    if (dateVal == null) return '--';
    final s = dateVal.toString();
    if (s.isEmpty) return '--';
    try {
      final dt = DateTime.parse(s.contains('T') ? s : '$s 00:00:00');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${dt.day.toString().padLeft(2, '0')} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return s;
    }
  }

  @override
  Widget build(BuildContext context) {
    final allAssigned = _computeStudentComplianceList();
    final totalStudents = allAssigned.length;
    final pendingCount = _pendingStudentsThisMonth.length;
    final completedCount = totalStudents - pendingCount;
    final double complianceRate = totalStudents > 0 ? (completedCount / totalStudents) : 1.0;
    final int compliancePercent = (complianceRate * 100).round();

    final filteredPerformance = _filteredPerformanceStudents;
    final filteredShared = _filteredSharedVideos;

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
              'Share Video',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Guru Media Share • $_trainerName',
              style: const TextStyle(fontSize: 11, color: LaasyaColors.accentGold),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : RefreshIndicator(
              onRefresh: _loadData,
              color: LaasyaColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // TOP BANNER WITH CURRENT MONTH NAME & QUICK GENERAL SHARE BUTTON
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2D041A), Color(0xFF590231), Color(0xFF8A064D)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.12),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.stars_rounded, color: Color(0xFFF9E33A), size: 24),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '$_currentMonthName Performance',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 15.5,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    const Text(
                                      'Each student must receive at least 1 video for every enrolled batch',
                                      style: TextStyle(color: Colors.white70, fontSize: 10.5),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: pendingCount == 0
                                      ? const Color(0xFF03543F)
                                      : const Color(0xFFE02424),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  pendingCount == 0 ? '100% Done' : '$pendingCount Pending',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Progress Bar
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '$completedCount / $totalStudents Students Covered',
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '$compliancePercent%',
                                style: const TextStyle(color: Color(0xFFF9E33A), fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: complianceRate.clamp(0.0, 1.0),
                              minHeight: 8,
                              backgroundColor: Colors.white.withOpacity(0.2),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                pendingCount == 0 ? const Color(0xFF31C48D) : const Color(0xFFF9E33A),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Floating/Main Share New Video Link Button (General Video Share)
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _openGeneralShare,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFD4AF37),
                                foregroundColor: const Color(0xFF4A0025),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                elevation: 0,
                              ),
                              icon: const Icon(Icons.add_link_rounded, size: 18),
                              label: const Text(
                                '+ Share New Video Link',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // TAB SWITCHER: Performance vs Shared Videos
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFF0D5E4)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _activeTab = 'performance'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _activeTab == 'performance'
                                      ? (pendingCount > 0 ? const Color(0xFFE53E3E) : const Color(0xFF590231))
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      pendingCount > 0 ? Icons.error_outline_rounded : Icons.check_circle_rounded,
                                      size: 16,
                                      color: _activeTab == 'performance' ? Colors.white : Colors.grey.shade700,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Performance ($pendingCount)',
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.bold,
                                        color: _activeTab == 'performance' ? Colors.white : Colors.grey.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _activeTab = 'shared'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _activeTab == 'shared' ? const Color(0xFF590231) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.video_library_rounded,
                                      size: 16,
                                      color: _activeTab == 'shared' ? Colors.white : Colors.grey.shade700,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Shared Videos (${_mySharedItems.length})',
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.bold,
                                        color: _activeTab == 'shared' ? Colors.white : Colors.grey.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // ==============================================================
                    // TAB 1: PERFORMANCE (Pending vs Success Sub-Tabs)
                    // ==============================================================
                    if (_activeTab == 'performance') ...[
                      // Sub-tab Bar: Pending vs Success
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3E8EE),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            // Pending Sub-tab
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() {
                                  _perfSubTab = 'pending';
                                  _perfSelectedStudentIds.clear();
                                }),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: _perfSubTab == 'pending'
                                        ? const Color(0xFFE02424)
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(9),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.pending_actions_rounded,
                                        size: 15,
                                        color: _perfSubTab == 'pending' ? Colors.white : Colors.grey.shade700,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Pending ($pendingCount)',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: _perfSubTab == 'pending' ? Colors.white : Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),

                            // Success Sub-tab
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() {
                                  _perfSubTab = 'success';
                                  _perfSelectedStudentIds.clear();
                                }),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: _perfSubTab == 'success'
                                        ? const Color(0xFF047857)
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(9),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.check_circle_rounded,
                                        size: 15,
                                        color: _perfSubTab == 'success' ? Colors.white : Colors.grey.shade700,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Success ($completedCount)',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: _perfSubTab == 'success' ? Colors.white : Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Performance Filters Bar: Course, Batch, Student Multi-select (Cascaded)
                      Row(
                        children: [
                          // Course filter
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFE5D4DE)),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  isExpanded: true,
                                  value: _perfCourseFilter,
                                  items: [
                                    const DropdownMenuItem(value: 'all', child: Text('All Courses', style: TextStyle(fontSize: 11.5))),
                                    ..._myCourses.map((c) => DropdownMenuItem(
                                      value: c['id'].toString(),
                                      child: Text(c['title'] ?? 'Course', style: const TextStyle(fontSize: 11.5), overflow: TextOverflow.ellipsis),
                                    )),
                                  ],
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _perfCourseFilter = val;
                                        _perfBatchFilter = 'all';
                                        _perfSelectedStudentIds.clear();
                                      });
                                    }
                                  },
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Batch filter
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFE5D4DE)),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  isExpanded: true,
                                  value: _perfBatchFilter,
                                  items: [
                                    const DropdownMenuItem(value: 'all', child: Text('All Batches', style: TextStyle(fontSize: 11.5))),
                                    ..._myBatches
                                        .where((b) => _perfCourseFilter == 'all' || b['course_id']?.toString() == _perfCourseFilter)
                                        .map((b) => DropdownMenuItem(
                                          value: b['id'].toString(),
                                          child: Text(b['name'] ?? 'Batch', style: const TextStyle(fontSize: 11.5), overflow: TextOverflow.ellipsis),
                                        )),
                                  ],
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _perfBatchFilter = val;
                                        _perfSelectedStudentIds.clear();
                                      });
                                    }
                                  },
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Searchable Multi-selection Student Filter Button
                          InkWell(
                            onTap: _openStudentFilterModal,
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
                              decoration: BoxDecoration(
                                color: _perfSelectedStudentIds.isNotEmpty ? const Color(0xFF590231) : Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: _perfSelectedStudentIds.isNotEmpty ? const Color(0xFF590231) : const Color(0xFFE5D4DE),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.people_alt_rounded,
                                    size: 16,
                                    color: _perfSelectedStudentIds.isNotEmpty ? Colors.white : const Color(0xFF8A064D),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _perfSelectedStudentIds.isEmpty
                                        ? 'Students'
                                        : '${_perfSelectedStudentIds.length}',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.bold,
                                      color: _perfSelectedStudentIds.isNotEmpty ? Colors.white : const Color(0xFF8A064D),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Search bar
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: TextField(
                          onChanged: (val) => setState(() => _perfSearchQuery = val),
                          decoration: InputDecoration(
                            icon: const Icon(Icons.search_rounded, color: Colors.grey, size: 20),
                            border: InputBorder.none,
                            hintText: _perfSubTab == 'pending'
                                ? 'Search pending students by name or student ID...'
                                : 'Search completed students by name or student ID...',
                            hintStyle: const TextStyle(fontSize: 12.5, color: Colors.black38),
                            suffixIcon: _perfSearchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear_rounded, size: 18, color: Colors.grey),
                                    onPressed: () => setState(() => _perfSearchQuery = ''),
                                  )
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // List of Performance students (Pending or Success)
                      if (filteredPerformance.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(28),
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Center(
                            child: Text(
                              _perfSubTab == 'pending'
                                  ? 'No pending students match the selected filters.'
                                  : 'No success students match the selected filters.',
                              style: const TextStyle(fontSize: 13, color: Colors.grey),
                            ),
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: filteredPerformance.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, idx) {
                            final student = filteredPerformance[idx];
                            final name = (student['name'] ?? 'Student').toString();
                            final roll = (student['roll_number'] ?? student['roll'] ?? student['id'] ?? 'N/A').toString();
                            final avatarUrl = student['avatar_url']?.toString();
                            final initials = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'S';

                            final isPending = student['is_pending'] == true;
                            final pendingBatches = student['pending_batches'] as List<Map<String, dynamic>>? ?? [];
                            final completedBatches = student['completed_batches'] as List<Map<String, dynamic>>? ?? [];
                            final allBatches = student['batches'] as List<Map<String, dynamic>>? ?? [];

                            return Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isPending ? const Color(0xFFF8B4B4) : const Color(0xFFA7F3D0),
                                  width: 1.3,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.02),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  CircleAvatar(
                                    radius: 22,
                                    backgroundColor: isPending ? const Color(0xFFFFF2F8) : const Color(0xFFECFDF5),
                                    backgroundImage: (avatarUrl != null && avatarUrl.isNotEmpty)
                                        ? NetworkImage(avatarUrl)
                                        : null,
                                    child: (avatarUrl == null || avatarUrl.isEmpty)
                                        ? Text(
                                            initials,
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                              color: isPending ? const Color(0xFF8A064D) : const Color(0xFF047857),
                                            ),
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                name,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14.5,
                                                  color: Color(0xFF2D041A),
                                                ),
                                              ),
                                            ),
                                            // Red [Pending] or Green [Success] Status Badge on Top
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: isPending ? const Color(0xFFFDE8E8) : const Color(0xFFDEF7EC),
                                                borderRadius: BorderRadius.circular(6),
                                                border: Border.all(
                                                  color: isPending ? const Color(0xFFF8B4B4) : const Color(0xFF31C48D),
                                                ),
                                              ),
                                              child: Text(
                                                isPending ? '[Pending]' : '[Success]',
                                                style: TextStyle(
                                                  color: isPending ? const Color(0xFFE02424) : const Color(0xFF03543F),
                                                  fontSize: 10.5,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          'Student ID: $roll',
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            color: Colors.grey.shade700,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(height: 6),

                                        // Display batch badges beside names
                                        Wrap(
                                          spacing: 6,
                                          runSpacing: 4,
                                          children: isPending
                                              ? [
                                                  ...pendingBatches.map((b) => Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFFFF1F2),
                                                      borderRadius: BorderRadius.circular(6),
                                                      border: Border.all(color: const Color(0xFFFECDD3)),
                                                    ),
                                                    child: Text(
                                                      '${b['name']} (Missing)',
                                                      style: const TextStyle(
                                                        color: Color(0xFFBE123C),
                                                        fontSize: 10,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  )),
                                                  ...completedBatches.map((b) => Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFF0FDF4),
                                                      borderRadius: BorderRadius.circular(6),
                                                    ),
                                                    child: Text(
                                                      '${b['name']} (Done)',
                                                      style: const TextStyle(
                                                        color: Color(0xFF15803D),
                                                        fontSize: 10,
                                                      ),
                                                    ),
                                                  )),
                                                ]
                                              : allBatches.map((b) => Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFECFDF5),
                                                    borderRadius: BorderRadius.circular(6),
                                                    border: Border.all(color: const Color(0xFFA7F3D0)),
                                                  ),
                                                  child: Text(
                                                    '${b['name']} (Covered)',
                                                    style: const TextStyle(
                                                      color: Color(0xFF047857),
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                )).toList(),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),

                                  // Action Button Named just 'Share' (guru can send links to pending or success)
                                  ElevatedButton.icon(
                                    onPressed: () => _shareForStudent(student),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: isPending ? const Color(0xFF590231) : const Color(0xFF047857),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                    icon: const Icon(Icons.share_rounded, size: 14),
                                    label: const Text(
                                      'Share',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                    ],

                    // ==============================================================
                    // TAB 2: SHARED VIDEOS LIST
                    // ==============================================================
                    if (_activeTab == 'shared') ...[
                      // Shared Videos Filters: Standard Single-Button Month & Year Filter + Batch Filter
                      Row(
                        children: [
                          // Single-button Month & Year filter
                          Expanded(
                            flex: 3,
                            child: InkWell(
                              onTap: _openMonthYearPicker,
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFE5D4DE)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.calendar_month_rounded, size: 16, color: Color(0xFF8A064D)),
                                        const SizedBox(width: 6),
                                        Text(
                                          _sharedMonthYearLabel,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF2D041A),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const Icon(Icons.arrow_drop_down_rounded, size: 20, color: Colors.grey),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Batch Filter
                          Expanded(
                            flex: 3,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFE5D4DE)),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  isExpanded: true,
                                  value: _sharedBatchFilter,
                                  items: [
                                    const DropdownMenuItem(value: 'all', child: Text('All Batches', style: TextStyle(fontSize: 11.5))),
                                    ..._myBatches.map((b) => DropdownMenuItem(
                                      value: b['id'].toString(),
                                      child: Text(b['name'] ?? 'Batch', style: const TextStyle(fontSize: 11.5), overflow: TextOverflow.ellipsis),
                                    )),
                                  ],
                                  onChanged: (val) {
                                    if (val != null) setState(() => _sharedBatchFilter = val);
                                  },
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Search bar for Shared Videos
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: TextField(
                          onChanged: (val) => setState(() => _sharedSearchQuery = val),
                          decoration: InputDecoration(
                            icon: const Icon(Icons.search_rounded, color: Colors.grey, size: 20),
                            border: InputBorder.none,
                            hintText: 'Search video titles, students, batches...',
                            hintStyle: const TextStyle(fontSize: 12.5, color: Colors.black38),
                            suffixIcon: _sharedSearchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear_rounded, size: 18, color: Colors.grey),
                                    onPressed: () => setState(() => _sharedSearchQuery = ''),
                                  )
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Shared Videos Grid / List
                      if (filteredShared.isEmpty)
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
                              Icon(Icons.video_collection_outlined, size: 44, color: Colors.grey.shade400),
                              const SizedBox(height: 10),
                              const Text(
                                'No shared videos match the selected filters',
                                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Use the "+ Share New Video Link" button above to share videos with students.',
                                style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: filteredShared.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, idx) {
                            final item = filteredShared[idx];
                            final title = (item['title'] ?? 'Shared Video').toString();
                            final course = (item['target_course_title'] ?? 'Assigned Course').toString();
                            final batch = (item['target_batch_name'] ?? 'All Batches').toString();
                            final dateStr = _formatDate(item['event_date'] ?? item['created_at']);
                            final driveUrl = (item['drive_url'] ?? '').toString().trim();
                            final youtubeUrl = (item['youtube_url'] ?? '').toString().trim();
                            final targetStudentName = (item['target_student_name'] ?? '').toString();
                            final hasDrive = driveUrl.isNotEmpty;
                            final hasYoutube = youtubeUrl.isNotEmpty;

                            final cat = (item['category'] ?? '').toString().toLowerCase();
                            final isPerformance = cat == 'performance' || cat == 'student_performance';

                            // Boundary color: Green for Performance, Blue for General
                            final boundaryColor = isPerformance
                                ? const Color(0xFF10B981) // Emerald Green
                                : const Color(0xFF3B82F6); // Vibrant Blue

                            return Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: boundaryColor, width: 1.8),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.02),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Row 1: Student highlighted on top (Left) and Date on right-top
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        // Highlight student name on top (without text saying performance or general)
                                        if (isPerformance && targetStudentName.isNotEmpty)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFECFDF5),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFFA7F3D0)),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.person_pin_rounded, size: 14, color: Color(0xFF047857)),
                                                const SizedBox(width: 5),
                                                Text(
                                                  targetStudentName,
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    color: Color(0xFF047857),
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          )
                                        else
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFEFF6FF),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFFBFDBFE)),
                                            ),
                                            child: const Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.groups_rounded, size: 14, color: Color(0xFF1D4ED8)),
                                                SizedBox(width: 5),
                                                Text(
                                                  'All Students',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: Color(0xFF1D4ED8),
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),

                                        // Right top of the grid: Date
                                        Text(
                                          dateStr,
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),

                                    // Course and Batch below student name
                                    Text(
                                      '$course • $batch',
                                      style: const TextStyle(
                                        color: Color(0xFF8A064D),
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 6),

                                    // Title
                                    Text(
                                      title,
                                      style: const TextStyle(
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.bold,
                                        color: LaasyaColors.textDark,
                                      ),
                                    ),
                                    const SizedBox(height: 12),

                                    // Action Buttons: Open Drive / YouTube and "Details" button
                                    Row(
                                      children: [
                                        if (hasDrive) ...[
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () => _launchExternalUrl(driveUrl),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF03543F),
                                                foregroundColor: Colors.white,
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                                elevation: 0,
                                              ),
                                              icon: const Icon(Icons.open_in_new_rounded, size: 14),
                                              label: const Text('Drive', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                        ],
                                        if (hasYoutube) ...[
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () => _launchExternalUrl(youtubeUrl),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFFE53E3E),
                                                foregroundColor: Colors.white,
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                                elevation: 0,
                                              ),
                                              icon: const Icon(Icons.play_arrow_rounded, size: 15),
                                              label: const Text('YouTube', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                        ],

                                        // Details Button (Opens prefilled details view with Edit and Delete options)
                                        OutlinedButton.icon(
                                          onPressed: () => _openDetails(item),
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: const Color(0xFF590231),
                                            side: const BorderSide(color: Color(0xFF8A064D), width: 1.2),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                          ),
                                          icon: const Icon(Icons.tune_rounded, size: 14),
                                          label: const Text('Details', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }
}

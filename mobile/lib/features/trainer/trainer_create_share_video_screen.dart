import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/widgets/ai_enhance_bar.dart';

class TrainerCreateShareVideoScreen extends StatefulWidget {
  final Map<String, dynamic>? trainerProfile;
  final List<Map<String, dynamic>>? initialCourses;
  final List<Map<String, dynamic>>? initialBatches;
  final Map<String, dynamic>? preselectedStudent;
  final String? preselectedCourseId;
  final String? preselectedBatchId;
  final bool isGeneralShare;
  final Map<String, dynamic>? editingItem;

  const TrainerCreateShareVideoScreen({
    super.key,
    this.trainerProfile,
    this.initialCourses,
    this.initialBatches,
    this.preselectedStudent,
    this.preselectedCourseId,
    this.preselectedBatchId,
    this.isGeneralShare = false,
    this.editingItem,
  });

  @override
  State<TrainerCreateShareVideoScreen> createState() =>
      _TrainerCreateShareVideoScreenState();
}


class _TrainerCreateShareVideoScreenState
    extends State<TrainerCreateShareVideoScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;

  List<Map<String, dynamic>> _myCourses = [];
  List<Map<String, dynamic>> _myBatches = [];

  String? _selectedCourseId;
  String _selectedCourseTitle = '';
  String _selectedBatchOption = 'all'; // 'all' or batch.id
  String _selectedBatchName = 'All Batches in Course';

  // Video Type: 'performance' (Individual Student, monthly required) vs 'general' (Group/Batch)
  String _videoType = 'performance';

  // Student Multi-Select State
  List<Map<String, dynamic>> _availableStudents = [];
  final Set<String> _selectedStudentIds = {};
  final TextEditingController _studentSearchController = TextEditingController();
  String _studentFilterText = '';

  // Form Fields
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _dateController = TextEditingController(
    text: DateTime.now().toIso8601String().split('T')[0],
  );
  final TextEditingController _driveController = TextEditingController();
  final TextEditingController _youtubeController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  void _updateTitleForType() {
    if (_videoType == 'performance') {
      if (_selectedStudentIds.isNotEmpty) {
        final stu = _availableStudents.firstWhere(
          (s) => _selectedStudentIds.contains(s['id'].toString()),
          orElse: () => {},
        );
        if (stu.isNotEmpty) {
          final sName = stu['name'] ?? 'Student';
          _titleController.text = '$sName - Monthly Performance Video';
          return;
        }
      }
      _titleController.text = 'Student - Monthly Performance Video';
    } else {
      _titleController.text = '$_selectedBatchName - Choreography & Practice Video';
    }
  }

  String get _trainerName =>
      widget.trainerProfile?['full_name'] ?? 'Faculty Guru';
  String get _trainerPhone => widget.trainerProfile?['phone'] ?? '';
  String get _trainerId => widget.trainerProfile?['id'] ?? '';

  @override
  void initState() {
    super.initState();
    _initData();
  }

  @override
  void dispose() {
    _studentSearchController.dispose();
    _titleController.dispose();
    _dateController.dispose();
    _driveController.dispose();
    _youtubeController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    if (widget.initialCourses != null &&
        widget.initialCourses!.isNotEmpty &&
        widget.initialBatches != null &&
        widget.initialBatches!.isNotEmpty) {
      _myCourses = List<Map<String, dynamic>>.from(widget.initialCourses!);
      _myBatches = List<Map<String, dynamic>>.from(widget.initialBatches!);
      _setupDefaultSelection();
      setState(() => _isLoading = false);
    } else {
      await _loadTrainerBatches();
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadTrainerBatches() async {
    try {
      final nameParam = Uri.encodeComponent(_trainerName);
      final phoneParam = Uri.encodeComponent(_trainerPhone);
      final uri = Uri.parse(
        '${ApiConstants.baseUrl}/api/trainer/batches?trainerName=$nameParam&phone=$phoneParam',
      );
      final res = await http.get(uri).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          _myCourses = List<Map<String, dynamic>>.from(data['courses'] ?? []);
          _myBatches = List<Map<String, dynamic>>.from(data['batches'] ?? []);
          _setupDefaultSelection();
        }
      }
    } catch (e) {
      debugPrint('Error loading trainer batches: $e');
    }
  }

  String get _currentMonthName {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    final now = DateTime.now();
    return '${months[now.month - 1]} ${now.year}';
  }

  Future<void> _selectDate() async {
    DateTime initial = DateTime.now();
    try {
      if (_dateController.text.isNotEmpty) {
        initial = DateTime.parse(_dateController.text.trim());
      }
    } catch (_) {}

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF8A064D),
              onPrimary: Colors.white,
              onSurface: Color(0xFF2D041A),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _dateController.text =
            "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  void _setupDefaultSelection() {
    if (widget.editingItem != null) {
      final it = widget.editingItem!;
      _titleController.text = (it['title'] ?? it['event_name'] ?? '').toString();
      _driveController.text = (it['drive_url'] ?? '').toString();
      _youtubeController.text = (it['youtube_url'] ?? '').toString();
      _dateController.text = (it['event_date'] ?? it['created_at'] ?? '').toString().split('T')[0];
      _descController.text = (it['description'] ?? '').toString();
      final cat = (it['category'] ?? '').toString().toLowerCase();
      _videoType = (cat == 'performance' || cat == 'student_performance') ? 'performance' : 'general';
      _selectedCourseId = it['target_course_id']?.toString();
      _selectedCourseTitle = (it['target_course_title'] ?? '').toString();
      _selectedBatchOption = (it['target_batch_id'] ?? 'all').toString();
      _selectedBatchName = (it['target_batch_name'] ?? 'All Batches in Course').toString();
      _updateAvailableStudents();
      return;
    }

    if (widget.preselectedCourseId != null) {
      final match = _myCourses.firstWhere(
        (c) => c['id'] == widget.preselectedCourseId,
        orElse: () => _myCourses.isNotEmpty ? _myCourses.first : {},
      );
      if (match.isNotEmpty) {
        _selectedCourseId = match['id'];
        _selectedCourseTitle = match['title'] ?? 'Course';
      }
    } else if (_myCourses.isNotEmpty) {
      _selectedCourseId = _myCourses.first['id'];
      _selectedCourseTitle = _myCourses.first['title'] ?? 'Course';
    }

    if (widget.preselectedBatchId != null) {
      final bMatch = _myBatches.firstWhere(
        (b) => b['id'] == widget.preselectedBatchId,
        orElse: () => {},
      );
      if (bMatch.isNotEmpty) {
        _selectedBatchOption = bMatch['id'];
        _selectedBatchName = bMatch['name'] ?? 'Batch';
      }
    }

    if (widget.preselectedStudent != null) {
      _videoType = 'performance';
      final sName = (widget.preselectedStudent!['name'] ?? widget.preselectedStudent!['full_name'] ?? 'Student').toString();
      _titleController.text = '$sName - $_currentMonthName - Performance Video';
    } else if (widget.isGeneralShare) {
      _videoType = 'general';
      _titleController.text = ''; // General share has no title pre-fill
    }

    _updateAvailableStudents();
  }

  void _updateAvailableStudents() {
    final Map<String, Map<String, dynamic>> uniqueStudents = {};

    List<Map<String, dynamic>> relevantBatches;
    if (_selectedBatchOption == 'all') {
      relevantBatches = _myBatches
          .where((b) => b['course_id'] == _selectedCourseId)
          .toList();
    } else {
      relevantBatches =
          _myBatches.where((b) => b['id'] == _selectedBatchOption).toList();
    }

    for (final batch in relevantBatches) {
      final students = batch['students'];
      if (students is List) {
        for (final s in students) {
          if (s is Map && s['id'] != null) {
            uniqueStudents[s['id'].toString()] = Map<String, dynamic>.from(s);
          }
        }
      }
    }

    // Ensure preselected student is present in list if applicable
    if (widget.preselectedStudent != null && widget.preselectedStudent!['id'] != null) {
      final pId = widget.preselectedStudent!['id'].toString();
      if (!uniqueStudents.containsKey(pId)) {
        uniqueStudents[pId] = Map<String, dynamic>.from(widget.preselectedStudent!);
      }
    }

    _availableStudents = uniqueStudents.values.toList();

    // If preselected student provided, select ONLY that student
    if (widget.preselectedStudent != null && widget.preselectedStudent!['id'] != null) {
      _selectedStudentIds.clear();
      _selectedStudentIds.add(widget.preselectedStudent!['id'].toString());
    } else if (widget.isGeneralShare || _videoType == 'general') {
      _selectedStudentIds.clear();
      for (final s in _availableStudents) {
        _selectedStudentIds.add(s['id'].toString());
      }
    } else if (_videoType == 'performance') {
      if (_selectedStudentIds.length != 1 ||
          !_availableStudents.any((s) => _selectedStudentIds.contains(s['id'].toString()))) {
        _selectedStudentIds.clear();
        if (_availableStudents.isNotEmpty) {
          _selectedStudentIds.add(_availableStudents.first['id'].toString());
        }
      }
    }
  }

  List<Map<String, dynamic>> get _filteredStudents {
    if (_studentFilterText.trim().isEmpty) {
      return _availableStudents;
    }
    final q = _studentFilterText.toLowerCase();
    return _availableStudents.where((s) {
      final name = (s['name'] ?? '').toString().toLowerCase();
      final roll = (s['roll_number'] ?? '').toString().toLowerCase();
      final phone = (s['phone'] ?? '').toString().toLowerCase();
      return name.contains(q) || roll.contains(q) || phone.contains(q);
    }).toList();
  }

  void _toggleSelectAllStudents() {
    if (_videoType == 'performance') return;
    setState(() {
      if (_selectedStudentIds.length == _availableStudents.length) {
        _selectedStudentIds.clear();
      } else {
        _selectedStudentIds.clear();
        for (final s in _availableStudents) {
          _selectedStudentIds.add(s['id'].toString());
        }
      }
    });
  }

  Future<void> _pasteFromClipboard(TextEditingController controller) async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text != null && data!.text!.trim().isNotEmpty) {
      setState(() {
        controller.text = data.text!.trim();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Pasted link from clipboard'),
            duration: Duration(seconds: 1),
          ),
        );
      }
    }
  }

  Future<void> _deleteEditingItem() async {
    if (widget.editingItem == null) return;
    final id = widget.editingItem!['id']?.toString() ?? '';
    if (id.isEmpty) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Shared Video?'),
        content: const Text(
          'Are you sure you want to remove this video link from the academy library? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);
    try {
      final res = await http.delete(
        Uri.parse('${ApiConstants.baseUrl}/api/video-library/$id'),
      );
      if (res.statusCode == 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video link deleted successfully.'),
            backgroundColor: Colors.black87,
          ),
        );
        Navigator.pop(context, true);
      } else {
        throw Exception('Failed to delete video');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Delete failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleShare() async {
    final title = _titleController.text.trim();
    final drive = _driveController.text.trim();
    final youtube = _youtubeController.text.trim();
    final desc = _descController.text.trim();

    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a session or choreography title.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (drive.isEmpty && youtube.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please provide at least one link (Google Drive or YouTube).'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    if (widget.editingItem != null) {
      final id = widget.editingItem!['id']?.toString() ?? '';
      try {
        final updatePayload = {
          'title': title,
          'description': desc,
          'drive_url': drive.isNotEmpty ? drive : null,
          'youtube_url': youtube.isNotEmpty ? youtube : null,
          'event_name': title,
          'event_date': _dateController.text.trim().isNotEmpty
              ? _dateController.text.trim()
              : DateTime.now().toIso8601String().split('T')[0],
        };
        final res = await http.put(
          Uri.parse('${ApiConstants.baseUrl}/api/video-library/$id'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(updatePayload),
        );
        if (res.statusCode == 200) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Video link updated successfully!'),
              backgroundColor: Color(0xFF03543F),
            ),
          );
          Navigator.pop(context, true);
          return;
        } else {
          final errData = jsonDecode(res.body);
          throw Exception(errData['error'] ?? 'Failed to update video link');
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isSubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to update video link: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }
    }

    if (_videoType == 'performance') {
      if (_selectedStudentIds.isEmpty) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select one student for their individual performance video.'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }
    }

    try {
      final selectedList = _availableStudents
          .where((s) => _selectedStudentIds.contains(s['id'].toString()))
          .map((s) => {
                'id': s['id'],
                'name': s['name'] ?? s['full_name'],
                'roll_number': s['roll_number'] ?? s['roll'],
                'phone': s['phone'],
              })
          .toList();

      final selectedNames = selectedList.map((s) => s['name']).join(', ');
      final singleTargetStudent = selectedList.length == 1 ? selectedList.first : null;
      final targetStudentId = singleTargetStudent?['id']?.toString();
      final targetStudentName = singleTargetStudent?['name']?.toString();
      final targetStudentRoll = (singleTargetStudent?['roll_number'] ?? singleTargetStudent?['roll'])?.toString();

      final payload = {
        'title': title,
        'description': desc,
        'drive_url': drive.isNotEmpty ? drive : null,
        'youtube_url': youtube.isNotEmpty ? youtube : null,
        'target_course_id': _selectedCourseId,
        'target_course_title': _selectedCourseTitle,
        'target_batch_id':
            _selectedBatchOption == 'all' ? null : _selectedBatchOption,
        'target_batch_name': _selectedBatchName,
        'target_students': selectedList,
        'target_student_names': selectedNames,
        'target_student_id': targetStudentId,
        'target_student_name': targetStudentName,
        'target_student_roll': targetStudentRoll,
        'shared_by_type': 'guru',
        'trainer_id': _trainerId.isNotEmpty ? _trainerId : null,
        'trainer_name': _trainerName,
        'created_by': _trainerName,
        'category': _videoType == 'performance' ? 'performance' : 'general',
        'event_date': _dateController.text.trim().isNotEmpty
            ? _dateController.text.trim()
            : DateTime.now().toIso8601String().split('T')[0],
      };

      final res = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/api/video-library'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video link shared successfully with your students!'),
            backgroundColor: Color(0xFF03543F),
            duration: Duration(seconds: 3),
          ),
        );
        Navigator.pop(context, true);
      } else {
        final errData = jsonDecode(res.body);
        throw Exception(errData['error'] ?? 'Failed to share video link');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to share video link: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentBatches = _selectedCourseId == null
        ? <Map<String, dynamic>>[]
        : _myBatches
            .where((b) => b['course_id'] == _selectedCourseId)
            .toList();

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Share Video Link',
          style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: LaasyaColors.primary),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Banner: Student Header (if preselected student), Edit Header (if editing), or Guru Banner
                  if (widget.preselectedStudent != null) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF590231), Color(0xFF8A064D)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF590231).withOpacity(0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 26,
                            backgroundColor: Colors.white.withOpacity(0.2),
                            child: Text(
                              (widget.preselectedStudent!['name'] ?? widget.preselectedStudent!['full_name'] ?? 'S')[0].toString().toUpperCase(),
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        widget.preselectedStudent!['name'] ?? widget.preselectedStudent!['full_name'] ?? 'Student',
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDEF7EC),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Text(
                                        'Performance',
                                        style: TextStyle(
                                          color: Color(0xFF03543F),
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'Student ID: ${widget.preselectedStudent!['roll_number'] ?? widget.preselectedStudent!['roll'] ?? widget.preselectedStudent!['student_id'] ?? widget.preselectedStudent!['id'] ?? 'N/A'}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.white.withOpacity(0.9),
                                  ),
                                ),
                                if (widget.preselectedStudent!['batch_name'] != null || widget.preselectedStudent!['course_title'] != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      '${widget.preselectedStudent!['course_title'] ?? ''} • ${widget.preselectedStudent!['batch_name'] ?? ''}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.white.withOpacity(0.8),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else if (widget.editingItem != null) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
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
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFF8A064D).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.edit_note_rounded,
                              color: Color(0xFF8A064D),
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Video Details & Management',
                                  style: TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1E1E1E),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Edit rehearsal link or remove it from the library',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(14),
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
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFF590231).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.video_library_rounded,
                              color: Color(0xFF590231),
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _trainerName,
                                  style: const TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1E1E1E),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Share rehearsal clips and tutorials with students & admin',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: Color(0xFF6B7280),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 18),

                  // 0. VIDEO TYPE SELECTOR (Shown only when not preselected student, not general share, and not editing)
                  if (widget.preselectedStudent == null && !widget.isGeneralShare && widget.editingItem == null) ...[
                    const Text(
                      'VIDEO TYPE *',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                        color: Color(0xFF8A064D),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        // Option A: Student Performance (Individual Student, 1/Month required)
                        Expanded(
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _videoType = 'performance';
                                if (_selectedStudentIds.length != 1 && _availableStudents.isNotEmpty) {
                                  _selectedStudentIds.clear();
                                  _selectedStudentIds.add(_availableStudents.first['id'].toString());
                                }
                                _updateTitleForType();
                              });
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              decoration: BoxDecoration(
                                color: _videoType == 'performance'
                                    ? const Color(0xFFFFF2F8)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _videoType == 'performance'
                                      ? const Color(0xFF8A064D)
                                      : const Color(0xFFE5D4DE),
                                  width: _videoType == 'performance' ? 2 : 1,
                                ),
                                boxShadow: _videoType == 'performance'
                                    ? [
                                        BoxShadow(
                                          color: const Color(0xFF8A064D).withOpacity(0.08),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : [],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.stars_rounded,
                                        size: 18,
                                        color: _videoType == 'performance'
                                            ? const Color(0xFF8A064D)
                                            : Colors.grey,
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          'Student Performance',
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.bold,
                                            color: _videoType == 'performance'
                                                ? const Color(0xFF590231)
                                                : const Color(0xFF4B5563),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Individual student • Min 1 video / month',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      color: Color(0xFF6B7280),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Option B: General Group Video (Batch-Wide, Unlimited)
                        Expanded(
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _videoType = 'general';
                                if (_selectedStudentIds.isEmpty) {
                                  for (final s in _availableStudents) {
                                    _selectedStudentIds.add(s['id'].toString());
                                  }
                                }
                                _updateTitleForType();
                              });
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              decoration: BoxDecoration(
                                color: _videoType == 'general'
                                    ? const Color(0xFFF3F4F6)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _videoType == 'general'
                                      ? const Color(0xFF1E3A8A)
                                      : const Color(0xFFE5D4DE),
                                  width: _videoType == 'general' ? 2 : 1,
                                ),
                                boxShadow: _videoType == 'general'
                                    ? [
                                        BoxShadow(
                                          color: const Color(0xFF1E3A8A).withOpacity(0.08),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : [],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.group_work_rounded,
                                        size: 18,
                                        color: _videoType == 'general'
                                            ? const Color(0xFF1E3A8A)
                                            : Colors.grey,
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          'General Video',
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.bold,
                                            color: _videoType == 'general'
                                                ? const Color(0xFF1E3A8A)
                                                : const Color(0xFF4B5563),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Group / Batch-wise • Choreography link',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      color: Color(0xFF6B7280),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                  ],

                  // 1. SELECT COURSE
                  const Text(
                    'SELECT COURSE *',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                      color: Color(0xFF8A064D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5D4DE)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: _selectedCourseId,
                        hint: const Text('Select Course'),
                        items: _myCourses.map((c) {
                          return DropdownMenuItem<String>(
                            value: c['id'],
                            child: Text(
                              c['title'] ?? 'Course',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E1E1E),
                              ),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() {
                              _selectedCourseId = val;
                              final cObj = _myCourses.firstWhere((c) => c['id'] == val);
                              _selectedCourseTitle = cObj['title'] ?? 'Course';
                              _selectedBatchOption = 'all';
                              _selectedBatchName = 'All Batches in $_selectedCourseTitle';
                              _updateAvailableStudents();
                            });
                          }
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 2. SELECT BATCH
                  const Text(
                    'SELECT BATCH *',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                      color: Color(0xFF8A064D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5D4DE)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: _selectedBatchOption,
                        items: [
                          DropdownMenuItem<String>(
                            value: 'all',
                            child: Text(
                              'All Batches in $_selectedCourseTitle',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E1E1E),
                              ),
                            ),
                          ),
                          ...currentBatches.map((b) {
                            return DropdownMenuItem<String>(
                              value: b['id'],
                              child: Text(
                                '${b['name']} (${b['enrolled_count'] ?? 0} Students)',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF1E1E1E),
                                ),
                              ),
                            );
                          }),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setState(() {
                              _selectedBatchOption = val;
                              if (val == 'all') {
                                _selectedBatchName =
                                    'All Batches in $_selectedCourseTitle';
                              } else {
                                final bObj = currentBatches
                                    .firstWhere((b) => b['id'] == val);
                                _selectedBatchName = bObj['name'];
                              }
                              _updateAvailableStudents();
                            });
                          }
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  // 3. STUDENT SELECTION SECTION (Shown only when not preselected student and not editing)
                  if (widget.preselectedStudent == null && widget.editingItem == null) ...[
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE5D4DE)),
                      ),
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    _videoType == 'performance'
                                        ? Icons.person_pin_rounded
                                        : Icons.people_alt_rounded,
                                    size: 18,
                                    color: const Color(0xFF8A064D),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    _videoType == 'performance'
                                        ? 'TARGET STUDENT (INDIVIDUAL) *'
                                        : 'TARGET STUDENTS (GROUP)',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.6,
                                      color: Color(0xFF8A064D),
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _videoType == 'performance'
                                      ? const Color(0xFFDEF7EC)
                                      : const Color(0xFFF3E8FF),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  _videoType == 'performance'
                                      ? (_selectedStudentIds.isNotEmpty ? '1 Student Selected' : 'Choose 1 Student')
                                      : '${_selectedStudentIds.length} of ${_availableStudents.length} selected',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: _videoType == 'performance'
                                        ? const Color(0xFF03543F)
                                        : const Color(0xFF6B21A8),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _videoType == 'performance'
                              ? 'Every student must receive at least 1 performance video per month. Select the individual student for this evaluation.'
                              : 'General practice / choreography links can be sent to all or multiple students.',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                          ),
                          const SizedBox(height: 10),

                          // Search box and Select All button
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _studentSearchController,
                                  onChanged: (val) =>
                                      setState(() => _studentFilterText = val),
                                  style: const TextStyle(fontSize: 12.5),
                                  decoration: InputDecoration(
                                    hintText: 'Search by student name or roll no...',
                                    hintStyle: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade400,
                                    ),
                                    prefixIcon: const Icon(
                                      Icons.search_rounded,
                                      size: 18,
                                      color: Colors.grey,
                                    ),
                                    filled: true,
                                    fillColor: const Color(0xFFF9FAFB),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 8,
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade300,
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade200,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              if (_videoType == 'general') ...[
                                const SizedBox(width: 8),
                                OutlinedButton(
                                  onPressed: _toggleSelectAllStudents,
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFF590231),
                                    side: const BorderSide(color: Color(0xFFD8B4E2)),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 11,
                                    ),
                                  ),
                                  child: Text(
                                    _selectedStudentIds.length ==
                                            _availableStudents.length
                                        ? 'Clear All'
                                        : 'Select All',
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),

                          const SizedBox(height: 12),

                          // List of students with Radio (performance) or Checkbox (general)
                          if (_availableStudents.isEmpty)
                            Container(
                              padding: const EdgeInsets.all(16),
                              alignment: Alignment.center,
                              child: const Text(
                                'No students enrolled in this batch yet.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                            )
                          else
                            Container(
                              constraints: const BoxConstraints(maxHeight: 220),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFAFAFA),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: ListView.separated(
                                shrinkWrap: true,
                                itemCount: _filteredStudents.length,
                                separatorBuilder: (_, __) =>
                                    Divider(height: 1, color: Colors.grey.shade200),
                                itemBuilder: (ctx, idx) {
                                  final stu = _filteredStudents[idx];
                                  final sId = stu['id'].toString();
                                  final isSelected =
                                      _selectedStudentIds.contains(sId);
                                  final sName = stu['name'] ?? 'Student';
                                  final sRoll = stu['roll_number'] ?? '';

                                  return InkWell(
                                    onTap: () {
                                      setState(() {
                                        if (_videoType == 'performance') {
                                          _selectedStudentIds.clear();
                                          _selectedStudentIds.add(sId);
                                        } else {
                                          if (isSelected) {
                                            _selectedStudentIds.remove(sId);
                                          } else {
                                            _selectedStudentIds.add(sId);
                                          }
                                        }
                                        _updateTitleForType();
                                      });
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 8,
                                      ),
                                      child: Row(
                                        children: [
                                          SizedBox(
                                            width: 24,
                                            height: 24,
                                            child: _videoType == 'performance'
                                                ? Radio<String>(
                                                    value: sId,
                                                    groupValue: _selectedStudentIds.isNotEmpty
                                                        ? _selectedStudentIds.first
                                                        : null,
                                                    activeColor: const Color(0xFF590231),
                                                    onChanged: (val) {
                                                      if (val != null) {
                                                        setState(() {
                                                          _selectedStudentIds.clear();
                                                          _selectedStudentIds.add(val);
                                                          _updateTitleForType();
                                                        });
                                                      }
                                                    },
                                                  )
                                                : Checkbox(
                                                    value: isSelected,
                                                    activeColor: const Color(0xFF590231),
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(4),
                                                    ),
                                                    onChanged: (val) {
                                                      setState(() {
                                                        if (val == true) {
                                                          _selectedStudentIds.add(sId);
                                                        } else {
                                                          _selectedStudentIds.remove(sId);
                                                        }
                                                      });
                                                    },
                                                  ),
                                          ),
                                          const SizedBox(width: 8),
                                          CircleAvatar(
                                            radius: 14,
                                            backgroundColor: isSelected
                                                ? const Color(0xFF8A064D)
                                                : const Color(0xFFF3E8FF),
                                            child: Text(
                                              sName.isNotEmpty
                                                  ? sName[0].toUpperCase()
                                                  : 'S',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: isSelected
                                                    ? Colors.white
                                                    : const Color(0xFF6B21A8),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  sName,
                                                  style: TextStyle(
                                                    fontSize: 12.5,
                                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                                    color: isSelected ? const Color(0xFF8A064D) : const Color(0xFF1E1E1E),
                                                  ),
                                                ),
                                                if (sRoll.isNotEmpty)
                                                  Text(
                                                    'Roll: $sRoll',
                                                    style: TextStyle(
                                                      fontSize: 10.5,
                                                      color: Colors.grey.shade600,
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          ),
                                          if (_videoType == 'performance' && isSelected)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFDEF7EC),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: const Text(
                                                'Selected',
                                                style: TextStyle(
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
                                },
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],

                  // 4. VIDEO TITLE
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'SESSION OR VIDEO TITLE *',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.6,
                          color: Color(0xFF8A064D),
                        ),
                      ),
                      AiEnhanceBar(
                        controller: _titleController,
                        contextDescription: 'classical arts choreography session and masterclass video title',
                        compact: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _titleController,
                    style: const TextStyle(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'e.g. Varnam Choreography & Footwork Practice',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade400,
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 5. SHOOT DATE (Tap opens Calendar Picker)
                  const Text(
                    'SHOOT / RECORDING DATE',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                      color: Color(0xFF8A064D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _dateController,
                    readOnly: true,
                    onTap: _selectDate,
                    style: const TextStyle(fontSize: 13.5),
                    decoration: InputDecoration(
                      hintText: 'YYYY-MM-DD',
                      prefixIcon: const Icon(
                        Icons.calendar_today_rounded,
                        size: 18,
                        color: Color(0xFF8A064D),
                      ),
                      suffixIcon: const Icon(
                        Icons.arrow_drop_down_rounded,
                        color: Colors.grey,
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 6. GOOGLE DRIVE LINK
                  const Text(
                    'GOOGLE DRIVE FOLDER / FILE LINK',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                      color: Color(0xFF8A064D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _driveController,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'https://drive.google.com/drive/folders/...',
                      hintStyle: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade400,
                      ),
                      prefixIcon: const Icon(
                        Icons.add_to_drive_rounded,
                        size: 19,
                        color: Color(0xFF0F9D58),
                      ),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.paste_rounded, size: 18),
                        onPressed: () => _pasteFromClipboard(_driveController),
                        tooltip: 'Paste from clipboard',
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 7. YOUTUBE VIDEO LINK
                  const Text(
                    'YOUTUBE VIDEO / UNLISTED LINK',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                      color: Color(0xFF8A064D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _youtubeController,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'https://youtube.com/watch?v=... or https://youtu.be/...',
                      hintStyle: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade400,
                      ),
                      prefixIcon: const Icon(
                        Icons.play_circle_fill_rounded,
                        size: 19,
                        color: Color(0xFFFF0000),
                      ),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.paste_rounded, size: 18),
                        onPressed: () => _pasteFromClipboard(_youtubeController),
                        tooltip: 'Paste from clipboard',
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  // 8. ENLARGED DESCRIPTION BOX
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'PRACTICE NOTES & SESSION DESCRIPTION',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.6,
                          color: Color(0xFF8A064D),
                        ),
                      ),
                      AiEnhanceBar(
                        controller: _descController,
                        contextDescription: 'classical dance, music, arts masterclass video rehearsal notes and student guidance',
                        compact: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _descController,
                    minLines: 6,
                    maxLines: 12,
                    style: const TextStyle(fontSize: 13.5, height: 1.4),
                    decoration: InputDecoration(
                      hintText:
                          'Provide detailed guidance for students:\n• Key mudras & adavu combinations demonstrated\n• Specific timestamps for difficult rhythmic transitions\n• Practice expectations before the next class\n• Additional references or choreography tips...',
                      hintStyle: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade400,
                        height: 1.4,
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5D4DE)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 14,
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // 9. ACTION BUTTONS: Delete & Edit if editingItem != null, else Share Button
                  if (widget.editingItem != null) ...[
                    Row(
                      children: [
                        Expanded(
                          flex: 1,
                          child: SizedBox(
                            height: 50,
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.red.shade700,
                                side: BorderSide(color: Colors.red.shade300, width: 1.5),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              onPressed: _isSubmitting ? null : _deleteEditingItem,
                              icon: const Icon(Icons.delete_outline_rounded, size: 20),
                              label: const Text(
                                'Delete',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: SizedBox(
                            height: 50,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF590231),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 1,
                              ),
                              onPressed: _isSubmitting ? null : _handleShare,
                              icon: _isSubmitting
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.check_circle_outline_rounded, size: 20),
                              label: Text(
                                _isSubmitting ? 'Saving Changes...' : 'Save Changes',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF590231),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 1,
                        ),
                        onPressed: _isSubmitting ? null : _handleShare,
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.share_rounded, size: 20),
                        label: Text(
                          _isSubmitting
                              ? 'Sharing Video Link...'
                              : (widget.preselectedStudent != null
                                  ? 'Share Performance Video'
                                  : 'Share Video Link'),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }
}

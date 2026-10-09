import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';

class TrainerCreateShareVideoScreen extends StatefulWidget {
  final Map<String, dynamic>? trainerProfile;
  final List<Map<String, dynamic>>? initialCourses;
  final List<Map<String, dynamic>>? initialBatches;

  const TrainerCreateShareVideoScreen({
    super.key,
    this.trainerProfile,
    this.initialCourses,
    this.initialBatches,
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

  // Disciples / Student Multi-Select State
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
        'http://localhost:3000/api/trainer/batches?trainerName=$nameParam&phone=$phoneParam',
      );
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
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

  void _setupDefaultSelection() {
    if (_myCourses.isNotEmpty) {
      _selectedCourseId = _myCourses.first['id'];
      _selectedCourseTitle = _myCourses.first['title'] ?? 'Course';
      _updateAvailableStudents();
    }
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

    _availableStudents = uniqueStudents.values.toList();
    // Default to selecting all disciples in this scope
    _selectedStudentIds.clear();
    for (final s in _availableStudents) {
      _selectedStudentIds.add(s['id'].toString());
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

    if (_selectedStudentIds.isEmpty && _availableStudents.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one disciple to share this video with.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final selectedList = _availableStudents
          .where((s) => _selectedStudentIds.contains(s['id'].toString()))
          .map((s) => {
                'id': s['id'],
                'name': s['name'],
                'roll_number': s['roll_number'],
                'phone': s['phone'],
              })
          .toList();

      final selectedNames = selectedList.map((s) => s['name']).join(', ');

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
        'shared_by_type': 'guru',
        'trainer_id': _trainerId.isNotEmpty ? _trainerId : null,
        'trainer_name': _trainerName,
        'created_by': _trainerName,
        'category': 'rehearsal',
        'event_date': _dateController.text.trim().isNotEmpty
            ? _dateController.text.trim()
            : DateTime.now().toIso8601String().split('T')[0],
      };

      final res = await http.post(
        Uri.parse('http://localhost:3000/api/video-library'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video link shared successfully with your disciples!'),
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
                  // Guru Banner
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
                                'Share rehearsal clips and tutorials with disciples & admin',
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

                  const SizedBox(height: 18),

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
                                '${b['name']} (${b['enrolled_count'] ?? 0} Disciples)',
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

                  // 3. STUDENT MULTI-SELECT FILTER SECTION
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
                            const Row(
                              children: [
                                Icon(
                                  Icons.people_alt_rounded,
                                  size: 18,
                                  color: Color(0xFF8A064D),
                                ),
                                SizedBox(width: 6),
                                Text(
                                  'FILTER DISCIPLES',
                                  style: TextStyle(
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
                                color: const Color(0xFFF3E8FF),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${_selectedStudentIds.length} of ${_availableStudents.length} selected',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF6B21A8),
                                ),
                              ),
                            ),
                          ],
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
                                  hintText: 'Search by disciple name or roll no...',
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
                        ),

                        const SizedBox(height: 12),

                        // List of students with checkboxes
                        if (_availableStudents.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(16),
                            alignment: Alignment.center,
                            child: const Text(
                              'No disciples enrolled in this batch yet.',
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
                                      if (isSelected) {
                                        _selectedStudentIds.remove(sId);
                                      } else {
                                        _selectedStudentIds.add(sId);
                                      }
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
                                          width: 22,
                                          height: 22,
                                          child: Checkbox(
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
                                        const SizedBox(width: 10),
                                        CircleAvatar(
                                          radius: 14,
                                          backgroundColor: const Color(0xFFF3E8FF),
                                          child: Text(
                                            sName.isNotEmpty
                                                ? sName[0].toUpperCase()
                                                : 'S',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF6B21A8),
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
                                                style: const TextStyle(
                                                  fontSize: 12.5,
                                                  fontWeight: FontWeight.w600,
                                                  color: Color(0xFF1E1E1E),
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

                  // 4. VIDEO TITLE
                  const Text(
                    'SESSION OR VIDEO TITLE *',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                      color: Color(0xFF8A064D),
                    ),
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

                  // 5. SHOOT DATE
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
                    style: const TextStyle(fontSize: 13.5),
                    decoration: InputDecoration(
                      hintText: 'YYYY-MM-DD',
                      prefixIcon: const Icon(
                        Icons.calendar_today_rounded,
                        size: 18,
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
                      Text(
                        'Extended Details Box',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade500,
                        ),
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
                          'Provide detailed guidance for disciples:\n• Key mudras & adavu combinations demonstrated\n• Specific timestamps for difficult rhythmic transitions\n• Practice expectations before the next class\n• Additional references or choreography tips...',
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

                  // 9. SHARE BUTTON
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
                            ? 'Sharing Link with Disciples...'
                            : 'Share Link with Disciples',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }
}

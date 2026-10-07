import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import 'trainer_data_store.dart';
import 'trainer_student_calendar_screen.dart';

class TrainerStudentsTab extends StatefulWidget {
  const TrainerStudentsTab({super.key});

  @override
  State<TrainerStudentsTab> createState() => _TrainerStudentsTabState();
}

class _TrainerStudentsTabState extends State<TrainerStudentsTab> {
  final TrainerDataStore _store = TrainerDataStore();

  String _searchQuery = '';
  // Multi-selection filters: selected course IDs and selected batch IDs
  final Set<String> _selectedCourseIds = {};
  final Set<String> _selectedBatchIds = {};

  @override
  void initState() {
    super.initState();
    _selectAllFilters();
  }

  void _selectAllFilters() {
    _selectedCourseIds.clear();
    _selectedBatchIds.clear();
    for (var course in _store.courses) {
      _selectedCourseIds.add(course['id'] as String);
      for (var batch in (course['batches'] as List)) {
        _selectedBatchIds.add(batch['id'] as String);
      }
    }
  }

  void _showFilterModal() {
    final tempSelectedCourseIds = Set<String>.from(_selectedCourseIds);
    final tempSelectedBatchIds = Set<String>.from(_selectedBatchIds);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final courses = _store.courses;

          return Container(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(28),
                topRight: Radius.circular(28),
              ),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Center(
                  child: Container(
                    width: 48,
                    height: 5,
                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 14),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Filter by Course & Batch',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                      ),
                      TextButton(
                        onPressed: () {
                          setModalState(() {
                            tempSelectedCourseIds.clear();
                            tempSelectedBatchIds.clear();
                            for (var c in courses) {
                              tempSelectedCourseIds.add(c['id'] as String);
                              for (var b in (c['batches'] as List)) {
                                tempSelectedBatchIds.add(b['id'] as String);
                              }
                            }
                          });
                        },
                        child: const Text('Select All', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: courses.length,
                    itemBuilder: (context, index) {
                      final course = courses[index];
                      final courseId = course['id'] as String;
                      final cColor = course['theme_color'] as Color;
                      final batches = course['batches'] as List;

                      final isCourseChecked = tempSelectedCourseIds.contains(courseId);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFBF8FA),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isCourseChecked ? cColor : const Color(0xFFE5E7EB),
                            width: isCourseChecked ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CheckboxListTile(
                              activeColor: cColor,
                              value: isCourseChecked,
                              title: Row(
                                children: [
                                  Icon(course['icon'] as IconData, size: 20, color: cColor),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      course['title'] as String,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        color: isCourseChecked ? cColor : LaasyaColors.textDark,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  '${batches.length} Batches Available',
                                  style: const TextStyle(fontSize: 11.5, color: Colors.grey),
                                ),
                              ),
                              onChanged: (val) {
                                setModalState(() {
                                  if (val == true) {
                                    tempSelectedCourseIds.add(courseId);
                                    for (var b in batches) {
                                      tempSelectedBatchIds.add(b['id'] as String);
                                    }
                                  } else {
                                    tempSelectedCourseIds.remove(courseId);
                                    for (var b in batches) {
                                      tempSelectedBatchIds.remove(b['id'] as String);
                                    }
                                  }
                                });
                              },
                            ),

                            if (isCourseChecked) ...[
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16),
                                child: Divider(height: 1),
                              ),
                              Padding(
                                padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Select Batches:',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                                    ),
                                    const SizedBox(height: 6),
                                    ...batches.map((batch) {
                                      final batchId = batch['id'] as String;
                                      final isBatchChecked = tempSelectedBatchIds.contains(batchId);
                                      final stuCount = (batch['students'] as List).length;

                                      return InkWell(
                                        onTap: () {
                                          setModalState(() {
                                            if (isBatchChecked) {
                                              tempSelectedBatchIds.remove(batchId);
                                              final hasAny = batches.any((b) => tempSelectedBatchIds.contains(b['id']));
                                              if (!hasAny) tempSelectedCourseIds.remove(courseId);
                                            } else {
                                              tempSelectedBatchIds.add(batchId);
                                              tempSelectedCourseIds.add(courseId);
                                            }
                                          });
                                        },
                                        borderRadius: BorderRadius.circular(10),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                                          child: Row(
                                            children: [
                                              Icon(
                                                isBatchChecked ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                                                color: isBatchChecked ? cColor : Colors.grey.shade400,
                                                size: 20,
                                              ),
                                              const SizedBox(width: 10),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      batch['name'] as String,
                                                      style: TextStyle(
                                                        fontSize: 12.5,
                                                        fontWeight: isBatchChecked ? FontWeight.bold : FontWeight.normal,
                                                        color: isBatchChecked ? LaasyaColors.textDark : Colors.black87,
                                                      ),
                                                    ),
                                                    Text(
                                                      '${batch['timings']} • $stuCount Disciples',
                                                      style: const TextStyle(fontSize: 10.5, color: Colors.grey),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    }),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setModalState(() {
                              tempSelectedCourseIds.clear();
                              tempSelectedBatchIds.clear();
                            });
                          },
                          child: const Text('Clear All'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _selectedCourseIds.clear();
                              _selectedCourseIds.addAll(tempSelectedCourseIds);
                              _selectedBatchIds.clear();
                              _selectedBatchIds.addAll(tempSelectedBatchIds);
                            });
                            Navigator.pop(ctx);
                          },
                          child: const Text('Apply Filter', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showStudentProfileModal(Map<String, dynamic> stu) {
    final enrollments = List<Map<String, dynamic>>.from(stu['enrollments'] ?? []);
    final primaryColor = enrollments.isNotEmpty
        ? (enrollments.first['course_color'] as Color? ?? LaasyaColors.primary)
        : LaasyaColors.primary;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
        ),
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: primaryColor,
                  child: Text(
                    stu['name'].toString().substring(0, 1),
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Student ID matching admin
                      Text(
                        'Student ID: ${stu['roll']}',
                        style: TextStyle(fontSize: 12.5, color: primaryColor, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      // Student Name below ID
                      Text(
                        stu['name']!,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${enrollments.length} Active Courses with this Guru',
                        style: const TextStyle(fontSize: 11.5, color: Colors.black54, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),

            _infoRow(Icons.phone_rounded, 'Disciple Phone', stu['phone']!),
            _infoRow(Icons.family_restroom_rounded, 'Parent / Guardian', stu['parent_name']!),
            _infoRow(Icons.contact_phone_rounded, 'Emergency Contact', stu['parent_phone']!),
            _infoRow(Icons.percent_rounded, 'Attendance Record', '${stu['rate']}% Present'),

            const SizedBox(height: 14),
            const Text(
              'Enrolled Courses & Batches:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),

            // Enrolled courses list
            ...enrollments.map((enr) {
              final cColor = enr['course_color'] as Color;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFBF8FA),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: cColor.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: cColor.withOpacity(0.14),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        enr['course_short_title'],
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: cColor),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            enr['batch_name'],
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                          ),
                          Text(
                            '${enr['batch_timings']} • ${enr['batch_schedule_display']}',
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 16),

            // VIEW ATTENDANCE BUTTON IN MODAL
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => TrainerStudentCalendarScreen(student: stu),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
                ),
                icon: const Icon(Icons.calendar_month_rounded, color: Colors.white),
                label: const Text(
                  'View Attendance Calendar',
                  style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close'),
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5.5),
      child: Row(
        children: [
          Icon(icon, size: 18, color: LaasyaColors.primary),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          const Spacer(),
          Text(val, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final uniqueStudents = _store.getUniqueEnrolledStudents();

    // Filter students by Course & Batch selection and Search Query
    final filtered = uniqueStudents.where((s) {
      final enrollments = List<Map<String, dynamic>>.from(s['enrollments'] ?? []);

      // Check if student matches selected course or batch filter
      final matchesFilter = enrollments.any((e) {
        final courseMatch = _selectedCourseIds.isEmpty || _selectedCourseIds.contains(e['course_id']);
        final batchMatch = _selectedBatchIds.isEmpty || _selectedBatchIds.contains(e['batch_id']);
        return courseMatch && batchMatch;
      });
      if (!matchesFilter) return false;

      // Check search query
      if (_searchQuery.trim().isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final name = s['name'].toString().toLowerCase();
      final roll = s['roll'].toString().toLowerCase();
      final phone = s['phone'].toString().toLowerCase();
      return name.contains(q) || roll.contains(q) || phone.contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: Column(
        children: [
          // =================================================================
          // 1. TOP SEARCH & FILTER BAR
          // =================================================================
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: Colors.white,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Search disciple name, ID...',
                          hintStyle: TextStyle(fontSize: 12.5, color: Colors.grey.shade500),
                          prefixIcon: const Icon(Icons.search_rounded, color: LaasyaColors.primary, size: 20),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear, size: 16),
                                  onPressed: () => setState(() => _searchQuery = ''),
                                )
                              : null,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                          filled: true,
                          fillColor: const Color(0xFFFBF8FA),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFF0D5E4)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFF0D5E4)),
                          ),
                        ),
                        onChanged: (val) => setState(() => _searchQuery = val),
                      ),
                    ),
                    const SizedBox(width: 10),
                    InkWell(
                      onTap: _showFilterModal,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF2F8),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.filter_list_rounded, color: LaasyaColors.primary, size: 18),
                            const SizedBox(width: 6),
                            const Text(
                              'Filter',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: LaasyaColors.primary),
                            ),
                            if (_selectedBatchIds.isNotEmpty) ...[
                              const SizedBox(width: 4),
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: LaasyaColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: Text(
                                  '${_selectedBatchIds.length}',
                                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Showing ${filtered.length} of ${uniqueStudents.length} Disciples',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                    ),
                    if (_selectedBatchIds.length < 9)
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectAllFilters();
                          });
                        },
                        child: const Text(
                          'Reset Filters',
                          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),

          // =================================================================
          // 2. ENROLLED STUDENTS LIST (NO VIEW ATTENDANCE BUTTON, ARROW ONLY)
          // =================================================================
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.person_search_rounded, size: 54, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text(
                          'No matching disciples found.',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.grey),
                        ),
                        const SizedBox(height: 4),
                        const Text('Try adjusting your search or course filters.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final stu = filtered[index];
                      final rate = stu['rate'] as int;
                      final enrollments = List<Map<String, dynamic>>.from(stu['enrollments'] ?? []);
                      final primaryColor = enrollments.isNotEmpty
                          ? (enrollments.first['course_color'] as Color? ?? LaasyaColors.primary)
                          : LaasyaColors.primary;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
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
                        child: InkWell(
                          onTap: () => _showStudentProfileModal(stu),
                          borderRadius: BorderRadius.circular(18),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Student Avatar
                                CircleAvatar(
                                  radius: 22,
                                  backgroundColor: primaryColor.withOpacity(0.12),
                                  child: Text(
                                    stu['name'].toString().substring(0, 1),
                                    style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                ),
                                const SizedBox(width: 12),

                                // Center Content: Student ID on top, Name below, Courses & Batches below
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // 1. STUDENT ID ON TOP (Exact Admin ID, no course prefix)
                                      Text(
                                        stu['roll']!, // e.g. LCA-1
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: primaryColor,
                                          letterSpacing: 0.6,
                                        ),
                                      ),
                                      const SizedBox(height: 2),

                                      // 2. STUDENT NAME BELOW STUDENT ID
                                      Text(
                                        stu['name']!,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                          color: LaasyaColors.textDark,
                                        ),
                                      ),
                                      const SizedBox(height: 6),

                                      // 3. COURSE NAME & BATCH NAME SIDE BY SIDE WITH DIFFERENT COLOURS
                                      // Continuing with next row if registered for another course
                                      ...enrollments.map((enr) {
                                        final cColor = enr['course_color'] as Color;

                                        return Padding(
                                          padding: const EdgeInsets.only(bottom: 4),
                                          child: Wrap(
                                            spacing: 6,
                                            runSpacing: 4,
                                            crossAxisAlignment: WrapCrossAlignment.center,
                                            children: [
                                              // Course Name Chip (Color 1)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                                decoration: BoxDecoration(
                                                  color: cColor.withOpacity(0.12),
                                                  borderRadius: BorderRadius.circular(6),
                                                  border: Border.all(color: cColor.withOpacity(0.4)),
                                                ),
                                                child: Text(
                                                  enr['course_short_title'],
                                                  style: TextStyle(
                                                    fontSize: 10.5,
                                                    fontWeight: FontWeight.bold,
                                                    color: cColor,
                                                  ),
                                                ),
                                              ),

                                              // Batch Name Chip (Color 2 - Distinctive)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF3E8EE),
                                                  borderRadius: BorderRadius.circular(6),
                                                  border: Border.all(color: const Color(0xFFE5D0DD)),
                                                ),
                                                child: Text(
                                                  enr['batch_name'],
                                                  style: const TextStyle(
                                                    fontSize: 10.5,
                                                    fontWeight: FontWeight.w600,
                                                    color: Color(0xFF590231),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        );
                                      }),
                                    ],
                                  ),
                                ),

                                const SizedBox(width: 8),

                                // Right Side: Attendance Rate Badge & ARROW ONLY (No View Attendance button)
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                      decoration: BoxDecoration(
                                        color: rate >= 90 ? const Color(0xFFDEF7EC) : const Color(0xFFFEF08A),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '$rate% Attended',
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.bold,
                                          color: rate >= 90 ? const Color(0xFF03543F) : const Color(0xFF854D0E),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    // Sleek Arrow icon to check details
                                    const Icon(
                                      Icons.arrow_forward_ios_rounded,
                                      size: 14,
                                      color: Colors.grey,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

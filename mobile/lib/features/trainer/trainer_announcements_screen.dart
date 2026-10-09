import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import 'trainer_create_announcement_screen.dart';

class TrainerAnnouncementsScreen extends StatefulWidget {
  final Map<String, dynamic>? trainerProfile;

  const TrainerAnnouncementsScreen({
    super.key,
    this.trainerProfile,
  });

  @override
  State<TrainerAnnouncementsScreen> createState() => _TrainerAnnouncementsScreenState();
}

class _TrainerAnnouncementsScreenState extends State<TrainerAnnouncementsScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _announcements = [];
  List<Map<String, dynamic>> _myCourses = [];
  List<Map<String, dynamic>> _myBatches = [];
  String _searchQuery = '';

  String get _trainerName =>
      widget.trainerProfile?['full_name'] ?? 'Faculty Guru';
  String get _trainerPhone =>
      widget.trainerProfile?['phone'] ?? '';
  String get _trainerId =>
      widget.trainerProfile?['id'] ?? '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    await Future.wait([
      _loadTrainerBatches(),
      _loadAnnouncements(),
    ]);
    if (mounted) {
      setState(() => _isLoading = false);
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
        }
      }
    } catch (e) {
      debugPrint('Error loading trainer batches: $e');
    }
  }

  Future<void> _loadAnnouncements() async {
    try {
      final uri = Uri.parse('http://localhost:3000/api/announcements');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['announcements'] is List) {
          final all = List<Map<String, dynamic>>.from(data['announcements']);
          // Filter announcements that belong to this trainer or his assigned courses
          _announcements = all.where((a) {
            final senderRole = (a['sender_role'] ?? '').toString();
            final aTrainerName = (a['trainer_name'] ?? a['created_by'] ?? '').toString().toLowerCase();
            final tName = _trainerName.toLowerCase();
            if (senderRole == 'trainer' && (aTrainerName.contains(tName) || tName.contains(aTrainerName))) {
              return true;
            }
            if (a['trainer_id'] == _trainerId) return true;
            return false;
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Error loading announcements: $e');
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

  Future<void> _openCreateAnnouncementSheet() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => TrainerCreateAnnouncementScreen(
          trainerProfile: widget.trainerProfile,
          initialCourses: _myCourses,
          initialBatches: _myBatches,
        ),
      ),
    );

    if (result == true && mounted) {
      _loadData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _announcements.where((a) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final title = (a['title'] ?? '').toString().toLowerCase();
      final msg = (a['message'] ?? '').toString().toLowerCase();
      final course = (a['target_course_title'] ?? '').toString().toLowerCase();
      return title.contains(q) || msg.contains(q) || course.contains(q);
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
              'Announcements',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Guru Broadcast • $_trainerName',
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
                    // Header Action Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF075E54), Color(0xFF128C7E)],
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
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.campaign_rounded, color: Colors.white, size: 22),
                              ),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Direct Faculty Announcements',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Send notifications to your enrolled students',
                                      style: TextStyle(color: Colors.white70, fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _openCreateAnnouncementSheet,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFF9E33A),
                                foregroundColor: const Color(0xFF2D041A),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 11),
                                elevation: 0,
                              ),
                              icon: const Icon(Icons.add_comment_rounded, size: 18),
                              label: const Text(
                                'Create New Announcement',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Search bar
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
                          hintText: 'Search announcements...',
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

                    // Section Heading
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Broadcast History (${filtered.length})',
                          style: const TextStyle(
                            fontSize: 14,
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
                          child: const Text(
                            'Managed by Admin',
                            style: TextStyle(
                              color: Color(0xFF03543F),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // List of Announcements
                    if (filtered.isEmpty)
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
                            Icon(Icons.mark_chat_unread_outlined, size: 44, color: Colors.grey.shade400),
                            const SizedBox(height: 10),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'No broadcasts matching "$_searchQuery"'
                                  : 'No announcements sent yet',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Use the button above to broadcast messages to your enrolled batches.',
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
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, idx) {
                          final ann = filtered[idx];
                          final title = ann['title'] ?? 'Announcement';
                          final message = ann['message'] ?? '';
                          final course = ann['target_course_title'] ?? 'Enrolled Course';
                          final batch = ann['target_batch_name'] ?? 'All Batches';
                          final dateStr = _formatDate(ann['publish_date'] ?? ann['created_at']);
                          final typeTag = ann['type_tag'] ?? 'General';

                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFF0D5E4)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(15),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE8F5E9),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          typeTag.toUpperCase(),
                                          style: const TextStyle(
                                            color: Color(0xFF2E7D32),
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        dateStr,
                                        style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    title,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: LaasyaColors.textDark,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    message,
                                    style: const TextStyle(fontSize: 12.5, color: Colors.black87, height: 1.35),
                                  ),
                                  const SizedBox(height: 12),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFFF9FB),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFFF0D5E4)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.school_rounded, size: 13, color: LaasyaColors.primary),
                                        const SizedBox(width: 5),
                                        Flexible(
                                          child: Text(
                                            '$course • $batch',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: LaasyaColors.primary,
                                            ),
                                            overflow: TextOverflow.ellipsis,
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
                  ],
                ),
              ),
            ),
    );
  }
}

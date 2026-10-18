import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
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
  final ScrollController _scrollController = ScrollController();

  String get _trainerName =>
      widget.trainerProfile?['full_name'] ?? 'Faculty Guru';
  String get _trainerPhone =>
      widget.trainerProfile?['phone'] ?? '';
  String get _trainerId =>
      widget.trainerProfile?['id'] ?? '';

  bool _isMatchingTrainer(Map<String, dynamic> a) {
    final senderRole = (a['sender_role'] ?? '').toString().toLowerCase();
    final isTrainerSender = senderRole == 'trainer' || senderRole == 'guru' || a['trainer_id'] != null;
    if (!isTrainerSender) return false;

    final possibleIds = {
      _trainerId,
      widget.trainerProfile?['id']?.toString(),
      widget.trainerProfile?['trainer_id']?.toString(),
      widget.trainerProfile?['profile_id']?.toString(),
      SupabaseService().currentUserProfile?['id']?.toString(),
      SupabaseService().currentUserProfile?['trainer_id']?.toString(),
      SupabaseService().currentUserProfile?['profile_id']?.toString(),
    }.where((id) => id != null && id.toString().trim().isNotEmpty).toSet();

    final aTrainerId = a['trainer_id']?.toString().trim();
    if (aTrainerId != null && aTrainerId.isNotEmpty && possibleIds.contains(aTrainerId)) {
      return true;
    }

    String normalize(String s) {
      return s.toLowerCase()
          .replaceAll(RegExp(r'\b(guru|smt|sri|dr|mr|mrs|prof)\.?\b', caseSensitive: false), '')
          .replaceAll(RegExp(r'[^a-z0-9]'), '')
          .trim();
    }

    final tNorm = normalize(_trainerName);
    final aName = (a['trainer_name'] ?? a['created_by'] ?? '').toString();
    final aNorm = normalize(aName);

    if (tNorm.isNotEmpty && aNorm.isNotEmpty) {
      if (tNorm.contains(aNorm) || aNorm.contains(tNorm)) return true;
    }

    return false;
  }

  DateTime _getExactMessageDateTime(dynamic item) {
    if (item is Map<String, dynamic> || item is Map) {
      final rawCreated = item['created_at'];
      if (rawCreated != null && rawCreated.toString().trim().isNotEmpty) {
        try {
          return DateTime.parse(rawCreated.toString()).toLocal();
        } catch (_) {}
      }
      final rawPub = (item['publish_date'] ?? item['date'])?.toString().trim();
      final rawTime = (item['publish_time'] ?? item['time'])?.toString().trim();
      if (rawPub != null && rawPub.isNotEmpty) {
        try {
          DateTime base = DateTime.parse(rawPub).toLocal();
          if (rawTime != null && rawTime.isNotEmpty) {
            final match = RegExp(r'(\d+):(\d+)\s*(AM|PM)?', caseSensitive: false).firstMatch(rawTime);
            if (match != null) {
              int h = int.parse(match.group(1)!);
              int m = int.parse(match.group(2)!);
              final ap = match.group(3)?.toUpperCase();
              if (ap == 'PM' && h < 12) h += 12;
              if (ap == 'AM' && h == 12) h = 0;
              return DateTime(base.year, base.month, base.day, h, m);
            }
          }
          return base;
        } catch (_) {}
      }
    } else if (item != null) {
      final s = item.toString().trim();
      if (s.isNotEmpty) {
        try {
          return DateTime.parse(s).toLocal();
        } catch (_) {}
      }
    }
    return DateTime(2000);
  }

  String _getDateGroupLabel(dynamic val) {
    final dt = _getExactMessageDateTime(val);
    if (dt.year <= 2000) return 'RECENT';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final msgDay = DateTime(dt.year, dt.month, dt.day);

    final diffDays = today.difference(msgDay).inDays;
    if (diffDays == 0) {
      return 'TODAY';
    } else if (diffDays == 1) {
      return 'YESTERDAY';
    } else {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      final dayStr = dt.day.toString().padLeft(2, '0');
      final monthStr = months[dt.month - 1];
      return '$dayStr $monthStr ${dt.year}';
    }
  }

  String _formatMessageTime(Map<String, dynamic> msg) {
    final dt = _getExactMessageDateTime(msg);
    if (dt.year > 2000) {
      final hour = dt.hour == 0 ? 12 : (dt.hour > 12 ? dt.hour - 12 : dt.hour);
      final amPm = dt.hour >= 12 ? 'PM' : 'AM';
      final minute = dt.minute.toString().padLeft(2, '0');
      return '$hour:$minute $amPm';
    }
    return (msg['time'] ?? '10:00 AM').toString();
  }

  @override
  void initState() {
    super.initState();
    SupabaseService().markAllMessagesAsRead();
    final cached = SupabaseService().getCachedMessageAnnouncements();
    if (cached.isNotEmpty) {
      _announcements = cached.where(_isMatchingTrainer).toList();
      _sortAnnouncements();
      if (_announcements.isNotEmpty) {
        _isLoading = false;
        _scrollToBottom();
      }
    }
    _loadData();
  }

  void _sortAnnouncements() {
    _announcements.sort((a, b) {
      final da = _getExactMessageDateTime(a);
      final db = _getExactMessageDateTime(b);
      return da.compareTo(db);
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
    Future.delayed(const Duration(milliseconds: 60), () {
      if (mounted && _scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted && _scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final assigned = widget.trainerProfile?['assigned_courses'];
    if (assigned is List && assigned.isNotEmpty) {
      _myCourses = List<Map<String, dynamic>>.from(assigned);
    }
    setState(() => _isLoading = _announcements.isEmpty);
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
        '${ApiConstants.baseUrl}/api/trainer/batches?trainerName=$nameParam&phone=$phoneParam',
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
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/announcements?_t=${DateTime.now().millisecondsSinceEpoch}');
      final res = await http.get(uri).timeout(const Duration(seconds: 12));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['announcements'] is List) {
          final all = List<Map<String, dynamic>>.from(data['announcements']);
          // Strictly display ONLY guru sent messages to students by this guru
          _announcements = all.where(_isMatchingTrainer).toList();
          _sortAnnouncements();
          SupabaseService().markAllMessagesAsRead(_announcements);
          _scrollToBottom();
          return;
        }
      }
    } catch (e) {
      debugPrint('Error loading announcements via HTTP: $e');
    }

    // Direct Supabase fallback
    try {
      final msgs = await SupabaseService().getMessageAnnouncements(forceRefresh: true);
      _announcements = msgs.where(_isMatchingTrainer).toList();
      _sortAnnouncements();
      SupabaseService().markAllMessagesAsRead(_announcements);
      _scrollToBottom();
    } catch (e) {
      debugPrint('Error loading announcements fallback: $e');
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
    return Scaffold(
      backgroundColor: const Color(0xFFECE5DD), // WhatsApp chat neutral background
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 1,
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF8A064D),
                border: Border.all(color: LaasyaColors.accentGold, width: 1.5),
              ),
              child: const Center(
                child: Icon(Icons.campaign_rounded, color: LaasyaColors.accentGold, size: 20),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Announcements',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  Text(
                    'Faculty Broadcast • $_trainerName',
                    style: const TextStyle(fontSize: 11, color: LaasyaColors.accentGold),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 20),
            onPressed: _loadData,
            tooltip: 'Refresh announcements',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // WhatsApp-style Message Feed
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
                  : _announcements.isEmpty
                      ? Center(
                          child: Container(
                            margin: const EdgeInsets.all(24),
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFDEF7EC),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.campaign_outlined, size: 36, color: Color(0xFF03543F)),
                                ),
                                const SizedBox(height: 14),
                                const Text(
                                  'No Announcements Sent Yet',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: LaasyaColors.textDark,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Use the button below to broadcast notices to students enrolled in your batches.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadData,
                          color: LaasyaColors.primary,
                          child: ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.fromLTRB(14, 8, 14, 16),
                            itemCount: _announcements.length,
                            itemBuilder: (context, index) {
                              final ann = _announcements[index];
                              final title = ann['title'] ?? 'Announcement';
                              final message = ann['message'] ?? '';
                              final course = ann['target_course_title'] ?? 'Enrolled Course';
                              final batch = ann['target_batch_name'] ?? 'All Batches';
                              final typeTag = ann['type_tag'] ?? 'General';
                              final timeStr = _formatMessageTime(ann);
                              final targetStudentNames = (ann['target_student_names'] ?? '').toString();

                              // Date Header Divider logic
                              final currentGroup = _getDateGroupLabel(ann);
                              bool showDateHeader = false;
                              if (index == 0) {
                                showDateHeader = true;
                              } else {
                                final prevMsg = _announcements[index - 1];
                                final prevGroup = _getDateGroupLabel(prevMsg);
                                showDateHeader = currentGroup != prevGroup;
                              }

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    if (showDateHeader)
                                      Container(
                                        alignment: Alignment.center,
                                        margin: const EdgeInsets.only(top: 8, bottom: 12),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4.5),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withOpacity(0.95),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: Colors.grey.shade300, width: 0.8),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withOpacity(0.04),
                                                blurRadius: 4,
                                                offset: const Offset(0, 1),
                                              ),
                                            ],
                                          ),
                                          child: Text(
                                            currentGroup,
                                            style: const TextStyle(
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 0.5,
                                              color: Color(0xFF555555),
                                            ),
                                          ),
                                        ),
                                      ),

                                    // WhatsApp-style Sent Chat Bubble
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: Container(
                                        constraints: BoxConstraints(
                                          maxWidth: MediaQuery.of(context).size.width * 0.86,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE7FFDB), // WhatsApp sent bubble tone
                                          borderRadius: const BorderRadius.only(
                                            topLeft: Radius.circular(14),
                                            topRight: Radius.circular(14),
                                            bottomLeft: Radius.circular(14),
                                            bottomRight: Radius.circular(3),
                                          ),
                                          border: Border.all(color: const Color(0xFFBCE3A8), width: 0.8),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.04),
                                              blurRadius: 4,
                                              offset: const Offset(0, 1),
                                            ),
                                          ],
                                        ),
                                        padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            // Top info chips (Type tag & Course • Batch)
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFF075E54),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    typeTag.toUpperCase(),
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 8.5,
                                                      fontWeight: FontWeight.bold,
                                                      letterSpacing: 0.4,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                Flexible(
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: Colors.white.withOpacity(0.85),
                                                      borderRadius: BorderRadius.circular(4),
                                                      border: Border.all(color: const Color(0xFF86EFAC), width: 0.6),
                                                    ),
                                                    child: Text(
                                                      '$course • $batch',
                                                      style: const TextStyle(
                                                        color: Color(0xFF075E54),
                                                        fontSize: 9.5,
                                                        fontWeight: FontWeight.w600,
                                                      ),
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            if (targetStudentNames.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                'To: $targetStudentNames',
                                                style: const TextStyle(
                                                  fontSize: 9.5,
                                                  fontStyle: FontStyle.italic,
                                                  color: Color(0xFF1B5E20),
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                            const SizedBox(height: 6),

                                            // Title
                                            Text(
                                              title,
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF1E1E1E),
                                              ),
                                            ),
                                            const SizedBox(height: 4),

                                            // Message
                                            Text(
                                              message,
                                              style: const TextStyle(
                                                fontSize: 12.5,
                                                color: Colors.black87,
                                                height: 1.35,
                                              ),
                                            ),
                                            const SizedBox(height: 6),

                                            // Time & Double-Check Mark
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              mainAxisAlignment: MainAxisAlignment.end,
                                              children: [
                                                const Spacer(),
                                                Text(
                                                  timeStr,
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    color: Colors.grey.shade700,
                                                  ),
                                                ),
                                                const SizedBox(width: 4),
                                                const Icon(
                                                  Icons.done_all_rounded,
                                                  size: 14,
                                                  color: Color(0xFF34B7F1), // WhatsApp blue double-ticks
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
            ),

            // Bottom Sticky Bar: WhatsApp Typing Bar replaced with "+ Create New Announcement" Button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F0F0),
                border: Border(top: BorderSide(color: Colors.grey.shade300, width: 0.8)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 6,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _openCreateAnnouncementSheet,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF075E54), // WhatsApp / Academy Green
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    elevation: 1,
                  ),
                  icon: const Icon(Icons.add_comment_rounded, size: 20, color: Color(0xFFF9E33A)),
                  label: const Text(
                    '+ Create New Announcement',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

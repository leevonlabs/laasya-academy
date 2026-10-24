import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../../core/utils/avatar_helper.dart';

class StudentMessagesScreen extends StatefulWidget {
  final bool? onlyAdmin;

  const StudentMessagesScreen({
    super.key,
    this.onlyAdmin,
  });

  @override
  State<StudentMessagesScreen> createState() => _StudentMessagesScreenState();
}

class _StudentMessagesScreenState extends State<StudentMessagesScreen> {
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  int _unreadCount = 0;
  final ScrollController _scrollController = ScrollController();
  Timer? _realtimeSyncTimer;

  @override
  void initState() {
    super.initState();
    SupabaseService().markAllMessagesAsRead();
    _unreadCount = 0;
    final cached = SupabaseService().getCachedMessageAnnouncements();
    final profile = SupabaseService().currentUserProfile;
    final role = (profile?['role'] ?? '').toString().toLowerCase();
    final isTrainer = widget.onlyAdmin == true || role.contains('trainer') || role.contains('guru') || role == 'teacher';
    if (cached.isNotEmpty) {
      _messages = cached.where((m) {
        if (isTrainer) {
          final senderRole = (m['sender_role'] ?? '').toString().toLowerCase();
          final isGuruMsg = senderRole.contains('trainer') ||
              senderRole.contains('guru') ||
              m['trainer_id'] != null ||
              (m['trainer_name'] != null && m['trainer_name'].toString().trim().isNotEmpty);
          if (isGuruMsg) return false;
        }
        return true;
      }).toList();

      // Sort chronologically: oldest on top, newest at the bottom
      _messages.sort((a, b) {
        final da = _getExactMessageDateTime(a);
        final db = _getExactMessageDateTime(b);
        return da.compareTo(db);
      });
      _isLoading = false;
      _scrollToBottom();
    }
    SupabaseService().preloadTrainerAvatars().then((_) {
      if (mounted) setState(() {});
    });
    _loadMessages();
    _realtimeSyncTimer = Timer.periodic(const Duration(seconds: 25), (_) {
      if (mounted) {
        _loadMessages(isBackgroundSync: true);
      }
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
    _realtimeSyncTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  bool _areMessageListsIdentical(List<Map<String, dynamic>> listA, List<Map<String, dynamic>> listB) {
    if (listA.length != listB.length) return false;
    for (int i = 0; i < listA.length; i++) {
      final a = listA[i];
      final b = listB[i];
      if (a['id'] != b['id'] ||
          a['title'] != b['title'] ||
          a['message'] != b['message'] ||
          a['updated_at'] != b['updated_at']) {
        return false;
      }
    }
    return true;
  }

  Future<void> _loadMessages({bool isBackgroundSync = false}) async {
    if (_messages.isEmpty && !isBackgroundSync) {
      setState(() => _isLoading = true);
    }
    final msgs = await SupabaseService().getMessageAnnouncements(forceRefresh: true);
    if (mounted) {
      final now = DateTime.now();
      final profile = SupabaseService().currentUserProfile;
      final role = (profile?['role'] ?? '').toString().toLowerCase();
      final isTrainer = widget.onlyAdmin == true || role.contains('trainer') || role.contains('guru') || role == 'teacher';

      // Enforce 30-day lifespan rule: Automatically clear messages older than 30 days
      final validMsgs = msgs.where((m) {
        final dt = _getExactMessageDateTime(m);
        if (dt.year > 2000 && now.difference(dt).inDays > 30) {
          return false;
        }
        if (isTrainer) {
          final senderRole = (m['sender_role'] ?? '').toString().toLowerCase();
          final isGuruMsg = senderRole.contains('trainer') ||
              senderRole.contains('guru') ||
              m['trainer_id'] != null ||
              (m['trainer_name'] != null && m['trainer_name'].toString().trim().isNotEmpty);
          if (isGuruMsg) return false;
        }
        return true;
      }).toList();

      // Deduplicate messages by content fingerprint
      final seenKeys = <String>{};
      final dedupedValid = <Map<String, dynamic>>[];
      for (final m in validMsgs) {
        final t = (m['title'] ?? '').toString().trim().toLowerCase();
        final msg = (m['message'] ?? '').toString().trim().toLowerCase();
        final d = (m['publish_date'] ?? m['date'] ?? '').toString().trim();
        final key = '$t|$msg|$d';
        if (!seenKeys.contains(key)) {
          seenKeys.add(key);
          dedupedValid.add(m);
        }
      }

      // Sort chronologically: oldest at top (8am), newest at bottom (9pm)
      dedupedValid.sort((a, b) {
        final da = _getExactMessageDateTime(a);
        final db = _getExactMessageDateTime(b);
        return da.compareTo(db);
      });

      // Prevent continuous re-rendering, flickering, and scroll jumping if content didn't change
      if (isBackgroundSync && _areMessageListsIdentical(_messages, dedupedValid)) {
        return;
      }

      final hasNewMessages = dedupedValid.length != _messages.length;

      setState(() {
        _messages = dedupedValid;
        _isLoading = false;
        _unreadCount = 0;
      });

      // Mark as read after user has seen the messages
      SupabaseService().markAllMessagesAsRead(validMsgs);

      // Only reposition at bottom if list changed or during initial/manual load
      if (hasNewMessages || !isBackgroundSync) {
        _scrollToBottom();
      }
    }
  }

  DateTime _getExactMessageDateTime(dynamic item) {
    if (item is Map) {
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

  List<Map<String, dynamic>> _parseActionLinks(dynamic rawLinks) {
    if (rawLinks == null) return [];
    if (rawLinks is List) {
      return rawLinks.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
    }
    if (rawLinks is String && rawLinks.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(rawLinks);
        if (decoded is List) {
          return decoded.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
        }
      } catch (_) {}
    }
    return [];
  }

  Future<void> _launchActionUrl(String url) async {
    final clean = url.trim();
    if (clean.isEmpty) return;
    try {
      final uri = Uri.parse(clean.startsWith('http') ? clean : 'https://$clean');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Cannot open URL: $clean')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error opening link: $e')),
        );
      }
    }
  }

  Color _getTagColor(String? tag) {
    switch (tag) {
      case 'Holiday':
        return const Color(0xFFD97706);
      case 'Schedule change':
        return const Color(0xFF7C3AED);
      case 'Cancellation':
        return const Color(0xFFDC2626);
      case 'Fee reminder':
        return const Color(0xFFB45309);
      default:
        return const Color(0xFF0D9488);
    }
  }

  Widget _buildNoticeImage(String? imageUrl) {
    if (imageUrl == null || imageUrl.trim().isEmpty) {
      return const SizedBox.shrink();
    }

    final cleanUrl = imageUrl.trim();
    final fileName = cleanUrl.split('/').last.split('?').first;

    const bundledMap = {
      'banner_bharatanatyam_kids.jpg': 'assets/images/banner_bharatanatyam_kids.jpg',
      'banner_cinema_acting_workshop.jpg': 'assets/images/banner_cinema_acting_workshop.jpg',
      'banner_hiring_bharatanatyam.jpg': 'assets/images/banner_hiring_bharatanatyam.jpg',
      'banner_zumba_fitness.png': 'assets/images/banner_zumba_fitness.png',
      'cultural_banner.png': 'assets/images/cultural_banner.png',
      'crest_logo.png': 'assets/images/crest_logo.png',
      'crest_logo.jpg': 'assets/images/crest_logo.jpg',
      'app_logo.png': 'assets/images/app_logo.png',
      'header_logo.png': 'assets/images/header_logo.png',
      'logo_banner.png': 'assets/images/logo_banner.png',
    };

    if (bundledMap.containsKey(fileName)) {
      return Image.asset(
        bundledMap[fileName]!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
      );
    }

    if (cleanUrl.startsWith('assets/')) {
      return Image.asset(
        cleanUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
      );
    }

    if (cleanUrl.startsWith('data:image')) {
      try {
        final commaIdx = cleanUrl.indexOf(',');
        final base64Str = commaIdx != -1 ? cleanUrl.substring(commaIdx + 1) : cleanUrl;
        return Image.memory(
          base64Decode(base64Str),
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => const SizedBox.shrink(),
        );
      } catch (_) {
        return const SizedBox.shrink();
      }
    }

    String fullUrl = cleanUrl;
    if (fullUrl.startsWith('/')) {
      fullUrl = '${ApiConstants.baseUrl}$fullUrl';
    }

    return Image.network(
      fullUrl,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
    );
  }

  void _showFullImageDialog(String imageUrl) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(12),
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                color: Colors.black,
                child: InteractiveViewer(
                  maxScale: 4.0,
                  child: _buildNoticeImage(imageUrl),
                ),
              ),
            ),
            IconButton(
              icon: const CircleAvatar(
                backgroundColor: Colors.black54,
                radius: 16,
                child: Icon(Icons.close, color: Colors.white, size: 18),
              ),
              onPressed: () => Navigator.of(ctx).pop(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBody(String rawContent, bool isHoliday) {
    if (!isHoliday) {
      return Text(
        rawContent,
        style: const TextStyle(
          fontSize: 12.5,
          color: Color(0xFF202C33),
          height: 1.4,
        ),
      );
    }

    // 1. Remove redundant "Holiday Alert: <title>" line if present
    String cleaned = rawContent
        .replaceFirst(RegExp(r'^Holiday Alert:[^\n]*\n*', caseSensitive: false), '')
        .trim();

    // 2. Parse "Holiday Date:" and "Reason:"
    final dateMatch = RegExp(r'Holiday Date:\s*([^\n]+)', caseSensitive: false).firstMatch(cleaned);
    final reasonMatch = RegExp(r'Reason:\s*\n*([\s\S]*)', caseSensitive: false).firstMatch(cleaned);

    if (dateMatch != null) {
      final dateStr = dateMatch.group(1)?.trim() ?? '';
      final reasonText = reasonMatch?.group(1)?.trim() ??
          cleaned.replaceFirst(RegExp(r'Holiday Date:[^\n]*', caseSensitive: false), '').trim();

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Highlighted Date with distinct amber color & badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.event_available_rounded, size: 14, color: Color(0xFFB45309)),
                const SizedBox(width: 6),
                Text(
                  'Holiday Date: $dateStr',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF92400E),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Bold Reason heading only; regular description text
          const Text(
            'Reason:',
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111B21),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            reasonText,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.normal,
              color: Color(0xFF202C33),
              height: 1.4,
            ),
          ),
        ],
      );
    }

    return Text(
      cleaned,
      style: const TextStyle(
        fontSize: 12.5,
        color: Color(0xFF202C33),
        height: 1.4,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFECE5DD), // Message channel neutral tone
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 1.5,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            // Academy Logo Avatar
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF8A064D),
                border: Border.all(color: LaasyaColors.accentGold, width: 1.5),
              ),
              child: const Center(
                child: Text(
                  'LC',
                  style: TextStyle(
                    color: LaasyaColors.accentGold,
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
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
                          _unreadCount > 0 ? '$_unreadCount UNREAD MESSAGES' : 'MESSAGES (ALL READ)',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: _unreadCount > 0 ? const Color(0xFF590231) : Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Row(
                    children: [
                      Flexible(
                        child: Text(
                          'Notice Board',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.verified_rounded, size: 14, color: LaasyaColors.accentGold),
                    ],
                  ),
                  const Text(
                    'Official Broadcast • 30-Day Retention',
                    style: TextStyle(
                      fontSize: 10,
                      color: Color(0xFFE5D5DF),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 20),
            onPressed: _loadMessages,
            tooltip: 'Check for new messages',
          ),
          IconButton(
            icon: const Icon(Icons.info_outline_rounded, color: Colors.white, size: 20),
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  title: const Row(
                    children: [
                      Icon(Icons.campaign_rounded, color: LaasyaColors.primary),
                      SizedBox(width: 8),
                      Text('Academy Broadcasts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  content: const Text(
                    'This is an official announcement channel from Laasya Cultural Academy management. All important notices, class schedules, holiday circulars, and fee reminders are shared directly here. Messages have a 30-day retention period and are automatically cleared afterwards.',
                    style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Understood'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Security & Broadcast Info Strip
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 6),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: const Row(
                children: [
                  Icon(Icons.lock_rounded, size: 14, color: Color(0xFF92400E)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Official Academy Channel • 30-day retention for notices & announcements.',
                      style: TextStyle(
                        fontSize: 11,
                        color: Color(0xFF92400E),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Messages Stream / Feed
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: LaasyaColors.primary),
                    )
                  : _messages.isEmpty
                      ? RefreshIndicator(
                          onRefresh: _loadMessages,
                          color: LaasyaColors.primary,
                          child: ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
                            children: [
                              Container(
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
                                      child: const Icon(Icons.mark_chat_read_rounded, size: 36, color: Color(0xFF03543F)),
                                    ),
                                    const SizedBox(height: 14),
                                    const Text(
                                      'All Caught Up!',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: LaasyaColors.textDark,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    const Text(
                                      'No new circulars or notices at this time. Important updates from the Academy Director will appear here.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(fontSize: 12, color: Colors.grey),
                                    ),
                                    const SizedBox(height: 16),
                                    ElevatedButton.icon(
                                      onPressed: _loadMessages,
                                      icon: const Icon(Icons.refresh_rounded, size: 16),
                                      label: const Text('Check for Updates', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: LaasyaColors.primary,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                                        elevation: 1,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadMessages,
                          color: LaasyaColors.primary,
                          child: ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.fromLTRB(14, 6, 14, 16),
                            itemCount: _messages.length,
                            itemBuilder: (context, index) {
                              final msg = _messages[index];
                              final rawTitle = (msg['title'] ?? 'Notice').toString();
                              final isHoliday = (msg['type_tag'] == 'Holiday' ||
                                  rawTitle.toLowerCase().contains('holiday') ||
                                  (msg['message'] ?? '').toString().toLowerCase().contains('holiday'));
                              String cleanTitle = rawTitle;
                              if (isHoliday) {
                                cleanTitle = rawTitle
                                    .replaceFirst(RegExp(r'^(Holiday Notice:\s*|Holiday Alert:\s*)', caseSensitive: false), '')
                                    .trim();
                              }
                              final title = isHoliday ? cleanTitle : rawTitle;
                              final content = (msg['message'] ?? '').toString();
                              final tag = msg['type_tag'];
                              final tagColor = _getTagColor(tag);

                              final isGuru = ((msg['sender_role'] ?? '').toString().toLowerCase().contains('trainer') ||
                                              (msg['sender_role'] ?? '').toString().toLowerCase().contains('guru') ||
                                              msg['trainer_id'] != null ||
                                              (msg['trainer_name'] != null && msg['trainer_name'].toString().trim().isNotEmpty));
                              String sender;
                              if (isGuru) {
                                final tName = (msg['trainer_name'] ?? msg['created_by'] ?? 'Faculty').toString().trim();
                                sender = tName.toLowerCase().startsWith('guru') ? tName : 'Guru $tName';
                              } else {
                                sender = msg['created_by'] ?? msg['sender_name'] ?? 'Academy Director';
                              }
                              final timeStr = _formatMessageTime(msg);
                              final imageUrl = msg['image_url']?.toString();
                              final actionLinks = _parseActionLinks(msg['action_links']);

                              // Compute date grouping
                              final currentGroup = _getDateGroupLabel(msg);

                              bool showDateHeader = false;
                              if (index == 0) {
                                showDateHeader = true;
                              } else {
                                final prevMsg = _messages[index - 1];
                                final prevGroup = _getDateGroupLabel(prevMsg);
                                showDateHeader = currentGroup != prevGroup;
                              }

                              return Padding(
                                key: ValueKey(msg['id'] ?? 'msg_$index'),
                                padding: const EdgeInsets.only(bottom: 14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    // Date Divider Pill (Only shown once per date group!)
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
                                            style: TextStyle(
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.w800,
                                              color: Colors.grey.shade800,
                                              letterSpacing: 0.8,
                                            ),
                                          ),
                                        ),
                                      ),

                                    // WhatsApp Group Chat Style Message Bubble with Sender Avatar DP
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        _buildSenderAvatar(msg, isGuru),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: const BorderRadius.only(
                                            topLeft: Radius.circular(2),
                                            topRight: Radius.circular(16),
                                            bottomLeft: Radius.circular(16),
                                            bottomRight: Radius.circular(16),
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.07),
                                              blurRadius: 5,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        padding: const EdgeInsets.all(12),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            // Sender & Category Tag Row
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Flexible(
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Flexible(
                                                        child: Text(
                                                          sender,
                                                          style: TextStyle(
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.bold,
                                                            color: ((msg['sender_role'] ?? '').toString().toLowerCase().contains('trainer') || (msg['sender_role'] ?? '').toString().toLowerCase().contains('guru') || msg['trainer_id'] != null)
                                                                ? const Color(0xFF9A3412)
                                                                : const Color(0xFF075E54),
                                                          ),
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 5),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                                        decoration: BoxDecoration(
                                                          color: (((msg['sender_role'] ?? '').toString().toLowerCase().contains('trainer') || (msg['sender_role'] ?? '').toString().toLowerCase().contains('guru') || msg['trainer_id'] != null)
                                                                  ? const Color(0xFFC2410C)
                                                                  : const Color(0xFF075E54))
                                                              .withOpacity(0.12),
                                                          borderRadius: BorderRadius.circular(4),
                                                          border: Border.all(
                                                            color: (((msg['sender_role'] ?? '').toString().toLowerCase().contains('trainer') || (msg['sender_role'] ?? '').toString().toLowerCase().contains('guru') || msg['trainer_id'] != null)
                                                                    ? const Color(0xFFC2410C)
                                                                    : const Color(0xFF075E54))
                                                                .withOpacity(0.3),
                                                            width: 0.8,
                                                          ),
                                                        ),
                                                        child: Text(
                                                          ((msg['sender_role'] ?? '').toString().toLowerCase().contains('trainer') || (msg['sender_role'] ?? '').toString().toLowerCase().contains('guru') || msg['trainer_id'] != null)
                                                              ? 'Guru / Trainer'
                                                              : 'Admin / Director',
                                                          style: TextStyle(
                                                            fontSize: 8.5,
                                                            fontWeight: FontWeight.bold,
                                                            color: ((msg['sender_role'] ?? '').toString().toLowerCase().contains('trainer') || (msg['sender_role'] ?? '').toString().toLowerCase().contains('guru') || msg['trainer_id'] != null)
                                                                ? const Color(0xFFC2410C)
                                                                : const Color(0xFF075E54),
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                if (tag != null)
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: tagColor.withOpacity(0.12),
                                                      borderRadius: BorderRadius.circular(6),
                                                      border: Border.all(color: tagColor.withOpacity(0.3)),
                                                    ),
                                                    child: Text(
                                                      tag,
                                                      style: TextStyle(
                                                        color: tagColor,
                                                        fontSize: 9,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                              ],
                                            ),

                                            // Attached Image Media inside bubble
                                            if (imageUrl != null && imageUrl.isNotEmpty) ...[
                                              const SizedBox(height: 8),
                                              GestureDetector(
                                                onTap: () => _showFullImageDialog(imageUrl),
                                                child: ClipRRect(
                                                  borderRadius: BorderRadius.circular(12),
                                                  child: Container(
                                                    constraints: const BoxConstraints(maxHeight: 220),
                                                    width: double.infinity,
                                                    color: Colors.black.withOpacity(0.04),
                                                    child: Stack(
                                                      alignment: Alignment.bottomRight,
                                                      children: [
                                                        _buildNoticeImage(imageUrl),
                                                        Container(
                                                          margin: const EdgeInsets.all(6),
                                                          padding: const EdgeInsets.all(4),
                                                          decoration: BoxDecoration(
                                                            color: Colors.black54,
                                                            borderRadius: BorderRadius.circular(6),
                                                          ),
                                                          child: const Icon(Icons.fullscreen_rounded, color: Colors.white, size: 16),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ],

                                            const SizedBox(height: 6),

                                            // Headline
                                            Text(
                                              title,
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                color: isHoliday ? const Color(0xFF590231) : const Color(0xFF111B21), // Notice title (burgundy for holiday)
                                                height: 1.25,
                                              ),
                                            ),

                                            const SizedBox(height: 6),

                                            // Body Text
                                            _buildMessageBody(content, isHoliday),

                                            if (actionLinks.isNotEmpty) ...[
                                              const SizedBox(height: 10),
                                              Wrap(
                                                spacing: 8,
                                                runSpacing: 8,
                                                children: actionLinks.map<Widget>((link) {
                                                  final linkTitle = link['title']?.toString() ?? 'Open Link';
                                                  final linkUrl = link['url']?.toString() ?? '';
                                                  if (linkTitle.trim().isEmpty && linkUrl.trim().isEmpty) {
                                                    return const SizedBox.shrink();
                                                  }
                                                  return InkWell(
                                                    onTap: () => _launchActionUrl(linkUrl),
                                                    borderRadius: BorderRadius.circular(10),
                                                    child: Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                                                      decoration: BoxDecoration(
                                                        color: const Color(0xFFF0FDF4),
                                                        borderRadius: BorderRadius.circular(10),
                                                        border: Border.all(color: const Color(0xFF31C48D)),
                                                      ),
                                                      child: Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          const Icon(Icons.link_rounded, size: 14, color: Color(0xFF075E54)),
                                                          const SizedBox(width: 6),
                                                          Text(
                                                            linkTitle.isNotEmpty ? linkTitle : 'Open Link',
                                                            style: const TextStyle(
                                                              fontSize: 12,
                                                              fontWeight: FontWeight.bold,
                                                              color: Color(0xFF075E54),
                                                            ),
                                                          ),
                                                          const SizedBox(width: 4),
                                                          const Icon(Icons.open_in_new_rounded, size: 12, color: Color(0xFF075E54)),
                                                        ],
                                                      ),
                                                    ),
                                                  );
                                                }).toList(),
                                              ),
                                            ],

                                            const SizedBox(height: 6),

                                            // Timestamp & Delivered Double Checks Row
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.end,
                                              children: [
                                                Text(
                                                  timeStr,
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    color: Colors.grey.shade600,
                                                  ),
                                                ),
                                                const SizedBox(width: 4),
                                                // Delivered Double Checkmarks
                                                const Icon(
                                                  Icons.done_all_rounded,
                                                  size: 14,
                                                  color: Color(0xFF34B7F1), // Delivered blue ticks
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                            },
                          ),
                        ),
            ),

            // Bottom Admin-Only Notice Strip (Official Broadcast Channel Bar)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(color: Colors.grey.shade300, width: 0.8),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF2F8),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.lock_outline_rounded, color: LaasyaColors.primary, size: 18),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Only academy administrators can post messages to this channel.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSenderAvatar(Map<String, dynamic> msg, bool isGuru) {
    if (isGuru) {
      String avatarUrl = (msg['trainer_avatar_url'] ?? msg['avatar_url'] ?? '').toString().trim();
      final senderName = (msg['trainer_name'] ?? msg['sender_name'] ?? msg['created_by'] ?? 'Guru').toString();
      if (avatarUrl.isEmpty) {
        final resolved = SupabaseService().getTrainerAvatar(msg['trainer_id']?.toString(), senderName);
        if (resolved != null && resolved.isNotEmpty) {
          avatarUrl = resolved;
        }
      }
      final initials = senderName.trim().split(' ').where((p) => p.isNotEmpty).map((p) => p[0]).take(2).join().toUpperCase();

      final provider = getAvatarImageProvider(avatarUrl.isNotEmpty ? avatarUrl : null);

      return Container(
        margin: const EdgeInsets.only(top: 2),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFF9E33A), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: CircleAvatar(
          radius: 17,
          backgroundColor: const Color(0xFF8A064D),
          backgroundImage: provider,
          child: provider == null
              ? Text(
                  initials.isNotEmpty ? initials : 'G',
                  style: const TextStyle(
                    color: Color(0xFFF9E33A),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                )
              : null,
        ),
      );
    } else {
      String adminAvatar = (msg['admin_avatar_url'] ?? '').toString().trim();
      if (adminAvatar.isEmpty || adminAvatar == 'null') {
        adminAvatar = (msg['avatar_url'] ?? '').toString().trim();
      }
      if (adminAvatar.isEmpty || adminAvatar == 'null') {
        final resolved = SupabaseService().getAdminAvatar();
        if (resolved != null && resolved.isNotEmpty && resolved != 'null') {
          adminAvatar = resolved;
        }
      }
      final provider = getAvatarImageProvider((adminAvatar.isNotEmpty && adminAvatar != 'null') ? adminAvatar : null);

      return Container(
        margin: const EdgeInsets.only(top: 2),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFF075E54), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: CircleAvatar(
          radius: 17,
          backgroundColor: Colors.white,
          backgroundImage: provider,
          child: provider == null
              ? ClipOval(
                  child: Image.asset(
                    'assets/images/header_logo.png',
                    width: 30,
                    height: 30,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const CircleAvatar(
                      radius: 17,
                      backgroundColor: Color(0xFF075E54),
                      child: Text('👑', style: TextStyle(fontSize: 14)),
                    ),
                  ),
                )
              : null,
        ),
      );
    }
  }
}

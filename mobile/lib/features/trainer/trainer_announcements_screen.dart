import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../../core/utils/avatar_helper.dart';
import 'trainer_create_announcement_screen.dart';

class TrainerAnnouncementsScreen extends StatefulWidget {
  final Map<String, dynamic>? trainerProfile;
  final bool isMessagesMode; // true = Messages (Admin to Guru, read-only), false = Announcements (Guru to batches)

  const TrainerAnnouncementsScreen({
    super.key,
    this.trainerProfile,
    this.isMessagesMode = false,
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
  Timer? _realtimePollTimer;
  RealtimeChannel? _realtimeChannel;

  String get _trainerName =>
      widget.trainerProfile?['full_name'] ??
      SupabaseService().currentUserProfile?['full_name'] ??
      'Faculty Guru';
  String get _trainerPhone =>
      widget.trainerProfile?['phone'] ??
      SupabaseService().currentUserProfile?['phone'] ??
      '';
  String get _trainerId =>
      (widget.trainerProfile?['id'] ??
      widget.trainerProfile?['trainer_id'] ??
      SupabaseService().currentUserProfile?['id'] ??
      SupabaseService().currentUserProfile?['trainer_id'] ??
      '').toString();

  Widget _buildGuruAvatarWidget() {
    final avatar = (widget.trainerProfile?['avatar_url'] ??
            SupabaseService().currentUserProfile?['avatar_url'] ??
            '')
        .toString()
        .trim();
    Widget child;
    if (avatar.isNotEmpty) {
      if (avatar.startsWith('data:image')) {
        try {
          final b64 = avatar.split(',').last;
          child = Image.memory(
            base64Decode(b64),
            width: 36,
            height: 36,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _guruInitials(),
          );
        } catch (_) {
          child = _guruInitials();
        }
      } else {
        final fullAvatarUrl = avatar.startsWith('/') ? '${ApiConstants.baseUrl}$avatar' : avatar;
        child = CachedNetworkImage(
          imageUrl: fullAvatarUrl,
          width: 36,
          height: 36,
          fit: BoxFit.cover,
          memCacheWidth: 72,
          memCacheHeight: 72,
          placeholder: (_, __) => _guruInitials(),
          errorWidget: (_, __, ___) => _guruInitials(),
        );
      }
    } else {
      child = _guruInitials();
    }

    return Container(
      width: 36,
      height: 36,
      margin: const EdgeInsets.only(top: 2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFF8A064D),
        border: Border.all(color: LaasyaColors.accentGold, width: 1.5),
      ),
      child: ClipOval(child: child),
    );
  }

  Widget _guruInitials() {
    final name = _trainerName.trim();
    final init = name.isNotEmpty ? name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase() : 'G';
    return Center(
      child: Text(
        init,
        style: const TextStyle(
          color: LaasyaColors.accentGold,
          fontWeight: FontWeight.w900,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildAdminAvatarWidget([String? itemAvatar]) {
    String adminAvatar = (itemAvatar != null && itemAvatar.trim().isNotEmpty && itemAvatar != 'null')
        ? itemAvatar.trim()
        : '';
    if (adminAvatar.isEmpty || adminAvatar == 'null') {
      final resolved = SupabaseService().getAdminAvatar();
      if (resolved != null && resolved.isNotEmpty && resolved != 'null') {
        adminAvatar = resolved.trim();
      }
    }
    final provider = getAvatarImageProvider((adminAvatar.isNotEmpty && adminAvatar != 'null') ? adminAvatar : null);

    return Container(
      width: 36,
      height: 36,
      margin: const EdgeInsets.only(top: 2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFF590231),
        border: Border.all(color: LaasyaColors.accentGold, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
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
                  errorBuilder: (_, __, ___) => const Center(
                    child: Text(
                      '👑',
                      style: TextStyle(fontSize: 14),
                    ),
                  ),
                ),
              )
            : null,
      ),
    );
  }

  List<Map<String, dynamic>> get _displayedAnnouncements {
    final list = widget.isMessagesMode
        ? _announcements.where((a) {
            final senderRole = (a['sender_role'] ?? '').toString().toLowerCase();
            final isGuru = senderRole == 'trainer' || senderRole == 'guru' || _isMySentAnnouncement(a);
            return !isGuru; // Only admin & reception notices in Messages page
          }).toList()
        : _announcements.where((a) {
            final senderRole = (a['sender_role'] ?? '').toString().toLowerCase();
            final isGuru = senderRole == 'trainer' || senderRole == 'guru' || _isMySentAnnouncement(a);
            return isGuru; // Only guru announcements in Announcements page
          }).toList();

    final seen = <String>{};
    final deduped = <Map<String, dynamic>>[];
    for (final a in list) {
      final t = (a['title'] ?? '').toString().trim().toLowerCase();
      final m = (a['message'] ?? '').toString().trim().toLowerCase();
      final d = (a['publish_date'] ?? a['date'] ?? '').toString().trim();
      final key = '$t|$m|$d';
      if (!seen.contains(key)) {
        seen.add(key);
        deduped.add(a);
      }
    }
    return deduped;
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
            SnackBar(content: Text('Cannot open link: $clean')),
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

    return CachedNetworkImage(
      imageUrl: fullUrl,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(
        height: 140,
        color: Colors.grey.shade100,
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2, color: LaasyaColors.accentGold)),
      ),
      errorWidget: (_, __, ___) => const SizedBox.shrink(),
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

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required Color bgColor,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: borderColor, width: 0.8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 11, color: color),
            const SizedBox(width: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageActionButtons(Map<String, dynamic> ann) {
    // User requirement: In Messages page or for notices sent by Admin/Reception, no View, Edit, or Delete options
    final senderRole = (ann['sender_role'] ?? '').toString().toLowerCase();
    final isTrainerSender = senderRole.contains('trainer') || senderRole.contains('guru');
    if (widget.isMessagesMode || !_isMySentAnnouncement(ann) || !isTrainerSender) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(top: 8, bottom: 4),
      padding: const EdgeInsets.only(top: 6),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.black.withOpacity(0.06), width: 0.8),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          // View / Details
          _buildActionButton(
            label: 'View',
            icon: Icons.visibility_outlined,
            color: const Color(0xFF075E54),
            bgColor: const Color(0xFFF0FDF4),
            borderColor: const Color(0xFF86EFAC),
            onTap: () => _showViewDetailsModal(ann),
          ),
          const SizedBox(width: 5),
          // Edit
          _buildActionButton(
            label: 'Edit',
            icon: Icons.edit_outlined,
            color: const Color(0xFF334155),
            bgColor: const Color(0xFFF8FAFC),
            borderColor: const Color(0xFFCBD5E1),
            onTap: () => _showEditMessageModal(ann),
          ),
          const SizedBox(width: 5),
          // Delete
          _buildActionButton(
            label: 'Delete',
            icon: Icons.delete_outline,
            color: const Color(0xFFDC2626),
            bgColor: const Color(0xFFFEF2F2),
            borderColor: const Color(0xFFFECACA),
            onTap: () => _confirmDeleteMessage(ann),
          ),
        ],
      ),
    );
  }

  void _showViewDetailsModal(Map<String, dynamic> ann) {
    final rawTitle = (ann['title'] ?? 'Notice').toString();
    final message = (ann['message'] ?? '').toString();
    final typeTag = ann['type_tag']?.toString();
    final timeStr = _formatMessageTime(ann);
    final imageUrl = ann['image_url']?.toString();
    final isMySent = _isMySentAnnouncement(ann);

    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 480, maxHeight: 580),
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF590231).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.info_outline, size: 18, color: Color(0xFF590231)),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Message Details',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF2A0418)),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18, color: Colors.grey),
                      onPressed: () => Navigator.of(ctx).pop(),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const Divider(height: 20),
                Flexible(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isMySent ? const Color(0xFFE8F5E9) : const Color(0xFFFFF3E0),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                isMySent ? 'Sent by Guru' : 'From Administration',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isMySent ? const Color(0xFF2E7D32) : const Color(0xFFE65100),
                                ),
                              ),
                            ),
                            if (typeTag != null && typeTag.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: _getTagColor(typeTag).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  typeTag,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: _getTagColor(typeTag),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          rawTitle,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E1E1E)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Time: $timeStr',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                        ),
                        if (ann['target_batch_name'] != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Target: ${ann['target_batch_name']}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF075E54)),
                          ),
                        ],
                        const SizedBox(height: 12),
                        if (imageUrl != null && imageUrl.isNotEmpty) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: _buildNoticeImage(imageUrl),
                          ),
                          const SizedBox(height: 12),
                        ],
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: SelectableText(
                            message,
                            style: const TextStyle(fontSize: 12.5, height: 1.45, color: Color(0xFF334155)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF590231),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                    ),
                    child: const Text('Close', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showEditMessageModal(Map<String, dynamic> ann) {
    final titleController = TextEditingController(text: ann['title']?.toString() ?? '');
    final messageController = TextEditingController(text: ann['message']?.toString() ?? '');
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 480),
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.edit_note_rounded, color: Color(0xFF590231), size: 22),
                            SizedBox(width: 8),
                            Text(
                              'Edit Message',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF2A0418)),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 18, color: Colors.grey),
                          onPressed: () => Navigator.of(ctx).pop(),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    const Text('Title', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: titleController,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        hintText: 'Enter title...',
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Message Content', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: messageController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        hintText: 'Enter message...',
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: isSaving ? null : () => Navigator.of(ctx).pop(),
                          child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton(
                          onPressed: isSaving
                              ? null
                              : () async {
                                  final messenger = ScaffoldMessenger.of(context);
                                  final newTitle = titleController.text.trim();
                                  final newMsg = messageController.text.trim();
                                  if (newTitle.isEmpty || newMsg.isEmpty) {
                                    messenger.showSnackBar(
                                      const SnackBar(content: Text('Please fill title and message')),
                                    );
                                    return;
                                  }

                                  setModalState(() => isSaving = true);
                                  try {
                                    final annId = ann['id'];
                                    if (annId != null) {
                                      final uri = Uri.parse('${ApiConstants.baseUrl}/api/announcements/$annId');
                                      final res = await http.put(
                                        uri,
                                        headers: {'Content-Type': 'application/json'},
                                        body: jsonEncode({
                                          'title': newTitle,
                                          'message': newMsg,
                                          'sender_role': 'trainer',
                                        }),
                                      );
                                      if (res.statusCode >= 400) {
                                        throw Exception('HTTP ${res.statusCode}');
                                      }
                                    }

                                    // Update locally
                                    setState(() {
                                      ann['title'] = newTitle;
                                      ann['message'] = newMsg;
                                      for (var item in _announcements) {
                                        if (item['id'] == annId) {
                                          item['title'] = newTitle;
                                          item['message'] = newMsg;
                                        }
                                      }
                                    });

                                    if (ctx.mounted) {
                                      Navigator.of(ctx).pop();
                                    }
                                    if (mounted) {
                                      messenger.showSnackBar(
                                        const SnackBar(
                                          content: Text('Message updated successfully'),
                                          backgroundColor: Color(0xFF03543F),
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    setModalState(() => isSaving = false);
                                    if (mounted) {
                                      messenger.showSnackBar(
                                        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                                      );
                                    }
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF590231),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                          ),
                          child: isSaving
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _confirmDeleteMessage(Map<String, dynamic> ann) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Delete Message?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          content: const Text(
            'Are you sure you want to delete this message? This action cannot be undone.',
            style: TextStyle(fontSize: 13, color: Colors.black87),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(ctx).pop();
                final annId = ann['id'];
                try {
                  if (annId != null) {
                    final uri = Uri.parse('${ApiConstants.baseUrl}/api/announcements/$annId');
                    final res = await http.delete(uri);
                    if (res.statusCode >= 400) {
                      throw Exception('Server returned HTTP ${res.statusCode}');
                    }
                  }

                  setState(() {
                    _announcements.removeWhere((item) => item['id'] == annId);
                  });

                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Message deleted successfully'),
                        backgroundColor: Color(0xFF03543F),
                      ),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Failed to delete message: $e'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
    SupabaseService().markAllMessagesAsRead();
    final cached = SupabaseService().getCachedMessageAnnouncements();
    if (cached.isNotEmpty) {
      _announcements = List<Map<String, dynamic>>.from(cached);
      _sortAnnouncements();
      _isLoading = false;
      _scrollToBottom();
    }
    SupabaseService().preloadTrainerAvatars().then((_) {
      if (mounted) setState(() {});
    });
    _loadData();
    _subscribeSupabaseRealtime();
    _realtimePollTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      if (mounted) {
        _loadAnnouncements(isBackgroundSync: true);
      }
    });
  }

  void _subscribeSupabaseRealtime() {
    try {
      if (_realtimeChannel != null) {
        SupabaseService().client.removeChannel(_realtimeChannel!);
        _realtimeChannel = null;
      }
      _realtimeChannel = SupabaseService().client
          .channel('public:trainer_announcements_live_feed')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'announcements',
            callback: (payload) {
              if (mounted) {
                _loadAnnouncements(isBackgroundSync: true);
              }
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('Realtime trainer announcements subscribe notice: $e');
    }
  }

  @override
  void dispose() {
    if (_realtimeChannel != null) {
      try {
        SupabaseService().client.removeChannel(_realtimeChannel!);
      } catch (_) {}
      _realtimeChannel = null;
    }
    _realtimePollTimer?.cancel();
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

  Future<void> _loadAnnouncements({bool isBackgroundSync = false}) async {
    try {
      final msgs = await SupabaseService().getMessageAnnouncements(forceRefresh: true);
      if (mounted) {
        if (isBackgroundSync && _areMessageListsIdentical(_announcements, msgs)) {
          return;
        }
        final newCount = msgs.length;
        final hasNew = newCount != _announcements.length;
        setState(() {
          _announcements = List<Map<String, dynamic>>.from(msgs);
          _sortAnnouncements();
          _isLoading = false;
        });
        SupabaseService().markAllMessagesAsRead(_announcements);
        if (hasNew || !isBackgroundSync) {
          _scrollToBottom();
        }
      }
    } catch (e) {
      debugPrint('Error loading announcements in trainer view: $e');
      if (mounted) setState(() => _isLoading = false);
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

  bool _isMySentAnnouncement(Map<String, dynamic> a) {
    final senderRole = (a['sender_role'] ?? '').toString().toLowerCase();
    final isGuruSender = senderRole.contains('trainer') || senderRole.contains('guru') || a['trainer_id'] != null;
    if (!isGuruSender) return false;

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

    return true; // Sent by trainer in this portal
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFECE5DD), // WhatsApp chat neutral tone
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 1,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
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
              child: Center(
                child: Icon(
                  widget.isMessagesMode ? Icons.chat_bubble_rounded : Icons.campaign_rounded,
                  color: LaasyaColors.accentGold,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.isMessagesMode ? 'Messages' : 'Announcements',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  Text(
                    widget.isMessagesMode
                        ? 'Admin Circulars • $_trainerName'
                        : 'Broadcasts to Enrolled Batches • $_trainerName',
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
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Notice Channel Info Strip
            Container(
              margin: const EdgeInsets.fromLTRB(14, 10, 14, 4),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
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
              child: Row(
                children: [
                  Icon(
                    widget.isMessagesMode ? Icons.notifications_active_rounded : Icons.campaign_rounded,
                    size: 16,
                    color: const Color(0xFF92400E),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.isMessagesMode
                          ? 'Messages Desk: Read-only academy circulars & notices dispatched by Admin.'
                          : 'Announcements Desk: Broadcast notices to disciples enrolled in your batches.',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF92400E),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Messages Feed
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
                  : _displayedAnnouncements.isEmpty
                      ? RefreshIndicator(
                          onRefresh: _loadData,
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
                                      decoration: BoxDecoration(
                                        color: widget.isMessagesMode ? const Color(0xFFDEF7EC) : const Color(0xFFFFF2F8),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        widget.isMessagesMode ? Icons.mark_chat_read_rounded : Icons.campaign_rounded,
                                        size: 36,
                                        color: widget.isMessagesMode ? const Color(0xFF03543F) : const Color(0xFF8A064D),
                                      ),
                                    ),
                                    const SizedBox(height: 14),
                                    Text(
                                      widget.isMessagesMode ? 'No Messages Received' : 'No Announcements Broadcasted',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: LaasyaColors.textDark,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      widget.isMessagesMode
                                          ? 'No new official circulars or administrative notices at this time. All admin announcements will appear here.'
                                          : 'You haven\'t broadcast any announcements yet. Tap "+ New Announcement" below to notify students enrolled in your batches.',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                                    ),
                                    const SizedBox(height: 16),
                                    ElevatedButton.icon(
                                      onPressed: _loadData,
                                      icon: const Icon(Icons.refresh_rounded, size: 16),
                                      label: const Text('Check for Updates', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: widget.isMessagesMode ? const Color(0xFF075E54) : LaasyaColors.primary,
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
                          onRefresh: _loadData,
                          color: LaasyaColors.primary,
                          child: ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.fromLTRB(14, 6, 14, 16),
                            itemCount: _displayedAnnouncements.length,
                            itemBuilder: (context, index) {
                              final ann = _displayedAnnouncements[index];
                              final rawTitle = (ann['title'] ?? 'Notice').toString();
                              final message = (ann['message'] ?? '').toString();
                              final typeTag = ann['type_tag'];
                              final tagColor = _getTagColor(typeTag);
                              final timeStr = _formatMessageTime(ann);
                              final imageUrl = ann['image_url']?.toString();
                              final actionLinks = _parseActionLinks(ann['action_links']);
                              final isMySent = _isMySentAnnouncement(ann);

                              final isHoliday = (typeTag == 'Holiday' ||
                                  rawTitle.toLowerCase().contains('holiday') ||
                                  message.toLowerCase().contains('holiday'));
                              final isRescheduled = (typeTag == 'Schedule change' ||
                                  rawTitle.toLowerCase().contains('extra class') ||
                                  rawTitle.toLowerCase().contains('reschedule'));

                              String cleanTitle = rawTitle;
                              if (isHoliday) {
                                cleanTitle = rawTitle
                                    .replaceFirst(RegExp(r'^(Holiday Notice:\s*|Holiday Alert:\s*)', caseSensitive: false), '')
                                    .trim();
                              }
                              final title = isHoliday ? cleanTitle : rawTitle;

                              // Date Header Divider logic (Uses _displayedAnnouncements!)
                              final currentGroup = _getDateGroupLabel(ann);
                              bool showDateHeader = false;
                              if (index == 0) {
                                showDateHeader = true;
                              } else {
                                final prevMsg = _displayedAnnouncements[index - 1];
                                final prevGroup = _getDateGroupLabel(prevMsg);
                                showDateHeader = currentGroup != prevGroup;
                              }

                              return Padding(
                                key: ValueKey(ann['id'] ?? 'ann_$index'),
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
                                            style: TextStyle(
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.w800,
                                              color: Colors.grey.shade800,
                                              letterSpacing: 0.8,
                                            ),
                                          ),
                                        ),
                                      ),

                                    // Check if this is an incoming official Admin Notice vs Guru's Outbox Message
                                    if (!isMySent)
                                      // =========================================================
                                      // INCOMING ADMIN BROADCAST / CIRCULAR (Left-aligned)
                                      // =========================================================
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _buildAdminAvatarWidget(ann['admin_avatar_url']?.toString()),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Container(
                                              decoration: BoxDecoration(
                                                color: isHoliday
                                                    ? const Color(0xFFFFFDF7)
                                                    : isRescheduled
                                                        ? const Color(0xFFFFFBEB)
                                                        : Colors.white,
                                                borderRadius: const BorderRadius.only(
                                                  topLeft: Radius.circular(2),
                                                  topRight: Radius.circular(16),
                                                  bottomLeft: Radius.circular(16),
                                                  bottomRight: Radius.circular(16),
                                                ),
                                                border: Border.all(
                                                  color: isHoliday
                                                      ? const Color(0xFFFDE68A)
                                                      : isRescheduled
                                                          ? const Color(0xFFF59E0B).withOpacity(0.5)
                                                          : Colors.grey.shade300,
                                                  width: isRescheduled || isHoliday ? 1.4 : 0.8,
                                                ),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black.withOpacity(0.06),
                                                    blurRadius: 6,
                                                    offset: const Offset(0, 2),
                                                  ),
                                                ],
                                              ),
                                              padding: const EdgeInsets.all(12),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  // Header: Sender & Tag
                                                  Row(
                                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                    children: [
                                                      Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          Text(
                                                            ((ann['sender_role'] ?? '').toString().toLowerCase().contains('reception') ||
                                                             (ann['created_by'] ?? '').toString().toLowerCase().contains('reception'))
                                                                ? (ann['created_by'] ?? 'Academy Reception')
                                                                : 'Academy Administration',
                                                            style: TextStyle(
                                                              fontSize: 12,
                                                              fontWeight: FontWeight.bold,
                                                              color: ((ann['sender_role'] ?? '').toString().toLowerCase().contains('reception') ||
                                                                      (ann['created_by'] ?? '').toString().toLowerCase().contains('reception'))
                                                                  ? const Color(0xFF8A064D)
                                                                  : const Color(0xFF075E54),
                                                            ),
                                                          ),
                                                          const SizedBox(width: 4),
                                                          Icon(
                                                            ((ann['sender_role'] ?? '').toString().toLowerCase().contains('reception') ||
                                                             (ann['created_by'] ?? '').toString().toLowerCase().contains('reception'))
                                                                ? Icons.support_agent_rounded
                                                                : Icons.verified_rounded,
                                                            size: 13,
                                                            color: LaasyaColors.accentGold,
                                                          ),
                                                        ],
                                                      ),
                                                      if (typeTag != null)
                                                        Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                                          decoration: BoxDecoration(
                                                            color: tagColor.withOpacity(0.12),
                                                            borderRadius: BorderRadius.circular(6),
                                                            border: Border.all(color: tagColor.withOpacity(0.3)),
                                                          ),
                                                          child: Text(
                                                            typeTag,
                                                            style: TextStyle(
                                                              color: tagColor,
                                                              fontSize: 9,
                                                              fontWeight: FontWeight.bold,
                                                            ),
                                                          ),
                                                        ),
                                                    ],
                                                  ),

                                                  // Attached Image Media
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

                                                  // Title (Burgundy for holiday notice)
                                                  Text(
                                                    title,
                                                    style: TextStyle(
                                                      fontSize: 14,
                                                      fontWeight: FontWeight.bold,
                                                      color: isHoliday ? const Color(0xFF590231) : const Color(0xFF111B21),
                                                      height: 1.25,
                                                    ),
                                                  ),

                                                  const SizedBox(height: 6),

                                                  // Message Body with highlight formatting for holidays
                                                  _buildMessageBody(message, isHoliday),

                                                  // Action Links
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

                                                  // Timestamp & Delivered Checks
                                                  Align(
                                                    alignment: Alignment.bottomRight,
                                                    child: Row(
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Text(
                                                          timeStr,
                                                          style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                                                        ),
                                                        const SizedBox(width: 4),
                                                        const Icon(Icons.done_all_rounded, size: 14, color: Color(0xFF34B7F1)),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      )
                                    else
                                      // =========================================================
                                      // OUTGOING GURU SENT BUBBLE (Right-aligned WhatsApp style)
                                      // =========================================================
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Flexible(
                                            child: Container(
                                              constraints: BoxConstraints(
                                                maxWidth: MediaQuery.of(context).size.width * 0.76,
                                              ),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFE7FFDB), // WhatsApp sent bubble tone
                                                borderRadius: const BorderRadius.only(
                                                  topLeft: Radius.circular(14),
                                                  topRight: Radius.circular(2),
                                                  bottomLeft: Radius.circular(14),
                                                  bottomRight: Radius.circular(14),
                                                ),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black.withOpacity(0.06),
                                                    blurRadius: 4,
                                                    offset: const Offset(0, 1),
                                                  ),
                                                ],
                                              ),
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  // Batch Target Pill
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFF075E54).withOpacity(0.12),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: Text(
                                                      'Broadcast to: ${ann['target_batch_name'] ?? 'All Batches'}',
                                                      style: const TextStyle(
                                                        color: Color(0xFF075E54),
                                                        fontSize: 9.5,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
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

                                                  // Action Buttons (View, Edit, Delete)
                                                  _buildMessageActionButtons(ann),

                                                  // Time & Blue Double Checks
                                                  Align(
                                                    alignment: Alignment.bottomRight,
                                                    child: Row(
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
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
                                                          color: Color(0xFF34B7F1),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          _buildGuruAvatarWidget(),
                                        ],
                                      ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
            ),

            // Bottom Sticky Bar: "+ New Announcement" Button (Only in Announcements mode, hidden in Messages mode)
            if (!widget.isMessagesMode)
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
                      backgroundColor: const Color(0xFF075E54),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                      elevation: 1,
                    ),
                    icon: const Icon(Icons.add_comment_rounded, size: 20, color: Color(0xFFF9E33A)),
                    label: const Text(
                      '+ New Announcement',
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

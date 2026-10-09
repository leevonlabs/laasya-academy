import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
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

  Future<void> _loadSharedVideos() async {
    try {
      final uri = Uri.parse('http://localhost:3000/api/video-library');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
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

  void _copyToClipboard(String url, String label) {
    Clipboard.setData(ClipboardData(text: url.trim()));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: const Color(0xFF03543F),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _deleteItem(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Shared Link', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to delete this shared video link? Students in this batch will no longer see it.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        final res = await http.delete(Uri.parse('http://localhost:3000/api/video-library/$id'));
        if (res.statusCode == 200) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Video link removed successfully')),
            );
            _loadSharedVideos();
          }
        }
      } catch (e) {
        debugPrint('Delete error: $e');
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

  Future<void> _openShareVideoSheet() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => TrainerCreateShareVideoScreen(
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
    final filtered = _mySharedItems.where((item) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final title = (item['title'] ?? '').toString().toLowerCase();
      final desc = (item['description'] ?? '').toString().toLowerCase();
      final course = (item['target_course_title'] ?? '').toString().toLowerCase();
      final batch = (item['target_batch_name'] ?? '').toString().toLowerCase();
      return title.contains(q) || desc.contains(q) || course.contains(q) || batch.contains(q);
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
                    // Top Hero Action Banner
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF590231), Color(0xFF8A064D)],
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
                                child: const Icon(Icons.video_library_rounded, color: Colors.white, size: 22),
                              ),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Share Videos With Disciples',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Google Drive & YouTube links for your assigned batches',
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
                              onPressed: _openShareVideoSheet,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFD4AF37),
                                foregroundColor: const Color(0xFF4A0025),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 11),
                                elevation: 0,
                              ),
                              icon: const Icon(Icons.add_link_rounded, size: 18),
                              label: const Text(
                                'Share New Video Links',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Search Bar
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
                          hintText: 'Search your shared video links...',
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

                    // Heading
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Your Shared Media (${filtered.length})',
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
                            'Synced with Admin',
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

                    // List of Shared Videos
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
                            Icon(Icons.video_collection_outlined, size: 44, color: Colors.grey.shade400),
                            const SizedBox(height: 10),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'No shared links matching "$_searchQuery"'
                                  : 'No video links shared yet',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Use the button above to share Google Drive or YouTube links with your enrolled disciples.',
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
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, idx) {
                          final item = filtered[idx];
                          final id = (item['id'] ?? '').toString();
                          final title = (item['title'] ?? 'Shared Media').toString();
                          final desc = (item['description'] ?? '').toString();
                          final course = (item['target_course_title'] ?? 'Assigned Course').toString();
                          final batch = (item['target_batch_name'] ?? 'All Batches').toString();
                          final dateStr = _formatDate(item['event_date'] ?? item['created_at']);
                          final driveUrl = (item['drive_url'] ?? '').toString().trim();
                          final youtubeUrl = (item['youtube_url'] ?? '').toString().trim();
                          final hasDrive = driveUrl.isNotEmpty;
                          final hasYoutube = youtubeUrl.isNotEmpty;

                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
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
                                          color: const Color(0xFFF3E8EE),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          '$course • $batch',
                                          style: const TextStyle(
                                            color: Color(0xFF8A064D),
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      Row(
                                        children: [
                                          Text(
                                            dateStr,
                                            style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                                          ),
                                          const SizedBox(width: 4),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.grey),
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                            onPressed: () => _deleteItem(id),
                                          ),
                                        ],
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
                                  if (desc.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      desc,
                                      style: const TextStyle(fontSize: 12, color: Colors.black87),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                  const SizedBox(height: 12),

                                  // Links Actions (SHOWS ONLY THE LINK(S) PRESENT)
                                  if (hasDrive) ...[
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton.icon(
                                            onPressed: () => _launchExternalUrl(driveUrl),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF03543F),
                                              foregroundColor: Colors.white,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                              padding: const EdgeInsets.symmetric(vertical: 9),
                                              elevation: 0,
                                            ),
                                            icon: const Icon(Icons.open_in_new_rounded, size: 14),
                                            label: const Text('Open Drive', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        OutlinedButton.icon(
                                          onPressed: () => _copyToClipboard(driveUrl, 'Drive link'),
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
                                    if (hasYoutube) const SizedBox(height: 8),
                                  ],

                                  if (hasYoutube) ...[
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton.icon(
                                            onPressed: () => _launchExternalUrl(youtubeUrl),
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
                                          onPressed: () => _copyToClipboard(youtubeUrl, 'YouTube link'),
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

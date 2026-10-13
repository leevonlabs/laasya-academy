import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../student/student_messages_screen.dart';
import '../student/student_video_library_screen.dart';
import 'trainer_salaries_screen.dart';
import 'trainer_data_store.dart';

class TrainerDashboardTab extends StatefulWidget {
  final VoidCallback onNavigateToClasses;
  final VoidCallback onNavigateToStudents;
  final VoidCallback onNavigateToAttendance;

  const TrainerDashboardTab({
    super.key,
    required this.onNavigateToClasses,
    required this.onNavigateToStudents,
    required this.onNavigateToAttendance,
  });

  @override
  State<TrainerDashboardTab> createState() => _TrainerDashboardTabState();
}

class _TrainerDashboardTabState extends State<TrainerDashboardTab> {
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _todaySessions = [];
  List<Map<String, dynamic>> _batches = [];
  List<Map<String, dynamic>> _announcements = [];
  bool _isLoading = true;

  // Banner advertisement controller
  final PageController _bannerController = PageController();
  int _currentBannerIndex = 0;
  Timer? _bannerTimer;

  @override
  void initState() {
    super.initState();
    // 1. Instantly render from cached profile so screen loads in under 10ms with ZERO blank spinner
    final cachedProf = SupabaseService().currentUserProfile;
    if (cachedProf != null) {
      _profile = cachedProf;
      _isLoading = false;
    }
    _loadData();
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    // Only display spinner if we have no cached data at all
    if (_profile == null) {
      setState(() => _isLoading = true);
    }

    try {
      // Fetch profile, batches, and banners concurrently in parallel (< 1 second)
      final results = await Future.wait([
        SupabaseService().getCurrentUserProfile(),
        SupabaseService().getTrainerBatches(),
        SupabaseService().getBannerAnnouncements(),
      ]);

      final prof = results[0] as Map<String, dynamic>?;
      final btc = results[1] as List<Map<String, dynamic>>;
      final bannerAds = results[2] as List<Map<String, dynamic>>;
      final sess = await SupabaseService().getTrainerTodaySessions();

      if (mounted) {
        setState(() {
          _profile = prof ?? _profile;
          _batches = btc;
          _todaySessions = sess;
          _announcements = bannerAds.where((n) {
            final isBanner = n['announcement_type'] == 'banner' || 
                             (n['image_url'] != null && n['image_url'].toString().isNotEmpty && n['announcement_type'] != 'message');
            return isBanner;
          }).toList();
          _isLoading = false;
        });

        _startBannerAutoScroll();
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _startBannerAutoScroll() {
    _bannerTimer?.cancel();
    if (_announcements.length <= 1) return;

    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted || !_bannerController.hasClients) return;
      int nextIndex = _currentBannerIndex + 1;
      if (nextIndex >= _announcements.length) {
        nextIndex = 0;
      }
      _bannerController.animateToPage(
        nextIndex,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning, Guru';
    if (hour < 17) return 'Good Afternoon, Guru';
    return 'Good Evening, Guru';
  }

  Widget _buildAnnouncementImage(String? imageUrl, {BoxFit fit = BoxFit.cover}) {
    if (imageUrl == null || imageUrl.trim().isEmpty) {
      return _bannerFallback(fit);
    }

    final cleanUrl = imageUrl.trim();

    // 1. Match local high-res bundled assets by filename
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
        fit: fit,
        errorBuilder: (_, __, ___) => _bannerFallback(fit),
      );
    }

    // 2. Direct assets path
    if (cleanUrl.startsWith('assets/')) {
      return Image.asset(
        cleanUrl,
        fit: fit,
        errorBuilder: (_, __, ___) => _bannerFallback(fit),
      );
    }

    // 3. Base64 data URL
    if (cleanUrl.startsWith('data:image')) {
      try {
        final commaIdx = cleanUrl.indexOf(',');
        final base64Str = commaIdx != -1 ? cleanUrl.substring(commaIdx + 1) : cleanUrl;
        return Image.memory(
          base64Decode(base64Str),
          fit: fit,
          errorBuilder: (_, __, ___) => _bannerFallback(fit),
        );
      } catch (_) {
        return _bannerFallback(fit);
      }
    }

    // 4. Remote or relative URL
    String fullUrl = cleanUrl;
    if (fullUrl.startsWith('/')) {
      fullUrl = '${ApiConstants.baseUrl}$fullUrl';
    }

    return Image.network(
      fullUrl,
      fit: fit,
      errorBuilder: (_, __, ___) => _bannerFallback(fit),
    );
  }

  Widget _bannerFallback([BoxFit fit = BoxFit.cover]) {
    return Image.asset(
      'assets/images/banner_bharatanatyam_kids.jpg',
      fit: fit,
      errorBuilder: (_, __, ___) => Container(
        color: const Color(0xFF590231),
        child: const Icon(Icons.campaign_rounded, color: Colors.white, size: 36),
      ),
    );
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
      final uri = Uri.parse(clean.startsWith('http') || clean.startsWith('tel:') || clean.startsWith('mailto:') ? clean : 'https://$clean');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('Could not launch $url: $e');
    }
  }

  void _showAnnouncementDetail(Map<String, dynamic> ann) {
    final actionLinks = _parseActionLinks(ann['action_links']);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(ctx).size.height * 0.88,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(26),
            topRight: Radius.circular(26),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(22, 16, 22, 22),
        child: SingleChildScrollView(
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
              if (ann['image_url'] != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    color: const Color(0xFF1E0111),
                    child: AspectRatio(
                      aspectRatio: 3 / 4,
                      child: _buildAnnouncementImage(
                        ann['image_url'],
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3E8EE),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      ann['type_tag'] ?? 'Academy Bulletin',
                      style: const TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded, size: 13, color: Colors.grey),
                      const SizedBox(width: 5),
                      Text(
                        ann['date'] ?? 'Recent',
                        style: const TextStyle(fontSize: 11.5, color: Colors.grey, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                ann['title'] ?? 'Notice',
                style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
              ),
              const SizedBox(height: 10),
              Text(
                ann['message'] ?? '',
                style: const TextStyle(fontSize: 14, color: Colors.black87, height: 1.5),
              ),

              // Action Links / Resource Buttons (if specified)
              if (actionLinks.isNotEmpty) ...[
                const SizedBox(height: 18),
                const Divider(height: 1),
                const SizedBox(height: 14),
                const Row(
                  children: [
                    Icon(Icons.link_rounded, size: 18, color: LaasyaColors.primary),
                    SizedBox(width: 6),
                    Text(
                      'Action Links & Resources',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: LaasyaColors.primary,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ...actionLinks.map((link) {
                  final linkTitle = link['title']?.toString() ?? 'Open Link';
                  final linkUrl = link['url']?.toString() ?? '';
                  final isPhone = linkUrl.startsWith('tel:');

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => _launchActionUrl(linkUrl),
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
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: LaasyaColors.primary.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  isPhone ? Icons.phone_in_talk_rounded : Icons.open_in_new_rounded,
                                  size: 18,
                                  color: LaasyaColors.primary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      linkTitle,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: LaasyaColors.primary,
                                      ),
                                    ),
                                    if (linkUrl.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        linkUrl,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey.shade600,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(
                                Icons.arrow_forward_ios_rounded,
                                size: 13,
                                color: LaasyaColors.primary,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],

              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: LaasyaColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Close Notice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarWidget(String? avatarUrl, {double size = 58, VoidCallback? onTap}) {
    Widget imageContent;
    if (avatarUrl != null && avatarUrl.trim().isNotEmpty) {
      final trimmed = avatarUrl.trim();
      if (trimmed.startsWith('data:image')) {
        try {
          final bytes = base64Decode(trimmed.split(',').last);
          imageContent = Image.memory(bytes, fit: BoxFit.cover, width: size, height: size);
        } catch (_) {
          imageContent = CircleAvatar(
            backgroundColor: const Color(0xFFD4AF37),
            radius: size / 2,
            child: Icon(Icons.person, size: size * 0.6, color: Colors.white),
          );
        }
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        imageContent = Image.network(
          trimmed,
          fit: BoxFit.cover,
          width: size,
          height: size,
          errorBuilder: (_, __, ___) => CircleAvatar(
            backgroundColor: const Color(0xFFD4AF37),
            radius: size / 2,
            child: Icon(Icons.person, size: size * 0.6, color: Colors.white),
          ),
        );
      } else if (trimmed.startsWith('assets/')) {
        imageContent = Image.asset(trimmed, fit: BoxFit.cover, width: size, height: size);
      } else {
        imageContent = CircleAvatar(
          backgroundColor: const Color(0xFFD4AF37),
          radius: size / 2,
          child: Icon(Icons.person, size: size * 0.6, color: Colors.white),
        );
      }
    } else {
      imageContent = CircleAvatar(
        backgroundColor: const Color(0xFFD4AF37),
        radius: size / 2,
        child: Icon(Icons.person, size: size * 0.6, color: Colors.white),
      );
    }

    final avatarCircle = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: LaasyaColors.accentGold, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 6,
          ),
        ],
      ),
      child: ClipOval(child: imageContent),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: avatarCircle,
      );
    }
    return avatarCircle;
  }

  void _showFullPhotoDialog(BuildContext context, String? avatarUrl, String name, String subtitle) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.92),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.4), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (subtitle.isNotEmpty)
                            Text(
                              subtitle,
                              style: const TextStyle(
                                color: LaasyaColors.accentGold,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white70, size: 24),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(color: Colors.white12, height: 1),
              ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
                child: Container(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.65,
                    minHeight: 280,
                  ),
                  width: double.infinity,
                  color: Colors.black,
                  child: InteractiveViewer(
                    minScale: 1.0,
                    maxScale: 3.5,
                    child: _buildFullPhotoWidget(avatarUrl),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFullPhotoWidget(String? avatarUrl) {
    if (avatarUrl != null && avatarUrl.trim().isNotEmpty) {
      final trimmed = avatarUrl.trim();
      if (trimmed.startsWith('data:image')) {
        try {
          final bytes = base64Decode(trimmed.split(',').last);
          return Image.memory(bytes, fit: BoxFit.contain);
        } catch (_) {}
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return Image.network(
          trimmed,
          fit: BoxFit.contain,
          loadingBuilder: (context, child, progress) {
            if (progress == null) return child;
            return const Center(child: CircularProgressIndicator(color: LaasyaColors.accentGold));
          },
          errorBuilder: (_, __, ___) => _buildPlaceholderPhoto(),
        );
      } else if (trimmed.startsWith('assets/')) {
        return Image.asset(trimmed, fit: BoxFit.contain);
      }
    }
    return _buildPlaceholderPhoto();
  }

  Widget _buildPlaceholderPhoto() {
    return Container(
      padding: const EdgeInsets.all(32),
      color: const Color(0xFF590231),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 48,
            backgroundColor: Colors.white24,
            child: Icon(Icons.person_rounded, size: 54, color: Colors.white70),
          ),
          SizedBox(height: 12),
          Text(
            'Official Academy Faculty Profile Photo',
            style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: LaasyaColors.primary));
    }

    final name = _profile?['full_name'] ?? 'Smt. Anusha Sumesh';
    final designation = _profile?['designation'] ?? 'Head Guru & Choreographer';
    final specialization = _profile?['specialization'] ?? 'Bharatanatyam Classical Dance';
    final avatarUrl = _profile?['avatar_url'] as String? ?? _profile?['photo_url'] as String? ?? _profile?['image_url'] as String?;
    final monthlySalary = _profile?['monthly_salary'] ?? 45000;
    final salaryPaymentStatus = (_profile?['salary_payment_status'] ?? 'paid').toString().toLowerCase();
    final bool isPaid = salaryPaymentStatus == 'paid';
    final batchCount = _profile?['assigned_batches_count'] ?? _batches.length;
    final studentCount = _profile?['total_students_count'] ?? 42;

    // Today's first session quick alert strip
    final todaySession = _todaySessions.isNotEmpty ? _todaySessions.first : null;
    final todaySessionBatch = todaySession?['batches'];

    return RefreshIndicator(
      onRefresh: _loadData,
      color: LaasyaColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. EXECUTIVE GURU WELCOME HERO CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF590231), Color(0xFF8A064D)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.55), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.28),
                    blurRadius: 14,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Avatar with golden border (Tap to view full length photo)
                      _buildAvatarWidget(
                        avatarUrl,
                        onTap: () => _showFullPhotoDialog(context, avatarUrl, name, '$designation • $specialization'),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  _getGreeting(),
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.85),
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w500,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'ACTIVE FACULTY',
                                    style: TextStyle(
                                      color: Color(0xFF03543F),
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.4,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '$designation • $specialization',
                              style: const TextStyle(
                                color: LaasyaColors.accentGold,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Today's Session Quick Notification Strip
                  if (todaySession != null) ...[
                    const SizedBox(height: 14),
                    InkWell(
                      onTap: widget.onNavigateToAttendance,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.22),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.35)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.event_available_rounded, size: 16, color: LaasyaColors.accentGold),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Today\'s Session: ${todaySessionBatch?['name'] ?? "Batch"} • ${todaySession['start_time']} - ${todaySession['end_time']}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded, size: 11, color: LaasyaColors.accentGold),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 14),

            // =================================================================
            // 2. QUICK ACTION SHORTCUTS (HIGH-UTILITY NAVIGATION BAR)
            // =================================================================
            Row(
              children: [
                _quickActionButton(
                  icon: Icons.calendar_month_rounded,
                  label: 'Timetable',
                  bgColor: const Color(0xFFFFF2F8),
                  iconColor: LaasyaColors.primary,
                  onTap: widget.onNavigateToClasses,
                ),
                const SizedBox(width: 8),
                _quickActionButton(
                  icon: Icons.video_library_rounded,
                  label: 'Drive Vault',
                  bgColor: const Color(0xFFFEF3C7),
                  iconColor: const Color(0xFF92400E),
                  unreadCount: SupabaseService().getUnreadVideosCount(),
                  onTap: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => StudentVideoLibraryScreen(
                          studentCourse: specialization,
                          studentBatch: 'All Batches',
                        ),
                      ),
                    );
                    setState(() {});
                  },
                ),
                const SizedBox(width: 8),
                _quickActionButton(
                  icon: Icons.chat_bubble_rounded,
                  label: 'Messages',
                  bgColor: const Color(0xFFE8F4FD),
                  iconColor: const Color(0xFF0284C7),
                  unreadCount: SupabaseService().getUnreadMessagesCount(),
                  onTap: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const StudentMessagesScreen(),
                      ),
                    );
                    setState(() {});
                  },
                ),
                const SizedBox(width: 8),
                _quickActionButton(
                  icon: Icons.verified_rounded,
                  label: 'Attendance',
                  bgColor: const Color(0xFFE1EFFE),
                  iconColor: const Color(0xFF1E429F),
                  onTap: widget.onNavigateToAttendance,
                ),
              ],
            ),

            const SizedBox(height: 18),

            // =================================================================
            // 3. MOVING ADVERTISEMENT BANNER WITH IMAGES (BELOW WELCOME BAR)
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Academy Announcements',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: LaasyaColors.textDark,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDEF7EC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF31C48D).withOpacity(0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.campaign_rounded, size: 12, color: Color(0xFF03543F)),
                      SizedBox(width: 4),
                      Text(
                        'Live Updates',
                        style: TextStyle(color: Color(0xFF03543F), fontWeight: FontWeight.bold, fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (_announcements.isEmpty)
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFF0D5E4)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: LaasyaColors.primary, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text('No new academy notices at this time.', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              )
            else
              Column(
                children: [
                  SizedBox(
                    height: 400,
                    child: PageView.builder(
                      controller: _bannerController,
                      itemCount: _announcements.length,
                      onPageChanged: (idx) => setState(() => _currentBannerIndex = idx),
                      itemBuilder: (context, index) {
                        final ann = _announcements[index];
                        final imageUrl = ann['image_url'] ??
                            'assets/images/banner_bharatanatyam_kids.jpg';

                        return GestureDetector(
                          onTap: () => _showAnnouncementDetail(ann),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E0111),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: const Color(0xFFF0D5E4)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.06),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(18),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  // Banner Image (Poster Aspect Ratio)
                                  _buildAnnouncementImage(
                                    imageUrl,
                                    fit: BoxFit.cover,
                                  ),

                                  // High contrast gradient overlay
                                  Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [
                                          Colors.black.withOpacity(0.1),
                                          Colors.black.withOpacity(0.4),
                                          Colors.black.withOpacity(0.85),
                                        ],
                                        stops: const [0.0, 0.45, 1.0],
                                      ),
                                    ),
                                  ),

                                  // Content overlay
                                  Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        // Tag badge
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                                          decoration: BoxDecoration(
                                            color: LaasyaColors.primary,
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: Colors.white.withOpacity(0.4)),
                                          ),
                                          child: Text(
                                            ann['type_tag'] ?? 'ACADEMY NOTICE',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.bold,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ),

                                        // Headline & subtext
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              ann['title'] ?? 'Academy Bulletin',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold,
                                                shadows: [Shadow(color: Colors.black87, blurRadius: 4)],
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              ann['message'] ?? '',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                color: Colors.white.withOpacity(0.9),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Tap hint arrow
                                  Positioned(
                                    bottom: 12,
                                    right: 12,
                                    child: Container(
                                      padding: const EdgeInsets.all(5),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.25),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Carousel dot indicators
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_announcements.length, (idx) {
                      final isActive = idx == _currentBannerIndex;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isActive ? 18 : 6,
                        height: 5,
                        decoration: BoxDecoration(
                          color: isActive ? LaasyaColors.primary : Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      );
                    }),
                  ),
                ],
              ),

            const SizedBox(height: 18),

            // =================================================================
            // 4. MONTHLY COMPENSATION & PAYROLL STATUS BAR (REPLACED FROM PROFILE)
            // =================================================================
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF0D5E4)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.025),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.currency_rupee_rounded, color: LaasyaColors.primary, size: 19),
                          SizedBox(width: 6),
                          Text(
                            'Monthly Compensation & Payroll',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: isPaid ? const Color(0xFFDEF7EC) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isPaid ? const Color(0xFF31C48D).withOpacity(0.4) : const Color(0xFFF59E0B).withOpacity(0.4),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isPaid ? Icons.check_circle_rounded : Icons.pending_actions_rounded,
                              size: 11,
                              color: isPaid ? const Color(0xFF03543F) : const Color(0xFF92400E),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isPaid ? 'Salary Credited' : 'Pending Verification',
                              style: TextStyle(
                                color: isPaid ? const Color(0xFF03543F) : const Color(0xFF92400E),
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Base Salary', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text('₹$monthlySalary', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3FAF7),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFC7EBD9)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Net Disbursed', style: TextStyle(fontSize: 10, color: Color(0xFF03543F), fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text('₹${isPaid ? monthlySalary : 0}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isPaid ? const Color(0xFFF3FAF7) : const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: isPaid ? const Color(0xFFC7EBD9) : const Color(0xFFFDE68A)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Disbursal Status', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text(
                                isPaid ? 'CREDITED' : 'PENDING',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: isPaid ? const Color(0xFF03543F) : const Color(0xFFB45309),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TrainerSalariesScreen(trainerProfile: _profile),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long_rounded, size: 15, color: LaasyaColors.primary),
                          SizedBox(width: 6),
                          Text(
                            'View Salary Payouts & Download Pay Slips →',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: LaasyaColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // =================================================================
            // 5. METRIC KPI SUMMARY ROW
            // =================================================================
            Row(
              children: [
                Expanded(
                  child: _kpiCard(
                    title: 'Assigned Batches',
                    value: '$batchCount Batches',
                    icon: Icons.groups_rounded,
                    color: LaasyaColors.primary,
                    onTap: widget.onNavigateToClasses,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _kpiCard(
                    title: 'Total Students',
                    value: '$studentCount Enrolled',
                    icon: Icons.school_rounded,
                    color: const Color(0xFF03543F),
                    onTap: widget.onNavigateToStudents,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _kpiCard(
                    title: 'Today Attendance',
                    value: '94% Present',
                    icon: Icons.check_circle_rounded,
                    color: const Color(0xFFB45309),
                    onTap: widget.onNavigateToAttendance,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 22),

            // =================================================================
            // 6. TODAY'S SCHEDULED SESSIONS & ACTIVE ROLL-CALL
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Today\'s Class Sessions',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                ),
                GestureDetector(
                  onTap: widget.onNavigateToAttendance,
                  child: const Text(
                    'Manage Attendance →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (_todaySessions.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: const Text('No classes scheduled for today.'),
              )
            else
              ..._todaySessions.map((sess) {
                final batch = sess['batches'];
                final batchId = (batch?['id'] ?? sess['batch_id'] ?? '').toString();
                final status = TrainerDataStore().getSessionStatus(batchId);
                final isSubmitted = status == 'submitted';
                final isClosed = status == 'closed';

                Color cardBgColor = Colors.white;
                Color cardBorderColor = const Color(0xFFF0D5E4);
                Color accentStrip = const Color(0xFFF59E0B);
                Color badgeBg = const Color(0xFFFEF3C7);
                Color badgeText = const Color(0xFFB45309);
                String badgeTextStr = 'ROLL-CALL PENDING';
                IconData badgeIco = Icons.hourglass_top_rounded;
                String buttonLabel = 'Start & Take Attendance';

                if (isClosed) {
                  cardBgColor = const Color(0xFFF0FDF4);
                  cardBorderColor = const Color(0xFF34D399);
                  accentStrip = const Color(0xFF059669);
                  badgeBg = const Color(0xFFDCFCE7);
                  badgeText = const Color(0xFF047857);
                  badgeTextStr = 'COMPLETED & ALERTED';
                  badgeIco = Icons.check_circle_rounded;
                  buttonLabel = 'View / Edit Attendance';
                } else if (isSubmitted) {
                  cardBgColor = const Color(0xFFFFFBEB);
                  cardBorderColor = const Color(0xFFFBBF24);
                  accentStrip = const Color(0xFFD97706);
                  badgeBg = const Color(0xFFFEF3C7);
                  badgeText = const Color(0xFF92400E);
                  badgeTextStr = 'ATTENDANCE TAKEN';
                  badgeIco = Icons.fact_check_rounded;
                  buttonLabel = 'Close Class & Alert Parents';
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: cardBgColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: cardBorderColor,
                      width: (isClosed || isSubmitted) ? 1.8 : 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(19),
                    child: IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Container(width: 5, color: accentStrip),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF3E8EE),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          batch?['courses']?['title'] ?? 'Bharatanatyam',
                                          style: const TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: badgeBg,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(badgeIco, size: 12, color: badgeText),
                                            const SizedBox(width: 4),
                                            Text(
                                              badgeTextStr,
                                              style: TextStyle(color: badgeText, fontWeight: FontWeight.bold, fontSize: 10),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    batch?['name'] ?? 'Bharatanatyam - Batch A',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Room: ${batch?['room_or_hall']} • Time: ${sess['start_time']} - ${sess['end_time']}',
                                    style: const TextStyle(fontSize: 12, color: LaasyaColors.textMuted),
                                  ),
                                  const SizedBox(height: 14),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: widget.onNavigateToAttendance,
                                          icon: Icon(badgeIco, size: 16),
                                          label: Text(buttonLabel, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: isClosed
                                                ? const Color(0xFF03543F)
                                                : (isSubmitted ? const Color(0xFF590231) : LaasyaColors.primary),
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),

            const SizedBox(height: 20),

            // =================================================================
            // 7. ASSIGNED COURSES & BATCHES OVERVIEW
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Assigned Batches & Capacity',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                ),
                GestureDetector(
                  onTap: widget.onNavigateToClasses,
                  child: const Text(
                    'All Classes →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            ..._batches.take(3).map((b) {
              final enrolled = b['enrolled_count'] ?? 14;
              final maxCap = b['max_capacity'] ?? 20;
              final pct = enrolled / maxCap;

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      b['name']!,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${b['room_or_hall']} • ${b['start_time']} - ${b['end_time']}',
                      style: const TextStyle(fontSize: 11.5, color: LaasyaColors.textMuted),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: pct,
                              backgroundColor: Colors.grey.shade200,
                              color: LaasyaColors.primary,
                              minHeight: 6,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          '$enrolled / $maxCap Students',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _quickActionButton({
    required IconData icon,
    required String label,
    required Color bgColor,
    required Color iconColor,
    required VoidCallback onTap,
    int? unreadCount,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: iconColor, size: 20),
                  ),
                  if (unreadCount != null && unreadCount > 0)
                    Positioned(
                      top: -4,
                      right: -6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE53E3E),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white, width: 1.2),
                        ),
                        child: Text(
                          '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              if (unreadCount != null && unreadCount > 0) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  margin: const EdgeInsets.only(bottom: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDE8E8),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '$unreadCount UNREAD',
                    style: const TextStyle(
                      fontSize: 7.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF9B1C1C),
                    ),
                  ),
                ),
              ],
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: LaasyaColors.textDark,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _kpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(fontSize: 10, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }
}

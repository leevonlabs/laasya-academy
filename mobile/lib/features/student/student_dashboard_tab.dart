import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import 'student_messages_screen.dart';
import 'student_video_library_screen.dart';

class StudentDashboardTab extends StatefulWidget {
  final VoidCallback onNavigateToCourses;
  final VoidCallback onNavigateToSchedule;
  final VoidCallback onNavigateToAttendance;

  const StudentDashboardTab({
    super.key,
    required this.onNavigateToCourses,
    required this.onNavigateToSchedule,
    required this.onNavigateToAttendance,
  });

  @override
  State<StudentDashboardTab> createState() => _StudentDashboardTabState();
}

class _StudentDashboardTabState extends State<StudentDashboardTab> {
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _courses = [];
  List<Map<String, dynamic>> _announcements = [];
  List<Map<String, dynamic>> _schedule = [];
  bool _isLoading = true;

  // Banner advertisement controller
  final PageController _bannerController = PageController();
  int _currentBannerIndex = 0;
  Timer? _bannerTimer;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final prof = await SupabaseService().getCurrentUserProfile();
    final crs = await SupabaseService().getStudentEnrolledCourses();
    final bannerAds = await SupabaseService().getBannerAnnouncements();
    final sch = await SupabaseService().getStudentSchedule();

    if (mounted) {
      setState(() {
        _profile = prof;
        _courses = crs;
        _announcements = bannerAds.where((n) {
          final isBanner = n['announcement_type'] == 'banner' || 
                           (n['image_url'] != null && n['image_url'].toString().isNotEmpty && n['announcement_type'] != 'message');
          return isBanner;
        }).toList();
        _schedule = sch;
        _isLoading = false;
      });

      _startBannerAutoScroll();
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
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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
      fullUrl = 'http://localhost:3000$fullUrl';
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
                      ann['type_tag'] ?? 'Academy Notice',
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: LaasyaColors.primary));
    }

    final name = _profile?['full_name'] ?? 'Aditi Sundaram';
    final roll = _profile?['roll_number'] ?? 'LCA-6';
    final avatarUrl = _profile?['avatar_url'] as String?;
    final course = _profile?['course'] ?? 'Bharathanatyam';
    final batch = _profile?['batch'] ?? 'Batch A (Beginners)';

    // Tuition Fee Attributes (Relocated from Profile Page)
    final totalFee = _profile?['total_monthly_fee'] ?? 2000;
    final advancePaid = _profile?['advance_paid'] ?? 2000;
    final dueAmount = _profile?['due_amount'] ?? 0;
    final dueStatus = _profile?['due_status'] ?? 'green';

    Color dueBadgeBg;
    Color dueBadgeText;
    String dueLabel;

    if (dueStatus == 'green' || (dueAmount is num && dueAmount <= 0)) {
      dueBadgeBg = const Color(0xFFDEF7EC);
      dueBadgeText = const Color(0xFF03543F);
      dueLabel = 'Fee Cleared • No Dues';
    } else if (dueStatus == 'yellow' || (dueAmount is num && dueAmount < totalFee)) {
      dueBadgeBg = const Color(0xFFFEF3C7);
      dueBadgeText = const Color(0xFF92400E);
      dueLabel = 'Partial Paid: ₹$dueAmount Due';
    } else {
      dueBadgeBg = const Color(0xFFFDE8E8);
      dueBadgeText = const Color(0xFF9B1C1C);
      dueLabel = 'Tuition Due: ₹$dueAmount';
    }

    // Today's scheduled class if any
    final todayClasses = _schedule.where((s) => s['is_today'] == true).toList();
    final todayClass = todayClasses.isNotEmpty ? todayClasses.first : null;

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
            // 1. EXECUTIVE WELCOME HERO CARD
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
                      // Avatar with golden border
                      Container(
                        width: 58,
                        height: 58,
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
                        child: ClipOval(
                          child: (avatarUrl != null && avatarUrl.isNotEmpty)
                              ? (avatarUrl.startsWith('data:')
                                  ? const CircleAvatar(backgroundColor: Color(0xFFD4AF37), child: Icon(Icons.person, size: 34, color: Colors.white))
                                  : Image.network(avatarUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const CircleAvatar(backgroundColor: Color(0xFFD4AF37), child: Icon(Icons.person, size: 34, color: Colors.white))))
                              : const CircleAvatar(backgroundColor: Color(0xFFD4AF37), child: Icon(Icons.person, size: 34, color: Colors.white)),
                        ),
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
                                    'ACTIVE DISCIPLE',
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
                            const SizedBox(height: 4),
                            Text(
                              '$roll • $course',
                              style: const TextStyle(
                                color: LaasyaColors.accentGold,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Today's Class Quick Notification Strip
                  if (todayClass != null) ...[
                    const SizedBox(height: 14),
                    InkWell(
                      onTap: widget.onNavigateToSchedule,
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
                                'Today\'s Class: ${todayClass['course']} • ${todayClass['time']}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w600,
                                ),
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
                  onTap: widget.onNavigateToSchedule,
                ),
                const SizedBox(width: 8),
                _quickActionButton(
                  icon: Icons.video_library_rounded,
                  label: 'Drive Vault',
                  bgColor: const Color(0xFFFEF3C7),
                  iconColor: const Color(0xFF92400E),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => StudentVideoLibraryScreen(
                          studentCourse: course,
                          studentBatch: batch,
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(width: 8),
                _quickActionButton(
                  icon: Icons.chat_bubble_rounded,
                  label: 'Messages',
                  bgColor: const Color(0xFFDEF7EC),
                  iconColor: const Color(0xFF075E54),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const StudentMessagesScreen(),
                      ),
                    );
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
            // 3. TUITION FEE & DUES STATUS (ON TOP OF ACADEMY ANNOUNCEMENTS)
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
                            'Tuition Fee & Dues Status',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: dueBadgeBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          dueLabel,
                          style: TextStyle(color: dueBadgeText, fontSize: 10.5, fontWeight: FontWeight.bold),
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
                              const Text('Monthly Fee', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text('₹$totalFee', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
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
                              const Text('Paid / Advance', style: TextStyle(fontSize: 10, color: Color(0xFF03543F), fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text('₹$advancePaid', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: (dueAmount > 0) ? const Color(0xFFFDF2F2) : const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: (dueAmount > 0) ? const Color(0xFFF8B4B4) : const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Balance Due', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 3),
                              Text('₹$dueAmount', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: dueBadgeText)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  // DUE DATE PROMINENTLY DISPLAYED WHEN DUE IS PENDING (MANDATED REQUIREMENT)
                  const SizedBox(height: 12),
                  if (dueAmount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDF2F2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFF8B4B4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.event_busy_rounded, size: 16, color: Color(0xFF9B1C1C)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: RichText(
                              text: TextSpan(
                                style: const TextStyle(fontSize: 11.5, color: Color(0xFF9B1C1C)),
                                children: [
                                  const TextSpan(text: 'Due Date: ', style: TextStyle(fontWeight: FontWeight.bold)),
                                  TextSpan(
                                    text: '${_profile?['due_date'] ?? '10th Oct 2026'} ',
                                    style: const TextStyle(fontWeight: FontWeight.w900, decoration: TextDecoration.underline),
                                  ),
                                  TextSpan(
                                    text: '• Pending Amount ₹$dueAmount',
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDEF7EC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF31C48D).withOpacity(0.35)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.verified_rounded, size: 16, color: Color(0xFF03543F)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: RichText(
                              text: TextSpan(
                                style: const TextStyle(fontSize: 11.5, color: Color(0xFF03543F)),
                                children: [
                                  const TextSpan(text: 'No Dues Pending • Next Due Cycle: ', style: TextStyle(fontWeight: FontWeight.bold)),
                                  TextSpan(
                                    text: '${_profile?['next_due_date'] ?? '10th Nov 2026'}',
                                    style: const TextStyle(fontWeight: FontWeight.w900),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // =================================================================
            // 4. MOVING ADVERTISEMENT BANNER WITH IMAGES
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
                                            ann['type_tag'] ?? 'FEATURED',
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
                                              ann['title'] ?? 'Academy Update',
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

            const SizedBox(height: 20),

            // =================================================================
            // 5. MY COURSES LIST (BELOW ANNOUNCEMENTS & FEE STATUS BAR)
            // Info: Course name, Trainer name, Total attendance of this month
            // =================================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Enrolled Courses',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: LaasyaColors.textDark,
                  ),
                ),
                GestureDetector(
                  onTap: widget.onNavigateToCourses,
                  child: const Text(
                    'View Details →',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: LaasyaColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (_courses.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFF0D5E4)),
                ),
                child: const Center(
                  child: Text('No enrolled courses currently found.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _courses.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final c = _courses[index];
                  final courseName = c['title'] ?? 'Course';
                  final trainerName = c['trainer_name'] ?? 'Assigned Guru';
                  final monthAttendance = c['month_attendance'] ?? '${c['attendance_rate'] ?? 90}% this month';
                  final batchName = c['batch_name'] ?? 'Batch A';
                  final room = c['room'] ?? 'Natya Mandapam';
                  final timings = c['timings'] ?? 'Regular Schedule';
                  final int rate = (c['attendance_rate'] is int)
                      ? c['attendance_rate']
                      : int.tryParse(c['attendance_rate']?.toString() ?? '90') ?? 90;

                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
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
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left colored accent top row
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF2F8),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFF0D5E4)),
                                ),
                                child: Text(
                                  c['category'] ?? 'Art & Music',
                                  style: const TextStyle(
                                    color: LaasyaColors.primary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDEF7EC),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  c['status'] ?? 'Active',
                                  style: const TextStyle(
                                    color: Color(0xFF03543F),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Main Course Details
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // 1. Course Name
                              Text(
                                courseName,
                                style: const TextStyle(
                                  fontSize: 16.5,
                                  fontWeight: FontWeight.bold,
                                  color: LaasyaColors.textDark,
                                ),
                              ),
                              const SizedBox(height: 4),

                              // 2. Assigned Guru
                              Row(
                                children: [
                                  const Icon(Icons.school_rounded, size: 14, color: LaasyaColors.primary),
                                  const SizedBox(width: 5),
                                  Expanded(
                                    child: Text(
                                      'Guru: $trainerName',
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        color: LaasyaColors.textMuted,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 6),

                              // Batch & Room details chip
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFBF8FA),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.meeting_room_outlined, size: 13, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        '$batchName • $room • $timings',
                                        style: const TextStyle(fontSize: 10.5, color: Colors.black54),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const Divider(height: 1),

                        // 3. Total Attendance of This Month
                        Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.fact_check_outlined, size: 14, color: LaasyaColors.primary),
                                      SizedBox(width: 5),
                                      Text(
                                        'This Month Attendance',
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.bold,
                                          color: LaasyaColors.textDark,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    monthAttendance,
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.bold,
                                      color: LaasyaColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: LinearProgressIndicator(
                                  value: rate / 100,
                                  backgroundColor: const Color(0xFFF3E8EE),
                                  color: LaasyaColors.primary,
                                  minHeight: 7,
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

            const SizedBox(height: 24),
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
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFF0D5E4)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.015),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.bold,
                  color: LaasyaColors.textDark,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

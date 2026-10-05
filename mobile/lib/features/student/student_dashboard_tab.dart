import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import 'student_payments_screen.dart';
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
    final notifs = await SupabaseService().getNotifications();
    final sch = await SupabaseService().getStudentSchedule();

    if (mounted) {
      setState(() {
        _profile = prof;
        _courses = crs;
        _announcements = notifs.where((n) => n['type'] == 'announcement').toList();
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

  void _showAnnouncementDetail(Map<String, dynamic> ann) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(26),
            topRight: Radius.circular(26),
          ),
        ),
        padding: const EdgeInsets.all(22),
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
                child: AspectRatio(
                  aspectRatio: 2.2 / 1,
                  child: Image.network(
                    ann['image_url'],
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: LaasyaColors.primary.withOpacity(0.1),
                      child: const Icon(Icons.campaign_rounded, color: LaasyaColors.primary, size: 36),
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 14),
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
            const SizedBox(height: 10),
            Text(
              ann['title'] ?? 'Notice',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
            ),
            const SizedBox(height: 8),
            Text(
              ann['message'] ?? '',
              style: const TextStyle(fontSize: 13.5, color: Colors.black87, height: 1.45),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(Icons.calendar_today_rounded, size: 14, color: Colors.grey),
                const SizedBox(width: 6),
                Text(
                  ann['date'] ?? 'Recent',
                  style: const TextStyle(fontSize: 11.5, color: Colors.grey, fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: LaasyaColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Close Notice', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
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
                  icon: Icons.receipt_long_rounded,
                  label: 'Invoices',
                  bgColor: const Color(0xFFDEF7EC),
                  iconColor: const Color(0xFF03543F),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => StudentPaymentsScreen(studentProfile: _profile),
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
                    height: 168,
                    child: PageView.builder(
                      controller: _bannerController,
                      itemCount: _announcements.length,
                      onPageChanged: (idx) => setState(() => _currentBannerIndex = idx),
                      itemBuilder: (context, index) {
                        final ann = _announcements[index];
                        final imageUrl = ann['image_url'] ??
                            'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop&q=80';

                        return GestureDetector(
                          onTap: () => _showAnnouncementDetail(ann),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            decoration: BoxDecoration(
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
                                  // Banner Image
                                  Image.network(
                                    imageUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(
                                      decoration: const BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [Color(0xFF590231), Color(0xFF8A064D)],
                                        ),
                                      ),
                                    ),
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

            const SizedBox(height: 18),

            // =================================================================
            // 4. TUITION FEE & DUES STATUS BAR (EXECUTIVE REPLACED FROM PROFILE)
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
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => StudentPaymentsScreen(studentProfile: _profile),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.receipt_long_rounded, size: 14, color: LaasyaColors.primary),
                              SizedBox(width: 6),
                              Text(
                                'View Payment History & Download Invoices',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: LaasyaColors.primary,
                                ),
                              ),
                            ],
                          ),
                          Icon(Icons.arrow_forward_ios_rounded, size: 12, color: LaasyaColors.primary),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
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

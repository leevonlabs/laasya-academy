import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import '../student/student_video_library_screen.dart';
import 'trainer_salaries_screen.dart';

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
    final sess = await SupabaseService().getTrainerTodaySessions();
    final btc = await SupabaseService().getTrainerBatches();
    final notifs = await SupabaseService().getNotifications();

    if (mounted) {
      setState(() {
        _profile = prof;
        _todaySessions = sess;
        _batches = btc;
        _announcements = notifs.where((n) => n['type'] == 'announcement').toList();
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
    if (hour < 12) return 'Good Morning, Guru';
    if (hour < 17) return 'Good Afternoon, Guru';
    return 'Good Evening, Guru';
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
                ann['type_tag'] ?? 'Academy Bulletin',
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

    final name = _profile?['full_name'] ?? 'Smt. Anusha Sumesh';
    final designation = _profile?['designation'] ?? 'Head Guru & Choreographer';
    final specialization = _profile?['specialization'] ?? 'Bharatanatyam Classical Dance';
    final avatarUrl = _profile?['avatar_url'] as String?;
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
                                  ? const CircleAvatar(
                                      backgroundColor: Color(0xFFD4AF37),
                                      child: Icon(Icons.person, size: 34, color: Colors.white),
                                    )
                                  : Image.network(
                                      avatarUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const CircleAvatar(
                                        backgroundColor: Color(0xFFD4AF37),
                                        child: Icon(Icons.person, size: 34, color: Colors.white),
                                      ),
                                    ))
                              : const CircleAvatar(
                                  backgroundColor: Color(0xFFD4AF37),
                                  child: Icon(Icons.person, size: 34, color: Colors.white),
                                ),
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
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => StudentVideoLibraryScreen(
                          studentCourse: specialization,
                          studentBatch: 'All Batches',
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(width: 8),
                _quickActionButton(
                  icon: Icons.receipt_long_rounded,
                  label: 'Pay Slips',
                  bgColor: const Color(0xFFDEF7EC),
                  iconColor: const Color(0xFF03543F),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TrainerSalariesScreen(trainerProfile: _profile),
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

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF0D5E4)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
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
                              batch?['courses']?['title'] ?? 'Bharathanatyam',
                              style: const TextStyle(color: LaasyaColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDEF7EC),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF31C48D).withOpacity(0.3)),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.how_to_reg_rounded, size: 13, color: Color(0xFF03543F)),
                                SizedBox(width: 4),
                                Text(
                                  'Trainer Roll-Call',
                                  style: TextStyle(color: Color(0xFF03543F), fontWeight: FontWeight.bold, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        batch?['name'] ?? 'Bharathanatyam - Batch A',
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
                              icon: const Icon(Icons.playlist_add_check_rounded, size: 18),
                              label: const Text('Start & Take Attendance', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
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
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
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
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: LaasyaColors.textDark,
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

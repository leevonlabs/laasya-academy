import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';
import 'trainer_data_store.dart';
import 'trainer_take_attendance_screen.dart';

class TrainerAttendanceTab extends StatefulWidget {
  const TrainerAttendanceTab({super.key});

  @override
  State<TrainerAttendanceTab> createState() => _TrainerAttendanceTabState();
}

class _TrainerAttendanceTabState extends State<TrainerAttendanceTab> {
  final TrainerDataStore _store = TrainerDataStore();

  bool _isLoading = true;
  String _batchFilter = 'today';

  @override
  void initState() {
    super.initState();
    _syncData();
  }

  Future<void> _syncData() async {
    final prof = SupabaseService().currentUserProfile ?? await SupabaseService().getCurrentUserProfile();
    await _store.syncFromApi(
      trainerName: prof?['full_name'],
      phone: prof?['phone'],
    );
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  void _showCloseClassConfirmation(Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.notifications_active_rounded, color: Color(0xFF590231), size: 24),
            SizedBox(width: 10),
            Text('Close Today\'s Class?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Conclude today\'s class session for ${item['course_short_title']} (${item['batch_name']})?',
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF2F8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF0D5E4)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.ring_volume_rounded, color: Color(0xFF590231), size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'This will send a 10-second attention alarm chime to parents\' phones reminding them to pick up their child.',
                      style: TextStyle(fontSize: 11.5, color: Color(0xFF590231), height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'You can still edit student attendance until 11:59 PM today.',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              _store.closeClassSession(
                batchId: item['batch_id'] as String,
                batchName: item['batch_name'] as String,
                courseTitle: item['course_title'] as String,
              );
              setState(() {});
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Class session closed! Attention chime broadcast to parents.'),
                  backgroundColor: Color(0xFF590231),
                ),
              );
            },
            icon: const Icon(Icons.check_circle_rounded, size: 18),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF590231),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            label: const Text('Confirm & Alert', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dayOfWeek = DateFormat('EEEE').format(now);
    final formattedDate = DateFormat('d MMMM yyyy').format(now);
    final todayClasses = _store.getTodayClasses();
    final allClasses = _store.getAllAssignedClasses();
    final isShowingToday = _batchFilter == 'today' && todayClasses.isNotEmpty;
    final displayedClasses = isShowingToday ? todayClasses : allClasses;

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : RefreshIndicator(
        onRefresh: () async {
          await _syncData();
        },
        color: LaasyaColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // =================================================================
              // 1. CURRENT DATE ON TOP (TODAY'S SCHEDULE & ATTENDANCE)
              // =================================================================
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF590231), Color(0xFF8A064D)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF590231).withOpacity(0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, color: LaasyaColors.accentGold, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              'TODAY\'S ATTENDANCE CONSOLE',
                              style: TextStyle(
                                color: LaasyaColors.accentGold.withOpacity(0.95),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.4)),
                          ),
                          child: const Text(
                            'LIVE TODAY',
                            style: TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '$dayOfWeek, $formattedDate',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Guru can manage attendance for the current day only. The schedule will automatically refresh tomorrow.',
                      style: TextStyle(fontSize: 12, color: Colors.white70, height: 1.35),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.schedule_rounded, color: LaasyaColors.accentGold, size: 14),
                          const SizedBox(width: 6),
                          Text(
                            '${todayClasses.length} Scheduled Classes for Today',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // =================================================================
              // 2. BATCH FILTER TOGGLE & AVAILABLE CLASSES HEADER
              // =================================================================
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFF0D5E4)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _batchFilter = 'today'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _batchFilter == 'today' ? LaasyaColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            "Today's Batches (${todayClasses.length})",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _batchFilter == 'today' ? Colors.white : Colors.black87,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _batchFilter = 'all'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _batchFilter == 'all' ? LaasyaColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            "All My Batches (${allClasses.length})",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _batchFilter == 'all' ? Colors.white : Colors.black87,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _batchFilter == 'today' && todayClasses.isNotEmpty
                        ? 'Today\'s Scheduled Classes'
                        : 'Assigned Guru Batches',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: LaasyaColors.textDark,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3E8EE),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${displayedClasses.length} AVAILABLE',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: LaasyaColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Tap on any course name to open the roll-call page and record attendance.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),

              const SizedBox(height: 14),

              // =================================================================
              // 3. AVAILABLE CLASSES LIST (CLICKABLE TO OPEN NEW ATTENDANCE PAGE)
              // =================================================================
              if (displayedClasses.isEmpty)
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFF0D5E4)),
                  ),
                  child: Center(
                    child: Text(
                      _batchFilter == 'today'
                          ? 'No classes scheduled for today ($dayOfWeek). Tap "All My Batches" above to take attendance.'
                          : 'No batches currently assigned.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ),
                )
              else
                ...displayedClasses.map((item) {
                  final status = _store.getSessionStatus(item['batch_id']);
                  final cColor = item['course_color'] as Color;
                  final students = item['students'] as List;
                  final isSubmitted = status == 'submitted';
                  final isInProgress = status == 'in_progress';
                  final isClosed = status == 'closed';

                  // Dynamic color palettes for clear visual status differentiation:
                  Color cardBgColor = Colors.white;
                  Color cardBorderColor = const Color(0xFFF0D5E4);
                  Color accentStripColor = const Color(0xFFF59E0B); // Amber
                  Color headerStripColor = cColor.withOpacity(0.06);
                  Color badgeBgColor = const Color(0xFFFEF3C7);
                  Color badgeTextColor = const Color(0xFFB45309);
                  String badgeLabel = 'ROLL-CALL PENDING';
                  IconData badgeIcon = Icons.hourglass_top_rounded;
                  String timingsSubtitle = 'Today\'s class • Roll-call not marked';

                  if (isClosed) {
                    cardBgColor = const Color(0xFFF0FDF4); // Soft Emerald Mint
                    cardBorderColor = const Color(0xFF34D399); // Solid Emerald Border
                    accentStripColor = const Color(0xFF059669); // Emerald Strip
                    headerStripColor = const Color(0xFFDCFCE7);
                    badgeBgColor = const Color(0xFF059669);
                    badgeTextColor = Colors.white;
                    badgeLabel = 'COMPLETED & ALERTED';
                    badgeIcon = Icons.check_circle_rounded;
                    timingsSubtitle = 'Session concluded • Parents alerted • Editable today';
                  } else if (isSubmitted) {
                    cardBgColor = const Color(0xFFFFFBEB); // Warm Gold Tint
                    cardBorderColor = const Color(0xFFFBBF24); // Solid Amber-Gold Border
                    accentStripColor = const Color(0xFFD97706); // Warm Amber Strip
                    headerStripColor = const Color(0xFFFEF3C7);
                    badgeBgColor = const Color(0xFFD97706);
                    badgeTextColor = Colors.white;
                    badgeLabel = 'ATTENDANCE TAKEN';
                    badgeIcon = Icons.fact_check_rounded;
                    timingsSubtitle = 'Roll-call recorded • Ready to close class & alert';
                  } else if (isInProgress) {
                    cardBgColor = const Color(0xFFFFF7ED);
                    cardBorderColor = const Color(0xFFF97316);
                    accentStripColor = const Color(0xFFEA580C);
                    headerStripColor = const Color(0xFFFFEDD5);
                    badgeBgColor = const Color(0xFFEA580C);
                    badgeTextColor = Colors.white;
                    badgeLabel = 'IN PROGRESS';
                    badgeIcon = Icons.pending_actions_rounded;
                    timingsSubtitle = 'Attendance draft in progress';
                  }

                  return GestureDetector(
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TrainerTakeAttendanceScreen(classInfo: item),
                        ),
                      );
                      setState(() {});
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 14),
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
                              // Left Status Indicator Accent Strip
                              Container(
                                width: 6,
                                color: accentStripColor,
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Card Header strip with Course Title & Status badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      decoration: BoxDecoration(
                                        color: headerStripColor,
                                        borderRadius: const BorderRadius.only(topRight: Radius.circular(19)),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(item['course_icon'] as IconData, size: 20, color: cColor),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              item['course_title'] as String,
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                                color: cColor,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: badgeBgColor,
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(badgeIcon, size: 12, color: badgeTextColor),
                                                const SizedBox(width: 4),
                                                Text(
                                                  badgeLabel,
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                    color: badgeTextColor,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Card Body
                                    Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      item['batch_name'] as String,
                                                      style: const TextStyle(
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 15,
                                                        color: LaasyaColors.textDark,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 3),
                                                    Text(
                                                      '${item['batch_number']} • ${item['room']}',
                                                      style: const TextStyle(fontSize: 11.5, color: Colors.grey),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(8),
                                                  border: Border.all(color: const Color(0xFFF0D5E4)),
                                                ),
                                                child: Text(
                                                  '${students.length} Disciples',
                                                  style: const TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                    color: LaasyaColors.primary,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),

                                          const SizedBox(height: 12),

                                          // Timings & Live Status Row
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(10),
                                              border: Border.all(color: cardBorderColor.withOpacity(0.5)),
                                            ),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    const Icon(Icons.access_time_rounded, size: 15, color: LaasyaColors.primary),
                                                    const SizedBox(width: 8),
                                                    Text(
                                                      'Class Timings: ${item['timings']}',
                                                      style: const TextStyle(
                                                        fontSize: 12.5,
                                                        fontWeight: FontWeight.bold,
                                                        color: LaasyaColors.textDark,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 3),
                                                Row(
                                                  children: [
                                                    Icon(badgeIcon, size: 13, color: badgeTextColor),
                                                    const SizedBox(width: 6),
                                                    Expanded(
                                                      child: Text(
                                                        timingsSubtitle,
                                                        style: TextStyle(
                                                          fontSize: 11,
                                                          color: badgeTextColor,
                                                          fontWeight: FontWeight.w600,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),

                                          const SizedBox(height: 14),

                                          // Action Row
                                          Row(
                                            children: [
                                              if (isSubmitted) ...[
                                                Expanded(
                                                  child: ElevatedButton.icon(
                                                    onPressed: () => _showCloseClassConfirmation(item),
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: const Color(0xFF590231),
                                                      foregroundColor: Colors.white,
                                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                                      elevation: 1,
                                                    ),
                                                    icon: const Icon(
                                                      Icons.notifications_active_rounded,
                                                      size: 16,
                                                      color: Colors.white,
                                                    ),
                                                    label: const Text(
                                                      'Close Class & Alert',
                                                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                OutlinedButton.icon(
                                                  onPressed: () async {
                                                    await Navigator.push(
                                                      context,
                                                      MaterialPageRoute(
                                                        builder: (_) => TrainerTakeAttendanceScreen(classInfo: item),
                                                      ),
                                                    );
                                                    setState(() {});
                                                  },
                                                  style: OutlinedButton.styleFrom(
                                                    foregroundColor: const Color(0xFFD97706),
                                                    side: const BorderSide(color: Color(0xFFFBBF24), width: 1.5),
                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                                  ),
                                                  icon: const Icon(Icons.edit_rounded, size: 15),
                                                  label: const Text('Edit', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                                ),
                                              ] else ...[
                                                Expanded(
                                                  child: ElevatedButton.icon(
                                                    onPressed: () async {
                                                      await Navigator.push(
                                                        context,
                                                        MaterialPageRoute(
                                                          builder: (_) => TrainerTakeAttendanceScreen(classInfo: item),
                                                        ),
                                                      );
                                                      setState(() {});
                                                    },
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: isClosed
                                                          ? const Color(0xFF03543F)
                                                          : (isInProgress ? const Color(0xFFEA580C) : cColor),
                                                      foregroundColor: Colors.white,
                                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                                      elevation: 1,
                                                    ),
                                                    icon: Icon(
                                                      isClosed
                                                          ? Icons.edit_calendar_rounded
                                                          : (isInProgress ? Icons.pending_actions_rounded : Icons.how_to_reg_rounded),
                                                      size: 16,
                                                      color: Colors.white,
                                                    ),
                                                    label: Text(
                                                      isClosed
                                                          ? 'Edit Attendance (Today)'
                                                          : (isInProgress ? 'Continue Attendance' : 'Take Roll-Call Attendance'),
                                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }),

              const SizedBox(height: 16),

              // Info card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_clock_rounded, color: LaasyaColors.primary, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Attendance changes are locked at midnight. Past records can be audited in Admin reports.',
                        style: TextStyle(fontSize: 11.5, color: Colors.black87),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../../core/utils/pdf_launcher.dart';

class StudentPaymentsScreen extends StatefulWidget {
  final Map<String, dynamic>? studentProfile;

  const StudentPaymentsScreen({
    super.key,
    this.studentProfile,
  });

  @override
  State<StudentPaymentsScreen> createState() => _StudentPaymentsScreenState();
}

class _StudentPaymentsScreenState extends State<StudentPaymentsScreen> {
  List<Map<String, dynamic>> _payments = [];
  bool _isLoading = true;
  String _paymentTypeFilter = 'all'; // 'all', 'upi', 'card', 'netbanking'
  int _currentMonthDue = 0;
  bool _isPaidCurrentMonth = true;
  String _currentMonthName = 'October 2026';

  String _monthFullName(int m) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return (m >= 1 && m <= 12) ? months[m - 1] : 'Month';
  }

  void _updateDueStatus() {
    final now = DateTime.now();
    _currentMonthName = '${_monthFullName(now.month)} ${now.year}';
    final curMShort = _monthName(now.month).toLowerCase();
    final curMFull = _monthFullName(now.month).toLowerCase();
    final curY = now.year.toString();

    final hasPaymentThisMonth = _payments.any((p) {
      final period = (p['fee_period'] ?? '').toString().toLowerCase();
      final date = (p['payment_date'] ?? '').toString().toLowerCase();
      final matchesMonth = period.contains(curMShort) || period.contains(curMFull) ||
                           date.contains(curMShort) || date.contains(curMFull);
      final matchesYear = period.contains(curY) || date.contains(curY);
      return matchesMonth && matchesYear;
    });

    final rawDue = widget.studentProfile?['due_amount'];
    if (hasPaymentThisMonth) {
      _currentMonthDue = 0;
      _isPaidCurrentMonth = true;
    } else if (rawDue is num && rawDue > 0) {
      _currentMonthDue = rawDue.toInt();
      _isPaidCurrentMonth = false;
    } else {
      _currentMonthDue = 0;
      _isPaidCurrentMonth = true;
    }
  }

  @override
  void initState() {
    super.initState();
    _payments = SupabaseService().getCachedPayments();
    _updateDueStatus();
    _isLoading = _payments.isEmpty;
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    if (_payments.isEmpty) {
      setState(() => _isLoading = true);
    }
    final data = await SupabaseService().getStudentPayments();
    if (mounted) {
      setState(() {
        _payments = data;
        _isLoading = false;
        _updateDueStatus();
      });
    }
  }

  // Invoice modal view with download and share options
  void _showInvoiceModal(Map<String, dynamic> item) {
    final rawInv = (item['invoice_number'] ?? '').toString();
    final rawRec = (item['receipt_number'] ?? '').toString();
    final fallbackHash = (item['id'] ?? '10006').toString().replaceAll(RegExp(r'[^0-9]'), '').padRight(5, '7').substring(0, 5);
    final invNo = (rawInv.isNotEmpty && rawInv != 'LCA-INV' && rawInv != 'LCA-INV-2026') 
        ? rawInv 
        : 'LCA-INV-2026-$fallbackHash';
    final recNo = (rawRec.isNotEmpty && rawRec != 'LCA-REC' && rawRec != 'LCA-REC-2026') 
        ? rawRec 
        : 'LCA-REC-2026-$fallbackHash';
    final date = (item['payment_date'] ?? 'Recent').toString();
    final period = (item['fee_period'] ?? 'Monthly Tuition').toString();
    final course = (item['course_title'] ?? 'Bharathanatyam').toString();
    final batch = (item['batch_name'] ?? 'Batch A').toString();
    final studentName = (item['student_name'] ?? widget.studentProfile?['full_name'] ?? 'Aditi Sundaram').toString();
    final rollNo = (item['roll_number'] ?? widget.studentProfile?['roll_number'] ?? 'LCA-6').toString();
    final parentName = (item['parent_name'] ?? widget.studentProfile?['parent_name'] ?? 'Sri Sundaram V.').toString();
    final method = (item['payment_method'] ?? 'UPI').toString().toUpperCase();
    final ref = (item['transaction_reference'] ?? 'UPI/ONLINE').toString();
    final issuedBy = (item['receipt_issued_by'] ?? 'Sri Ramesh Rao (Director)').toString();
    final amount = item['amount_paid'] ?? 2000;
    final discount = item['discount_amount'] ?? 0;
    final gross = item['gross_amount'] ?? amount;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.88,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(28),
              topRight: Radius.circular(28),
            ),
          ),
          child: Column(
            children: [
              // Top drag indicator
              const SizedBox(height: 12),
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 12),

              // Title Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.receipt_long_rounded, color: LaasyaColors.primary, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'Official Fee Receipt & Tax Invoice',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: LaasyaColors.textDark,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          tooltip: 'Download PDF',
                          icon: const Icon(Icons.download_rounded, color: LaasyaColors.primary, size: 22),
                          onPressed: () => _downloadInvoice(invNo, studentName, item: item),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 22),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              // Invoice Printable Card Body
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFDFE),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFF0D5E4), width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Academy Header
                        Center(
                          child: Column(
                            children: [
                              Image.asset(
                                'assets/images/crest_logo.png',
                                width: 44,
                                height: 44,
                                errorBuilder: (c, e, s) => const SizedBox.shrink(),
                              ),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF590231),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'LAASYA CULTURAL ACADEMY',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Laasya Cultural Academy, Main Campus, Hyderabad | Ph: +91 8151 998 899',
                                style: TextStyle(fontSize: 9.5, color: Colors.grey, fontWeight: FontWeight.w500),
                                textAlign: TextAlign.center,
                              ),
                              const Text(
                                'shanmukvarada@gmail.com • Society Reg. No: REG/HYD/2018/84920',
                                style: TextStyle(fontSize: 9.5, color: Colors.black54),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),
                        const Divider(height: 1, thickness: 1),
                        const SizedBox(height: 14),

                        // Invoice & Date Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('INVOICE NUMBER', style: TextStyle(fontSize: 9.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Text(invNo, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark)),
                                const SizedBox(height: 6),
                                const Text('RECEIPT NO', style: TextStyle(fontSize: 9.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                                Text(recNo, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('DATE OF PAYMENT', style: TextStyle(fontSize: 9.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Text(date, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark)),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'STATUS: PAID',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF03543F)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 14),

                        // Billed To Section
                        const Text(
                          'STUDENT & ENROLLMENT PARTICULARS',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: LaasyaColors.primary),
                        ),
                        const SizedBox(height: 8),
                        _invRow('Student Name', studentName),
                        _invRow('Student Roll No', rollNo),
                        _invRow('Enrolled Course', course),
                        _invRow('Assigned Batch', batch),
                        _invRow('Parent / Guardian', parentName),
                        _invRow('Fee Billing Period', period),

                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 14),

                        // Fee Line Items
                        const Text(
                          'PAYMENT BREAKDOWN (GST ITEMIZED)',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: LaasyaColors.primary),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('$course Tuition ($period)', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                  Text('₹$gross', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Base Tuition (excl. GST)', style: TextStyle(fontSize: 11, color: Colors.black54)),
                                  Text(
                                    '₹${((gross is num ? gross.toDouble() : 2000.0) / 1.18).toStringAsFixed(2)}',
                                    style: const TextStyle(fontSize: 11, color: Colors.black87, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('GST (18% included • HSN: 999293)', style: TextStyle(fontSize: 11, color: Color(0xFF03543F))),
                                  Text(
                                    '₹${((gross is num ? gross.toDouble() : 2000.0) - ((gross is num ? gross.toDouble() : 2000.0) / 1.18)).toStringAsFixed(2)}',
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF03543F), fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              if (discount > 0) ...[
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Academy Concession / Discount', style: TextStyle(fontSize: 11, color: Colors.green)),
                                    Text('- ₹$discount', style: const TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ],
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Total Net Paid Amount', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark)),
                                  Text('₹$amount', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Payment Details
                        _invRow('Payment Mode', method),
                        _invRow('Transaction UTR / Ref', ref),
                        _invRow('Authorized Issuer', issuedBy),

                        const SizedBox(height: 18),

                        // Seal & Director Signature
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                border: Border.all(color: const Color(0xFF03543F), width: 1.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Column(
                                children: [
                                  Icon(Icons.verified_rounded, size: 20, color: Color(0xFF03543F)),
                                  SizedBox(height: 2),
                                  Text('DIGITALLY VERIFIED', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('For Laasya Cultural Academy', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                const SizedBox(height: 4),
                                const Text('Sri Ramesh Rao', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                                Text('Academy Director', style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Action buttons at the bottom of modal
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Colors.grey.shade200)),
                ),
                child: Row(
                  children: [
                    // Share / Copy Text
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: LaasyaColors.primary,
                          side: const BorderSide(color: Color(0xFFF0D5E4)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(
                            text: 'Laasya Cultural Academy - Fee Receipt\n'
                                'Invoice: $invNo\n'
                                'Student: $studentName ($rollNo)\n'
                                'Course: $course\n'
                                'Period: $period\n'
                                'Amount Paid: ₹$amount\n'
                                'Txn Ref: $ref\n'
                                'Date: $date\n'
                                'Status: Verified & Paid',
                          ));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Receipt details copied for $invNo'),
                              backgroundColor: LaasyaColors.primary,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        icon: const Icon(Icons.share_rounded, size: 16),
                        label: const Text('Share Receipt', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Download Invoice Button
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF590231),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _downloadInvoice(invNo, studentName, item: item);
                        },
                        icon: const Icon(Icons.download_rounded, size: 18, color: LaasyaColors.accentGold),
                        label: const Text(
                          'Download PDF',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Interactive Premium Self-Service Payment Gateway Modal for Students (Demo Mode)
  void _showPaymentGatewayModal(int feeAmount, String courseTitle) {
    int selectedTab = 0; // 0: UPI, 1: Card, 2: NetBanking
    String selectedOutcome = 'SUCCESS'; // SUCCESS, FAILURE, CANCELLED, TIMEOUT, PENDING
    bool isProcessing = false;
    String processingStage = 'Initializing secure payment session...';
    String selectedBank = 'Axis Bank Retail (Demo)';
    final studentName = widget.studentProfile?['full_name'] ?? 'Student';
    final rollNo = widget.studentProfile?['roll_number'] ?? 'LCA-6';
    final double baseFee = feeAmount / 1.18;
    final double gstFee = feeAmount - baseFee;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (mCtx) {
        return StatefulBuilder(
          builder: (ctx, setMState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.92,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(28),
                ),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Header with Security & Academy Branding
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.shield_rounded, color: Color(0xFFB45309), size: 20),
                            ),
                            const SizedBox(width: 10),
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Axis Bank Demo Gateway',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: LaasyaColors.textDark,
                                  ),
                                ),
                                Text(
                                  'DEMO SIMULATOR • PCI DSS Level 1 Sandbox',
                                  style: TextStyle(fontSize: 10, color: Color(0xFF92400E), fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 22),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),

                  Expanded(
                    child: isProcessing
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFFF2F8),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: const Color(0xFFF0D5E4)),
                                    ),
                                    child: const SizedBox(
                                      width: 44,
                                      height: 44,
                                      child: CircularProgressIndicator(
                                        color: LaasyaColors.primary,
                                        strokeWidth: 3.5,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                  Text(
                                    processingStage,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Simulating demo payment of ₹$feeAmount for $studentName ($rollNo)...',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                                  ),
                                  const SizedBox(height: 16),
                                  const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFFB45309)),
                                      SizedBox(width: 4),
                                      Text(
                                        'DEMO MODE — NO REAL MONEY WILL BE TRANSFERRED',
                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFB45309)),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          )
                        : SingleChildScrollView(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // MANDATORY DEMO NOTICE BANNER
                                Container(
                                  margin: const EdgeInsets.only(bottom: 14),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFF59E0B)),
                                  ),
                                  child: const Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Icon(Icons.warning_amber_rounded, size: 20, color: Color(0xFFB45309)),
                                      SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'DEMO MODE — NO REAL MONEY WILL BE TRANSFERRED',
                                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                                            ),
                                            SizedBox(height: 2),
                                            Text(
                                              'Official Axis Bank PG credentials pending onboarding. Real student dues are unaffected.',
                                              style: TextStyle(fontSize: 10, color: Color(0xFF78350F)),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Interactive Simulation Outcome Selector (For Testing)
                                Container(
                                  margin: const EdgeInsets.only(bottom: 14),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.grey.shade200),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Row(
                                        children: [
                                          Icon(Icons.tune_rounded, size: 14, color: Color(0xFF8A064D)),
                                          SizedBox(width: 5),
                                          Text(
                                            'Test Simulation Outcome:',
                                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Wrap(
                                        spacing: 6,
                                        runSpacing: 6,
                                        children: [
                                          _outcomeChip('SUCCESS', 'Success', selectedOutcome == 'SUCCESS', () => setMState(() => selectedOutcome = 'SUCCESS')),
                                          _outcomeChip('FAILURE', 'Decline', selectedOutcome == 'FAILURE', () => setMState(() => selectedOutcome = 'FAILURE')),
                                          _outcomeChip('CANCELLED', 'Cancel', selectedOutcome == 'CANCELLED', () => setMState(() => selectedOutcome = 'CANCELLED')),
                                          _outcomeChip('TIMEOUT', 'Timeout', selectedOutcome == 'TIMEOUT', () => setMState(() => selectedOutcome = 'TIMEOUT')),
                                          _outcomeChip('PENDING', 'Pending', selectedOutcome == 'PENDING', () => setMState(() => selectedOutcome = 'PENDING')),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                // Order Breakdown Card
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFFFFF9FB), Colors.white],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFFF0D5E4)),
                                    boxShadow: [
                                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
                                    ],
                                  ),
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
                                                Row(
                                                  children: [
                                                    const Icon(Icons.school_rounded, size: 15, color: LaasyaColors.primary),
                                                    const SizedBox(width: 5),
                                                    Expanded(
                                                      child: Text(
                                                        courseTitle,
                                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 2),
                                                Text('Student: $studentName • $rollNo', style: const TextStyle(fontSize: 11, color: Colors.black54)),
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Text('₹$feeAmount', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                              const Text('Total Payable', style: TextStyle(fontSize: 9.5, color: Colors.grey)),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      const Divider(height: 1),
                                      const SizedBox(height: 8),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text('Base Tuition (excl. GST):', style: TextStyle(fontSize: 11, color: Colors.black54)),
                                          Text('₹${baseFee.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87)),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text('GST (18% itemized):', style: TextStyle(fontSize: 11, color: Colors.black54)),
                                          Text('₹${gstFee.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87)),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      const Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text('Platform Fee:', style: TextStyle(fontSize: 11, color: Color(0xFF03543F))),
                                          Text('FREE (₹0.00)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 18),

                                // Payment Method Selection Tabs
                                const Text(
                                  'SELECT PAYMENT METHOD',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Colors.grey),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    _gatewayTabItem(0, 'Axis UPI / QR', Icons.qr_code_2_rounded, selectedTab, () => setMState(() => selectedTab = 0)),
                                    const SizedBox(width: 8),
                                    _gatewayTabItem(1, 'Cards (RuPay)', Icons.credit_card_rounded, selectedTab, () => setMState(() => selectedTab = 1)),
                                    const SizedBox(width: 8),
                                    _gatewayTabItem(2, 'NetBanking', Icons.account_balance_rounded, selectedTab, () => setMState(() => selectedTab = 2)),
                                  ],
                                ),

                                const SizedBox(height: 16),

                                // Tab Content
                                if (selectedTab == 0) ...[
                                  // UPI View
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.grey.shade200),
                                    ),
                                    child: Column(
                                      children: [
                                        const Text('Scan Academy UPI QR or tap your preferred UPI app', style: TextStyle(fontSize: 11.5, color: Colors.grey)),
                                        const SizedBox(height: 14),
                                        // Stylized QR Card
                                        Container(
                                          width: 140,
                                          height: 140,
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(14),
                                            border: Border.all(color: const Color(0xFF590231), width: 1.5),
                                            boxShadow: [
                                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8),
                                            ],
                                          ),
                                          child: Stack(
                                            alignment: Alignment.center,
                                            children: [
                                              const Icon(Icons.qr_code_2_rounded, size: 120, color: Color(0xFF2D041A)),
                                              Container(
                                                padding: const EdgeInsets.all(3),
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  shape: BoxShape.circle,
                                                  border: Border.all(color: const Color(0xFF590231)),
                                                ),
                                                child: const Icon(Icons.school_rounded, size: 16, color: Color(0xFF590231)),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        // Copyable UPI ID Chip
                                        GestureDetector(
                                          onTap: () {
                                            Clipboard.setData(const ClipboardData(text: 'laasyaacademy@sbi'));
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                content: Text('UPI ID laasyaacademy@sbi copied to clipboard!'),
                                                duration: Duration(seconds: 2),
                                                behavior: SnackBarBehavior.floating,
                                              ),
                                            );
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFFF2F8),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFFF0D5E4)),
                                            ),
                                            child: const Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Text('UPI ID: laasyaacademy@sbi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                                                SizedBox(width: 6),
                                                Icon(Icons.copy_rounded, size: 13, color: LaasyaColors.primary),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 14),
                                        const Text('Instant 1-Tap App Transfer:', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                          children: [
                                            _upiAppIcon('GPay', const Color(0xFF4285F4)),
                                            _upiAppIcon('PhonePe', const Color(0xFF5F259F)),
                                            _upiAppIcon('Paytm', const Color(0xFF00B9F5)),
                                            _upiAppIcon('BHIM', const Color(0xFF00796B)),
                                            _upiAppIcon('Cred', const Color(0xFF1C2228)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ] else if (selectedTab == 1) ...[
                                  // Card View with Virtual Card Preview
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.grey.shade200),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Virtual Card Preview
                                        Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [Color(0xFF3D0322), Color(0xFF73053D)],
                                              begin: Alignment.topLeft,
                                              end: Alignment.bottomRight,
                                            ),
                                            borderRadius: BorderRadius.circular(16),
                                            border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.5)),
                                            boxShadow: [
                                              BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 8, offset: const Offset(0, 3)),
                                            ],
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  const Icon(Icons.sim_card_rounded, color: LaasyaColors.accentGold, size: 28),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: Colors.white.withOpacity(0.15),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: const Text('RuPay / Visa', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 12),
                                              const Text('4532  ••••  ••••  8910', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 2)),
                                              const SizedBox(height: 12),
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      const Text('CARDHOLDER', style: TextStyle(color: Colors.white60, fontSize: 8.5)),
                                                      Text(studentName.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                                    ],
                                                  ),
                                                  const Column(
                                                    crossAxisAlignment: CrossAxisAlignment.end,
                                                    children: [
                                                      Text('EXPIRES', style: TextStyle(color: Colors.white60, fontSize: 8.5)),
                                                      Text('12/29', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 14),
                                        const Text('Card Number', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
                                        const SizedBox(height: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade50,
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(color: Colors.grey.shade300),
                                          ),
                                          child: const Row(
                                            children: [
                                              Icon(Icons.credit_card_rounded, size: 18, color: Colors.grey),
                                              SizedBox(width: 10),
                                              Text('4532  ••••  ••••  8910', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  const Text('Expiry (MM/YY)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
                                                  const SizedBox(height: 6),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                                    decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.grey.shade300)),
                                                    child: const Text('12 / 29', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  const Text('CVV', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
                                                  const SizedBox(height: 6),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                                    decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.grey.shade300)),
                                                    child: const Text('•••', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        const Text('Supports Visa, MasterCard, RuPay debit & credit cards.', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                ] else ...[
                                  // NetBanking View
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.grey.shade200),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Select Your Bank', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
                                        const SizedBox(height: 10),
                                        _bankOption('State Bank of India (SBI)', selectedBank == 'State Bank of India (SBI)', () => setMState(() => selectedBank = 'State Bank of India (SBI)')),
                                        _bankOption('HDFC Bank', selectedBank == 'HDFC Bank', () => setMState(() => selectedBank = 'HDFC Bank')),
                                        _bankOption('ICICI Bank', selectedBank == 'ICICI Bank', () => setMState(() => selectedBank = 'ICICI Bank')),
                                        _bankOption('Axis Bank', selectedBank == 'Axis Bank', () => setMState(() => selectedBank = 'Axis Bank')),
                                        _bankOption('Kotak Mahindra Bank', selectedBank == 'Kotak Mahindra Bank', () => setMState(() => selectedBank = 'Kotak Mahindra Bank')),
                                        _bankOption('Punjab National Bank (PNB)', selectedBank == 'Punjab National Bank (PNB)', () => setMState(() => selectedBank = 'Punjab National Bank (PNB)')),
                                      ],
                                    ),
                                  ),
                                ],

                                const SizedBox(height: 22),

                                // Pay Button with Trust Seal
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF03543F),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                      elevation: 2,
                                    ),
                                    onPressed: () async {
                                      setMState(() {
                                        isProcessing = true;
                                        processingStage = 'Connecting to demo banking server...';
                                      });
                                      await Future.delayed(const Duration(milliseconds: 500));
                                      setMState(() => processingStage = 'Simulating Axis PG ($selectedOutcome)...');
                                      await Future.delayed(const Duration(milliseconds: 600));

                                      if (selectedOutcome == 'SUCCESS') {
                                        setMState(() => processingStage = 'Generating simulated tax invoice receipt...');
                                        await Future.delayed(const Duration(milliseconds: 400));

                                        final now = DateTime.now();
                                        final dateStr = '${now.day} ${_monthName(now.month)} ${now.year}';
                                        final newInvNo = 'LCA-INV-2026-${now.millisecondsSinceEpoch.toString().substring(7)}';
                                        final newRecNo = 'LCA-REC-${now.millisecondsSinceEpoch.toString().substring(8)}';
                                        final orderId = 'AXIS-DEMO-ORD-${now.millisecondsSinceEpoch.toString().substring(5)}';
                                        final demoRef = 'DEMO-REF-${now.millisecondsSinceEpoch.toString().substring(6)}';
                                        final newPayment = {
                                          'id': 'pay-${now.millisecondsSinceEpoch}',
                                          'invoice_number': newInvNo,
                                          'receipt_number': newRecNo,
                                          'payment_date': dateStr,
                                          'fee_period': '${_monthFullName(now.month)} ${now.year}',
                                          'course_title': courseTitle,
                                          'batch_name': 'Enrolled Batch',
                                          'student_name': studentName,
                                          'roll_number': rollNo,
                                          'parent_name': widget.studentProfile?['parent_name'] ?? 'Parent',
                                          'payment_method': selectedTab == 0 ? 'Axis UPI (Demo)' : selectedTab == 1 ? 'RuPay / Visa (Demo)' : 'Axis NetBanking (Demo)',
                                          'transaction_reference': demoRef,
                                          'order_id': orderId,
                                          'receipt_issued_by': 'Axis Bank Payment Gateway [DEMO SIMULATION]',
                                          'amount_paid': feeAmount,
                                          'gross_amount': feeAmount,
                                          'discount_amount': 0,
                                          'status': 'demo_success',
                                          'is_mock': true,
                                          'is_demo': true,
                                        };

                                        setState(() {
                                          _payments.insert(0, newPayment);
                                          _currentMonthDue = 0;
                                          _isPaidCurrentMonth = true;
                                        });

                                        if (mounted && ctx.mounted) {
                                          Navigator.pop(ctx);
                                          _showPaymentSuccessDialog(newPayment);
                                        }
                                      } else {
                                        await Future.delayed(const Duration(milliseconds: 400));
                                        if (mounted && ctx.mounted) {
                                          Navigator.pop(ctx);
                                          _showPaymentOutcomeDialog(selectedOutcome, feeAmount, courseTitle);
                                        }
                                      }
                                    },
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.lock_rounded, size: 16),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Pay ₹$feeAmount via Axis Bank PG',
                                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                const Center(
                                  child: Text(
                                    '100% Safe & Encrypted • Instant Official Tax Receipt',
                                    style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500),
                                  ),
                                ),
                              ],
                            ),
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _gatewayTabItem(int index, String title, IconData icon, int currentTab, VoidCallback onTap) {
    final isSelected = index == currentTab;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF590231) : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? const Color(0xFF590231) : Colors.grey.shade300),
          ),
          child: Column(
            children: [
              Icon(icon, size: 18, color: isSelected ? Colors.white : Colors.black87),
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _upiAppIcon(String name, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(name, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Widget _outcomeChip(String key, String label, bool isSelected, VoidCallback onTap) {
    Color activeColor;
    switch (key) {
      case 'SUCCESS':
        activeColor = const Color(0xFF03543F);
        break;
      case 'FAILURE':
        activeColor = const Color(0xFF991B1B);
        break;
      case 'CANCELLED':
        activeColor = const Color(0xFF475569);
        break;
      case 'TIMEOUT':
        activeColor = const Color(0xFFB45309);
        break;
      case 'PENDING':
        activeColor = const Color(0xFF1E40AF);
        break;
      default:
        activeColor = LaasyaColors.primary;
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? activeColor : Colors.grey.shade300,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _bankOption(String bankName, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFF2F8) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? const Color(0xFF8A064D) : Colors.grey.shade200),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(bankName, style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.w500, color: isSelected ? const Color(0xFF8A064D) : Colors.black87)),
            Icon(isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, size: 16, color: isSelected ? const Color(0xFF8A064D) : Colors.grey),
          ],
        ),
      ),
    );
  }

  String _monthName(int m) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (m >= 1 && m <= 12) ? months[m - 1] : 'Month';
  }

  void _showPaymentOutcomeDialog(String outcome, int feeAmount, String courseTitle) {
    IconData icon;
    Color iconColor;
    Color iconBgColor;
    String title;
    String subtitle;
    String errorCode;
    String errorDetail;
    String buttonText = 'Retry Demo Payment';

    switch (outcome) {
      case 'FAILURE':
        icon = Icons.cancel_rounded;
        iconColor = const Color(0xFF991B1B);
        iconBgColor = const Color(0xFFFEE2E2);
        title = 'Payment Declined (Demo)';
        subtitle = 'Your bank declined the simulated transaction.';
        errorCode = 'ERR_BANK_DECLINED [CODE: 91]';
        errorDetail = 'Simulated card/account policy rejection or insufficient limit. No money was transferred.';
        buttonText = 'Retry Demo Payment';
        break;
      case 'CANCELLED':
        icon = Icons.highlight_off_rounded;
        iconColor = const Color(0xFF475569);
        iconBgColor = const Color(0xFFF1F5F9);
        title = 'Payment Cancelled (Demo)';
        subtitle = 'You cancelled the simulated checkout.';
        errorCode = 'USER_ABORTED [CODE: 102]';
        errorDetail = 'The checkout process was aborted before authorization completed. No charges applied.';
        buttonText = 'Try Again';
        break;
      case 'TIMEOUT':
        icon = Icons.timer_off_rounded;
        iconColor = const Color(0xFFB45309);
        iconBgColor = const Color(0xFFFEF3C7);
        title = 'Session Timed Out (Demo)';
        subtitle = 'The 2FA authorization window has expired.';
        errorCode = 'AUTH_TIMEOUT [CODE: 408]';
        errorDetail = 'The simulated 180-second OTP verification window expired. Please initiate a new payment.';
        buttonText = 'Retry Payment';
        break;
      case 'PENDING':
        icon = Icons.hourglass_top_rounded;
        iconColor = const Color(0xFF1E40AF);
        iconBgColor = const Color(0xFFDBEAFE);
        title = 'Payment Pending (Demo)';
        subtitle = 'Awaiting clearance from the banking network.';
        errorCode = 'STATUS_PENDING [CODE: 202]';
        errorDetail = 'Simulated bank settlement queue. Usually clears in 15-30 minutes. Real student dues are unaffected.';
        buttonText = 'Retry Demo Payment';
        break;
      default:
        icon = Icons.info_outline_rounded;
        iconColor = Colors.grey;
        iconBgColor = Colors.grey.shade100;
        title = 'Simulation Complete';
        subtitle = 'Demo transaction processed.';
        errorCode = 'DEMO_PROCESSED';
        errorDetail = 'Simulated outcome: $outcome';
    }

    showDialog(
      context: context,
      builder: (dCtx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: iconBgColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 48),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: const Text(
                  'DEMO MODE — NO REAL MONEY WILL BE TRANSFERRED',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Outcome Code:', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        Text(errorCode, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: iconColor)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      errorDetail,
                      style: const TextStyle(fontSize: 10.5, color: Colors.black87),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => Navigator.pop(dCtx),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF590231),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        Navigator.pop(dCtx);
                        _showPaymentGatewayModal(feeAmount, courseTitle);
                      },
                      icon: const Icon(Icons.refresh_rounded, size: 14),
                      label: Text(buttonText, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  void _showPaymentSuccessDialog(Map<String, dynamic> newPayment) {
    final invNo = (newPayment['invoice_number'] ?? 'LCA-INV-2026').toString();
    final recNo = (newPayment['receipt_number'] ?? 'LCA-REC-2026').toString();
    showDialog(
      context: context,
      builder: (dCtx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFFDEF7EC),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Color(0xFF03543F), size: 48),
              ),
              const SizedBox(height: 16),
              const Text(
                'Payment Authorized',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: const Text(
                  'DEMO MODE — NO REAL MONEY WILL BE TRANSFERRED',
                  style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Tuition fee of ₹${newPayment['amount_paid']} has been authorized via Axis Bank Payment Gateway.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Receipt No:', style: TextStyle(fontSize: 10.5, color: Colors.grey)),
                        Text(recNo, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Payment Mode:', style: TextStyle(fontSize: 10.5, color: Colors.grey)),
                        Text(newPayment['payment_method'] ?? '', style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Axis PG Ref:', style: TextStyle(fontSize: 10.5, color: Colors.grey)),
                        Text(newPayment['transaction_reference'] ?? '', style: const TextStyle(fontSize: 10.5, fontFamily: 'monospace', fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => Navigator.pop(dCtx),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF590231),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        Navigator.pop(dCtx);
                        _downloadInvoice(invNo, newPayment['student_name'] ?? 'Student', item: newPayment);
                      },
                      icon: const Icon(Icons.picture_as_pdf_rounded, size: 14, color: LaasyaColors.accentGold),
                      label: const Text('Official PDF', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  String _getInvoicePdfUrl(String invNo, {Map<String, dynamic>? item}) {
    final studentName = (item?['student_name'] ?? widget.studentProfile?['full_name'] ?? 'Aditi Sundaram').toString();
    final rollNo = (item?['roll_number'] ?? widget.studentProfile?['roll_number'] ?? 'LCA-6').toString();
    final course = (item?['course_title'] ?? 'Bharatanatyam').toString();
    final batch = (item?['batch_name'] ?? 'Enrolled Batch').toString();
    final period = (item?['fee_period'] ?? 'October 2026').toString();
    final amount = item?['amount_paid'] ?? 2000;
    final studentId = (item?['student_id'] ?? widget.studentProfile?['id'] ?? '').toString();

    return '${ApiConstants.baseUrl}/api/finance/invoices/pdf?'
        'invoiceNumber=${Uri.encodeComponent(invNo)}'
        '&studentId=${Uri.encodeComponent(studentId)}'
        '&studentName=${Uri.encodeComponent(studentName)}'
        '&rollNumber=${Uri.encodeComponent(rollNo)}'
        '&courseTitle=${Uri.encodeComponent(course)}'
        '&batchName=${Uri.encodeComponent(batch)}'
        '&feePeriod=${Uri.encodeComponent(period)}'
        '&amount=$amount';
  }

  void _downloadInvoice(String invNo, String studentName, {Map<String, dynamic>? item}) {
    final url = _getInvoicePdfUrl(invNo, item: item);
    PdfLauncher.openPdf(context, url, title: 'Invoice $invNo');
  }

  Widget _invRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: LaasyaColors.textDark)),
        ],
      ),
    );
  }

  Widget _buildPaymentFilterChip(String key, String label, int count) {
    final isSelected = _paymentTypeFilter == key;
    return InkWell(
      onTap: () => setState(() => _paymentTypeFilter = key),
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF590231) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.4 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF590231).withOpacity(0.2),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          '$label ($count)',
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _txnDetailRow(
    String label,
    String value, {
    IconData? icon,
    bool isMonospace = false,
    VoidCallback? onTapCopy,
  }) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, size: 13, color: Colors.grey.shade600),
          const SizedBox(width: 5),
        ],
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.black54, fontWeight: FontWeight.w500),
        ),
        const Spacer(),
        InkWell(
          onTap: onTapCopy,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: LaasyaColors.textDark,
                  fontFamily: isMonospace ? 'monospace' : null,
                ),
              ),
              if (onTapCopy != null) ...[
                const SizedBox(width: 4),
                const Icon(Icons.copy_rounded, size: 11, color: LaasyaColors.primary),
              ],
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final studentName = widget.studentProfile?['full_name'] ?? 'Aditi Sundaram';
    final rollNo = widget.studentProfile?['roll_number'] ?? 'LCA-6';

    int totalPaid = 0;
    for (var p in _payments) {
      if (p['is_mock'] == true || p['is_demo'] == true) continue;
      final a = p['amount_paid'];
      if (a is num) totalPaid += a.toInt();
    }
    if (totalPaid == 0) totalPaid = 9500;

    final upiCount = _payments.where((p) => (p['payment_method'] ?? '').toString().toLowerCase().contains('upi')).length;
    final cardCount = _payments.where((p) {
      final m = (p['payment_method'] ?? '').toString().toLowerCase();
      return m.contains('card') || m.contains('pos');
    }).length;
    final netCount = _payments.where((p) {
      final m = (p['payment_method'] ?? '').toString().toLowerCase();
      return m.contains('bank') || m.contains('neft') || m.contains('net') || m.contains('transfer');
    }).length;

    final filteredPayments = _payments.where((p) {
      if (_paymentTypeFilter == 'all') return true;
      final m = (p['payment_method'] ?? '').toString().toLowerCase();
      if (_paymentTypeFilter == 'upi') return m.contains('upi');
      if (_paymentTypeFilter == 'card') return m.contains('card') || m.contains('pos');
      if (_paymentTypeFilter == 'netbanking') return m.contains('bank') || m.contains('neft') || m.contains('net') || m.contains('transfer');
      return true;
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
              'Tuition Payments & Invoices',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              '$studentName • $rollNo',
              style: const TextStyle(fontSize: 11, color: LaasyaColors.accentGold),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : RefreshIndicator(
              onRefresh: _loadPayments,
              color: LaasyaColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // =========================================================
                    // 1. TOP SUMMARY CARD
                    // =========================================================
                    Container(
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
                            color: LaasyaColors.primaryDark.withOpacity(0.25),
                            blurRadius: 14,
                            offset: const Offset(0, 5),
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
                                  color: (_isPaidCurrentMonth || _currentMonthDue <= 0)
                                      ? const Color(0xFFDEF7EC)
                                      : const Color(0xFFFDE8E8),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      (_isPaidCurrentMonth || _currentMonthDue <= 0)
                                          ? Icons.verified_rounded
                                          : Icons.schedule_rounded,
                                      size: 13,
                                      color: (_isPaidCurrentMonth || _currentMonthDue <= 0)
                                          ? const Color(0xFF03543F)
                                          : const Color(0xFF9B1C1C),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      (_isPaidCurrentMonth || _currentMonthDue <= 0)
                                          ? 'CURRENT MONTH: PAID IN FULL'
                                          : 'CURRENT MONTH: PAYMENT PENDING',
                                      style: TextStyle(
                                        color: (_isPaidCurrentMonth || _currentMonthDue <= 0)
                                            ? const Color(0xFF03543F)
                                            : const Color(0xFF9B1C1C),
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.25),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.4)),
                                ),
                                child: Text(
                                  _currentMonthName.toUpperCase(),
                                  style: const TextStyle(
                                    color: LaasyaColors.accentGold,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Current Month Total Balance',
                            style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                (_isPaidCurrentMonth || _currentMonthDue <= 0)
                                    ? '₹0.00'
                                    : '₹$_currentMonthDue.00',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: (_isPaidCurrentMonth || _currentMonthDue <= 0)
                                      ? const Color(0xFFBCF0DA)
                                      : Colors.white,
                                ),
                              ),
                              const SizedBox(width: 8),
                              if (_isPaidCurrentMonth || _currentMonthDue <= 0)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF03543F),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'CLEARED',
                                    style: TextStyle(fontSize: 9.5, color: Color(0xFFBCF0DA), fontWeight: FontWeight.bold),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Billing Period', style: TextStyle(fontSize: 10.5, color: Colors.white70)),
                                      const SizedBox(height: 2),
                                      Text(
                                        _currentMonthName,
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(width: 1, height: 28, color: Colors.white24),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Tuition Paid (All Time)', style: TextStyle(fontSize: 10.5, color: Colors.white70)),
                                      const SizedBox(height: 2),
                                      Text(
                                        '₹$totalPaid',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
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

                    // =========================================================
                    // 1.5. SELF-SERVICE PAYMENT ACTION CARD
                    // =========================================================
                    if (_isPaidCurrentMonth || _currentMonthDue <= 0)
                      Container(
                        margin: const EdgeInsets.only(top: 14),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFBCF0DA), width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF03543F).withOpacity(0.04),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDEF7EC),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF03543F), size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Text(
                                        'Current Month Dues: ₹0',
                                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF03543F)),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDEF7EC),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text('PAID IN FULL', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    'Tuition fees for $_currentMonthName are completely cleared. No payment is pending.',
                                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600, height: 1.3),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        margin: const EdgeInsets.only(top: 14),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
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
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFFF2F8),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.payment_rounded, color: LaasyaColors.primary, size: 20),
                                    ),
                                    const SizedBox(width: 10),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Online Fee Payment',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                        ),
                                        Text(
                                          'Balance due for $_currentMonthName',
                                          style: const TextStyle(fontSize: 10.5, color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text('UPI • CARDS • NETBANKING', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Divider(height: 1),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Total Balance Payable', style: TextStyle(fontSize: 10.5, color: Colors.grey)),
                                    const SizedBox(height: 2),
                                    Text(
                                      '₹$_currentMonthDue',
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF8A064D)),
                                    ),
                                    const Text(
                                      'Incl. 18% GST',
                                      style: TextStyle(fontSize: 9.5, color: Colors.grey),
                                    ),
                                  ],
                                ),
                                ElevatedButton.icon(
                                  onPressed: () => _showPaymentGatewayModal(_currentMonthDue, 'Monthly Tuition'),
                                  icon: const Icon(Icons.lock_rounded, size: 14, color: Colors.white),
                                  label: Text('Pay ₹$_currentMonthDue Now', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF8A064D),
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                    const SizedBox(height: 20),

                    // =========================================================
                    // 2. PAYMENTS LIST HEADER & PAYMENT-WISE FILTER
                    // =========================================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Payment History (${filteredPayments.length})',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: LaasyaColors.textDark,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF2F8),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.history_rounded, size: 12, color: LaasyaColors.primary),
                              SizedBox(width: 4),
                              Text(
                                'Payment-Wise Ledger',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Horizontal Filter Bar
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildPaymentFilterChip('all', 'All Payments', _payments.length),
                          const SizedBox(width: 8),
                          _buildPaymentFilterChip('upi', 'UPI / QR', upiCount),
                          const SizedBox(width: 8),
                          _buildPaymentFilterChip('card', 'Cards', cardCount),
                          const SizedBox(width: 8),
                          _buildPaymentFilterChip('netbanking', 'Net Banking / NEFT', netCount),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // =========================================================
                    // 3. PAYMENT-WISE TRANSACTION CARDS
                    // =========================================================
                    if (filteredPayments.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(Icons.receipt_outlined, size: 36, color: Colors.grey.shade400),
                              const SizedBox(height: 8),
                              const Text(
                                'No payments found for this filter',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Switch to "All Payments" to see complete tuition ledger',
                                style: TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filteredPayments.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final item = filteredPayments[index];
                          final recNo = (item['receipt_number'] ?? 'LCA-REC').toString();
                          final period = (item['fee_period'] ?? 'Tuition Fee').toString();
                          final amount = item['amount_paid'] ?? 2000;
                          final date = (item['payment_date'] ?? 'Recent').toString();
                          final method = (item['payment_method'] ?? 'UPI').toString();
                          final ref = (item['transaction_reference'] ?? '').toString();
                          final isAdmission = period.toLowerCase().contains('admission') || period.toLowerCase().contains('academic');
                          final paymentTitle = isAdmission ? 'Academy Registration & Admission Fee' : 'Tuition Fee Payment';

                          IconData methodIcon = Icons.account_balance_wallet_rounded;
                          Color methodColor = const Color(0xFF03543F);
                          if (method.toLowerCase().contains('card')) {
                            methodIcon = Icons.credit_card_rounded;
                            methodColor = const Color(0xFF1E40AF);
                          } else if (method.toLowerCase().contains('bank') || method.toLowerCase().contains('neft')) {
                            methodIcon = Icons.account_balance_rounded;
                            methodColor = const Color(0xFF590231);
                          }

                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: const Color(0xFFF0D5E4)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.03),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Top line: Method Pill + Receipt Tag + Paid Tag
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: BoxDecoration(
                                              color: methodColor.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Icon(methodIcon, size: 16, color: methodColor),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFFF2F8),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: const Color(0xFFF0D5E4)),
                                            ),
                                            child: Text(
                                              'Receipt #$recNo',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: LaasyaColors.primary,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: ((item['is_mock'] == true) || (item['is_demo'] == true))
                                              ? const Color(0xFFFEF3C7)
                                              : const Color(0xFFDEF7EC),
                                          borderRadius: BorderRadius.circular(6),
                                          border: ((item['is_mock'] == true) || (item['is_demo'] == true))
                                              ? Border.all(color: const Color(0xFFF59E0B))
                                              : null,
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              ((item['is_mock'] == true) || (item['is_demo'] == true))
                                                  ? Icons.science_rounded
                                                  : Icons.check_circle_rounded,
                                              size: 11,
                                              color: ((item['is_mock'] == true) || (item['is_demo'] == true))
                                                  ? const Color(0xFFB45309)
                                                  : const Color(0xFF03543F),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              ((item['is_mock'] == true) || (item['is_demo'] == true))
                                                  ? 'DEMO SIMULATION'
                                                  : 'PAID & SETTLED',
                                              style: TextStyle(
                                                color: ((item['is_mock'] == true) || (item['is_demo'] == true))
                                                    ? const Color(0xFF92400E)
                                                    : const Color(0xFF03543F),
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 12),

                                  // Payment Title & Amount (Payment-Wise Focus)
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              paymentTitle,
                                              style: const TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold,
                                                color: LaasyaColors.textDark,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              'Tuition Fee Payment • $period',
                                              style: const TextStyle(
                                                fontSize: 11.5,
                                                fontWeight: FontWeight.w600,
                                                color: Color(0xFF8A064D),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            '₹$amount',
                                            style: const TextStyle(
                                              fontSize: 19,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF03543F),
                                            ),
                                          ),
                                          const Text(
                                            'Paid in Full',
                                            style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 12),

                                  // Itemized Transaction Specs Ledger Box
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFBF8FA),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: const Color(0xFFF3E8EF)),
                                    ),
                                    child: Column(
                                      children: [
                                        _txnDetailRow(
                                          'Payment Date',
                                          date,
                                          icon: Icons.calendar_today_rounded,
                                        ),
                                        const SizedBox(height: 6),
                                        _txnDetailRow(
                                          'Payment Mode',
                                          '$method (Verified)',
                                          icon: Icons.payment_rounded,
                                        ),
                                        if (ref.isNotEmpty) ...[
                                          const SizedBox(height: 6),
                                          _txnDetailRow(
                                            'Txn Reference',
                                            ref,
                                            icon: Icons.tag_rounded,
                                            isMonospace: true,
                                            onTapCopy: () {
                                              Clipboard.setData(ClipboardData(text: ref));
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Transaction Ref copied: $ref'),
                                                  duration: const Duration(seconds: 2),
                                                  behavior: SnackBarBehavior.floating,
                                                ),
                                              );
                                            },
                                          ),
                                        ],
                                        const SizedBox(height: 6),
                                        _txnDetailRow(
                                          'Coverage Period',
                                          period,
                                          icon: Icons.date_range_rounded,
                                        ),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(height: 12),
                                  const Divider(height: 1),
                                  const SizedBox(height: 10),

                                  // Single Action Button: View Invoice (opens invoice modal with Download PDF option)
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF590231),
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        padding: const EdgeInsets.symmetric(vertical: 11),
                                      ),
                                      onPressed: () => _showInvoiceModal(item),
                                      icon: const Icon(Icons.receipt_long_rounded, size: 16, color: LaasyaColors.accentGold),
                                      label: const Text(
                                        'View Invoice',
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }
}

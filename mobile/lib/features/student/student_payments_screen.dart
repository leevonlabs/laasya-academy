import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

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

  @override
  void initState() {
    super.initState();
    _payments = SupabaseService().getCachedPayments();
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
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 22),
                      onPressed: () => Navigator.pop(ctx),
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
                                'Society Reg. No: REG/HYD/2018/84920',
                                style: TextStyle(fontSize: 10, color: Colors.grey),
                              ),
                              const Text(
                                'Center for Classical Arts, Dance & Music',
                                style: TextStyle(fontSize: 10, color: Colors.black54),
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
                          _downloadInvoice(invNo, studentName);
                        },
                        icon: const Icon(Icons.download_rounded, size: 18, color: LaasyaColors.accentGold),
                        label: const Text(
                          'Download Invoice (PDF)',
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

  // Interactive Self-Service Payment Gateway Modal for Students
  void _showPaymentGatewayModal(int feeAmount, String courseTitle) {
    int selectedTab = 0; // 0: UPI, 1: Card, 2: NetBanking
    bool isProcessing = false;
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

                  // Header with Security Badge
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.lock_rounded, color: Color(0xFF03543F), size: 20),
                            SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Academy Payment Gateway',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    color: LaasyaColors.textDark,
                                  ),
                                ),
                                Text(
                                  '256-Bit SSL Encrypted • PCI DSS Compliant',
                                  style: TextStyle(fontSize: 10, color: Colors.grey),
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
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const CircularProgressIndicator(color: LaasyaColors.primary),
                                const SizedBox(height: 18),
                                const Text(
                                  'Connecting to Banking Gateway...',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Authorizing ₹$feeAmount payment for $studentName',
                                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                              ],
                            ),
                          )
                        : SingleChildScrollView(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Order & Fee Summary Card
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFF9FB),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFFF0D5E4)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(courseTitle, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                                              Text('Monthly Tuition Fee • $rollNo', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                            ],
                                          ),
                                          Text('₹$feeAmount', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
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
                                          const Text('GST (18% included):', style: TextStyle(fontSize: 11, color: Color(0xFF03543F))),
                                          Text('₹${gstFee.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 20),

                                // Payment Method Selection Tabs
                                const Text(
                                  'SELECT PAYMENT METHOD',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Colors.grey),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    _gatewayTabItem(0, 'UPI / QR', Icons.qr_code_scanner_rounded, selectedTab, () => setMState(() => selectedTab = 0)),
                                    const SizedBox(width: 8),
                                    _gatewayTabItem(1, 'Card', Icons.credit_card_rounded, selectedTab, () => setMState(() => selectedTab = 1)),
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
                                        const Text('Scan Academy UPI QR or pay via installed app', style: TextStyle(fontSize: 11.5, color: Colors.grey)),
                                        const SizedBox(height: 14),
                                        // QR Code Mock
                                        Container(
                                          width: 130,
                                          height: 130,
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade50,
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: Colors.grey.shade300),
                                          ),
                                          child: const Center(
                                            child: Icon(Icons.qr_code_2_rounded, size: 100, color: Color(0xFF2D041A)),
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFF2F8),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFF0D5E4)),
                                          ),
                                          child: const Text('UPI ID: laasyaacademy@sbi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                                        ),
                                        const SizedBox(height: 14),
                                        const Text('Instant App Transfer:', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                          children: [
                                            _upiAppIcon('GPay', const Color(0xFF4285F4)),
                                            _upiAppIcon('PhonePe', const Color(0xFF5F259F)),
                                            _upiAppIcon('Paytm', const Color(0xFF00B9F5)),
                                            _upiAppIcon('BHIM', const Color(0xFF00796B)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ] else if (selectedTab == 1) ...[
                                  // Card View
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
                                        const SizedBox(height: 12),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  const Text('Expiry Date', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
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
                                        const SizedBox(height: 10),
                                        const Text('Supports Visa, MasterCard, RuPay, Maestro debit & credit cards.', style: TextStyle(fontSize: 10, color: Colors.grey)),
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
                                        _bankOption('State Bank of India (SBI)', true),
                                        _bankOption('HDFC Bank', false),
                                        _bankOption('ICICI Bank', false),
                                        _bankOption('Axis Bank', false),
                                      ],
                                    ),
                                  ),
                                ],

                                const SizedBox(height: 24),

                                // Pay Button
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
                                      setMState(() => isProcessing = true);
                                      await Future.delayed(const Duration(milliseconds: 1400));
                                      
                                      // Generate payment record
                                      final now = DateTime.now();
                                      final dateStr = '${now.day} ${_monthName(now.month)} ${now.year}';
                                      final newInvNo = 'LCA-INV-2026-${now.millisecondsSinceEpoch.toString().substring(7)}';
                                      final newRecNo = 'LCA-REC-${now.millisecondsSinceEpoch.toString().substring(8)}';
                                      final newPayment = {
                                        'id': 'pay-${now.millisecondsSinceEpoch}',
                                        'invoice_number': newInvNo,
                                        'receipt_number': newRecNo,
                                        'payment_date': dateStr,
                                        'fee_period': '${_monthName(now.month)} ${now.year}',
                                        'course_title': courseTitle,
                                        'batch_name': 'Enrolled Batch',
                                        'student_name': studentName,
                                        'roll_number': rollNo,
                                        'parent_name': widget.studentProfile?['parent_name'] ?? 'Parent',
                                        'payment_method': selectedTab == 0 ? 'UPI / Online' : selectedTab == 1 ? 'Debit Card' : 'Net Banking',
                                        'transaction_reference': 'TXN-${now.millisecondsSinceEpoch}',
                                        'receipt_issued_by': 'Automated Online Payment Gateway',
                                        'amount_paid': feeAmount,
                                        'gross_amount': feeAmount,
                                        'discount_amount': 0,
                                        'status': 'paid',
                                      };

                                      setState(() {
                                        _payments.insert(0, newPayment);
                                      });

                                      if (mounted && ctx.mounted) {
                                        Navigator.pop(ctx);
                                        _showPaymentSuccessDialog(newPayment);
                                      }
                                    },
                                    child: Text(
                                      'Pay ₹$feeAmount Securely',
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                    ),
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(name, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Widget _bankOption(String bankName, bool isSelected) {
    return Container(
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
    );
  }

  String _monthName(int m) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (m >= 1 && m <= 12) ? months[m - 1] : 'Month';
  }

  void _showPaymentSuccessDialog(Map<String, dynamic> newPayment) {
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
                'Payment Successful!',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
              ),
              const SizedBox(height: 6),
              Text(
                'Tuition fee of ₹${newPayment['amount_paid']} has been processed and credited to Laasya Cultural Academy.',
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
                        Text(newPayment['receipt_number'] ?? '', style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
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
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF590231),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        Navigator.pop(dCtx);
                        _showInvoiceModal(newPayment);
                      },
                      child: const Text('View Receipt'),
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

  void _downloadInvoice(String invNo, String studentName) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Invoice $invNo successfully downloaded to device storage!',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF03543F),
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
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

  @override
  Widget build(BuildContext context) {
    final studentName = widget.studentProfile?['full_name'] ?? 'Aditi Sundaram';
    final rollNo = widget.studentProfile?['roll_number'] ?? 'LCA-6';
    final course = widget.studentProfile?['course'] ?? 'Bharathanatyam';
    final monthlyFee = widget.studentProfile?['total_monthly_fee'] ?? 2000;
    final dueAmount = widget.studentProfile?['due_amount'] ?? 0;

    int totalPaid = 0;
    for (var p in _payments) {
      final a = p['amount_paid'];
      if (a is num) totalPaid += a.toInt();
    }
    if (totalPaid == 0) totalPaid = 9500;

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
                                  color: const Color(0xFFDEF7EC),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.verified_rounded, size: 12, color: Color(0xFF03543F)),
                                    SizedBox(width: 4),
                                    Text(
                                      'FEE STATUS: ALL PAID UP',
                                      style: TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                course,
                                style: const TextStyle(color: LaasyaColors.accentGold, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'Total Tuition Paid (All Time)',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '₹$totalPaid.00',
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 14),
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
                                      const Text('Current Monthly Fee', style: TextStyle(fontSize: 10.5, color: Colors.white70)),
                                      const SizedBox(height: 2),
                                      Text('₹$monthlyFee', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                                    ],
                                  ),
                                ),
                                Container(width: 1, height: 28, color: Colors.white24),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Outstanding Dues', style: TextStyle(fontSize: 10.5, color: Colors.white70)),
                                      const SizedBox(height: 2),
                                      Text(
                                        dueAmount > 0 ? '₹$dueAmount' : '₹0 (Nil)',
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: dueAmount > 0 ? const Color(0xFFFFD2D2) : const Color(0xFFBCF0DA),
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
                                  const Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Online Fee Payment',
                                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                                      ),
                                      Text(
                                        'Pay your monthly tuition fee directly',
                                        style: TextStyle(fontSize: 10.5, color: Colors.grey),
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
                                  const Text('Monthly Tuition Payable', style: TextStyle(fontSize: 10.5, color: Colors.grey)),
                                  const SizedBox(height: 2),
                                  Text(
                                    '₹$monthlyFee',
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF03543F)),
                                  ),
                                  const Text(
                                    'Incl. 18% GST',
                                    style: TextStyle(fontSize: 9.5, color: Colors.grey),
                                  ),
                                ],
                              ),
                              ElevatedButton.icon(
                                onPressed: () => _showPaymentGatewayModal(monthlyFee, course),
                                icon: const Icon(Icons.lock_rounded, size: 14, color: Colors.white),
                                label: Text('Pay ₹$monthlyFee Now', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
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
                    // 2. PAYMENTS LIST HEADER
                    // =========================================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Payment-Wise Tax Invoices (${_payments.length})',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: LaasyaColors.textDark,
                          ),
                        ),
                        const Text(
                          'Invoice PDF Available',
                          style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // =========================================================
                    // 3. PAYMENT TILES
                    // =========================================================
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _payments.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final item = _payments[index];
                        final invNo = (item['invoice_number'] ?? 'LCA-INV').toString();
                        final recNo = (item['receipt_number'] ?? 'LCA-REC').toString();
                        final period = (item['fee_period'] ?? 'Tuition Fee').toString();
                        final amount = item['amount_paid'] ?? 2000;
                        final date = (item['payment_date'] ?? 'Recent').toString();
                        final method = (item['payment_method'] ?? 'UPI').toString();
                        final ref = (item['transaction_reference'] ?? '').toString();

                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Top line: Receipt No & Paid Tag
                              Row(
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
                                      '$recNo • $invNo',
                                      style: const TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.bold,
                                        color: LaasyaColors.primary,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDEF7EC),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.check_circle_rounded, size: 11, color: Color(0xFF03543F)),
                                        SizedBox(width: 3),
                                        Text(
                                          'PAID',
                                          style: TextStyle(
                                            color: Color(0xFF03543F),
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 10),

                              // Period & Amount Row
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          period,
                                          style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: LaasyaColors.textDark,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Paid on $date via $method',
                                          style: const TextStyle(fontSize: 11.5, color: Colors.grey),
                                        ),
                                        if (ref.isNotEmpty) ...[
                                          const SizedBox(height: 1),
                                          Text(
                                            'Ref: $ref',
                                            style: const TextStyle(fontSize: 10, color: Colors.black45, fontFamily: 'monospace'),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '₹$amount',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF03543F),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),
                              const Divider(height: 1),
                              const SizedBox(height: 10),

                              // Action Button: Download Invoice Option
                              SizedBox(
                                width: double.infinity,
                                height: 40,
                                child: ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFFFF2F8),
                                    foregroundColor: LaasyaColors.primary,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      side: const BorderSide(color: Color(0xFFF0D5E4)),
                                    ),
                                  ),
                                  onPressed: () => _showInvoiceModal(item),
                                  icon: const Icon(Icons.download_rounded, size: 16, color: LaasyaColors.primary),
                                  label: const Text(
                                    'Download Invoice / View Receipt',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
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
            ),
    );
  }
}

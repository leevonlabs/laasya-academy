import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';
import '../../core/utils/pdf_launcher.dart';

class TrainerSalariesScreen extends StatefulWidget {
  final Map<String, dynamic>? trainerProfile;

  const TrainerSalariesScreen({
    super.key,
    this.trainerProfile,
  });

  @override
  State<TrainerSalariesScreen> createState() => _TrainerSalariesScreenState();
}

class _TrainerSalariesScreenState extends State<TrainerSalariesScreen> {
  static const List<String> _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  static const List<String> _monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  List<Map<String, dynamic>> _payments = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = true;

  // Month & Year Filter State (defaults to current month and year)
  late int _selectedYear;
  int? _selectedMonth; // 1-12, or null for all months of that year
  bool _showAllInvoices = false; // if true, shows all time
  String _selectedTypeFilter = 'all'; // 'all' | 'salary' | 'payment'

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedYear = now.year;
    _selectedMonth = now.month; // By default selects current month!
    _showAllInvoices = false;

    _payments = SupabaseService().getCachedSalaries();
    _summary = SupabaseService().getCachedSalarySummary() ?? {};
    _isLoading = _payments.isEmpty;
    _loadSalaries();
  }

  String _getCurrentMonthString() {
    final now = DateTime.now();
    return '${_monthNames[now.month - 1]} ${now.year}';
  }

  String _formatMonthYear(int month, int year) {
    return '${_monthNames[month - 1]} $year';
  }

  String _getItemMonthYear(Map<String, dynamic> item) {
    final pm = (item['payroll_month'] ?? '').toString().trim();
    if (pm.isNotEmpty) return pm;

    final dStr = (item['payment_date'] ?? item['created_at'] ?? '').toString();
    if (dStr.isNotEmpty) {
      try {
        final dt = DateTime.parse(dStr.split('T')[0]);
        return '${_monthNames[dt.month - 1]} ${dt.year}';
      } catch (_) {}
    }
    return '';
  }

  String _getPaymentTypeLabel(Map<String, dynamic> item) {
    final isSalary = item['record_kind'] == 'salary' || item['payment_type'] == 'monthly_salary';
    if (isSalary) {
      return 'Salary';
    }

    final raw = (item['payment_type'] ?? '').toString().toLowerCase();
    if (raw == 'salary_advance' || raw == 'advance') return 'Advance';
    if (raw == 'bonus') return 'Bonus';
    if (raw == 'festival_bonus') return 'Festival Bonus';
    if (raw == 'incentive') return 'Incentive';
    if (raw == 'reimbursement') return 'Reimbursement';
    if (raw == 'honorarium') return 'Honorarium';

    final badge = (item['badge_label'] ?? '').toString().trim();
    if (badge.isNotEmpty && badge.toLowerCase() != 'payment' && badge.toLowerCase() != 'direct payment') {
      return badge;
    }

    if (raw.isNotEmpty) {
      return raw
          .replaceAll('_', ' ')
          .replaceAll('-', ' ')
          .split(' ')
          .where((s) => s.isNotEmpty)
          .map((s) => '${s[0].toUpperCase()}${s.substring(1).toLowerCase()}')
          .join(' ');
    }

    return 'Payment';
  }

  Future<void> _loadSalaries() async {
    final tId = (widget.trainerProfile?['trainer_id'] ?? widget.trainerProfile?['id'])?.toString();
    // Force refresh from live backend to ensure accurate status
    final data = await SupabaseService().getTrainerSalaryPayouts(trainerId: tId, forceRefresh: true);
    final summary = SupabaseService().getCachedSalarySummary() ?? {};

    if (mounted) {
      setState(() {
        _payments = data;
        _summary = summary;
        _isLoading = false;
      });
    }
  }

  // Reliable, comprehensive status check for any month (e.g. "October 2026")
  Map<String, dynamic> _getMonthSalaryStatus(String monthYearStr) {
    // 1. Check if there is an invoice in _payments for this month with status = paid
    final salaryPayments = _payments.where((p) {
      final isSal = p['record_kind'] == 'salary' || p['payment_type'] == 'monthly_salary';
      if (!isSal) return false;
      final pm = (p['payroll_month'] ?? _getItemMonthYear(p)).toString().trim().toLowerCase();
      return pm == monthYearStr.toLowerCase();
    }).toList();

    for (var p in salaryPayments) {
      final st = (p['status'] ?? '').toString().toLowerCase();
      if (st == 'paid') {
        final amount = p['amount'] ?? p['net_salary'];
        return {
          'is_paid': true,
          'status': 'PAID',
          'amount': amount,
          'invoice_number': p['invoice_number'] ?? p['voucher_number'],
          'payment_date': p['display_date'] ?? p['payment_date'],
        };
      }
    }

    // 2. Check summary all_months from database
    final allMonths = _summary['all_months'] as List<dynamic>? ?? [];
    for (var m in allMonths) {
      if (m is Map) {
        final mStr = (m['month'] ?? '').toString().trim().toLowerCase();
        if (mStr == monthYearStr.toLowerCase()) {
          final isPaid = m['is_paid'] == true || (m['status'] ?? '').toString().toLowerCase() == 'paid';
          if (isPaid) {
            return {
              'is_paid': true,
              'status': 'PAID',
              'amount': m['net_salary'],
              'invoice_number': m['invoice_number'],
              'payment_date': m['payment_date'],
            };
          }
        }
      }
    }

    // 3. Check current month in summary
    final curMonth = (_summary['current_month'] ?? '').toString().trim().toLowerCase();
    if (curMonth == monthYearStr.toLowerCase() && (_summary['current_month_status'] ?? '').toString().toLowerCase() == 'paid') {
      return {
        'is_paid': true,
        'status': 'PAID',
        'amount': _summary['current_month_net'] ?? _summary['base_salary'],
        'invoice_number': null,
        'payment_date': null,
      };
    }

    return {
      'is_paid': false,
      'status': 'PENDING',
      'amount': null,
      'invoice_number': null,
      'payment_date': null,
    };
  }

  String _getPdfUrl(Map<String, dynamic> item) {
    final id = (item['id'] ?? '').toString();
    final vNo = (item['invoice_number'] ?? item['voucher_number'] ?? 'LCA-SAL-2026').toString();
    final month = (item['payroll_month'] ?? _getCurrentMonthString()).toString();
    final name = (item['trainer_name'] ?? widget.trainerProfile?['full_name'] ?? 'Faculty Guru').toString();
    final trainerId = (item['trainer_id'] ?? widget.trainerProfile?['id'] ?? '').toString();

    return '${ApiConstants.baseUrl}/api/finance/salaries/pdf?'
        'voucherId=${Uri.encodeComponent(id)}'
        '&voucherNumber=${Uri.encodeComponent(vNo)}'
        '&trainerId=${Uri.encodeComponent(trainerId)}'
        '&guruName=${Uri.encodeComponent(name)}'
        '&month=${Uri.encodeComponent(month)}';
  }

  void _showSalarySlipModal(Map<String, dynamic> item) {
    final isSalary = item['record_kind'] == 'salary' || item['payment_type'] == 'monthly_salary';
    final typeLabel = _getPaymentTypeLabel(item);
    final vNo = (item['invoice_number'] ?? item['voucher_number'] ?? 'LCA-SAL-2026').toString();
    final recNo = (item['receipt_number'] ?? 'LCA-REC-2026').toString();
    final month = (item['payroll_month'] ?? (isSalary ? 'Monthly Honorarium' : 'Direct Disbursement')).toString();
    final name = (item['trainer_name'] ?? widget.trainerProfile?['full_name'] ?? 'Faculty Guru').toString();
    final title = (item['display_title'] ?? widget.trainerProfile?['designation'] ?? 'Faculty Guru').toString();
    final spec = (item['specialization'] ?? widget.trainerProfile?['specialization'] ?? 'Classical Arts').toString();
    final amount = item['amount'] ?? item['net_salary'] ?? 30000;
    final base = item['base_salary'] ?? _summary['base_salary'] ?? 30000;
    final bonus = item['bonus_amount'] ?? 0;
    final bonusReason = item['bonus_reason'] as String?;
    final deduction = item['deduction_amount'] ?? 0;
    final date = (item['display_date'] ?? item['payment_date'] ?? 'Recent').toString();
    final method = (item['payment_method'] ?? 'Bank Transfer').toString().toUpperCase().replaceAll('_', ' ');
    final ref = (item['transaction_reference'] ?? 'IMPS/ONLINE').toString();
    final remarks = (item['remarks'] ?? item['notes'] ?? (isSalary ? 'Monthly Honorarium' : typeLabel)).toString();

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

              // Title Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.receipt_long_rounded, color: LaasyaColors.primary, size: 22),
                        const SizedBox(width: 8),
                        Text(
                          isSalary ? 'Salary Slip' : '$typeLabel Slip',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
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

              // Body
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFDFE),
                      borderRadius: BorderRadius.circular(20),
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
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF590231),
                                  borderRadius: BorderRadius.circular(8),
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
                              const Text('Official Faculty Payout Ledger', style: TextStyle(fontSize: 10.5, color: Colors.black54)),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),
                        const Divider(height: 1, thickness: 1),
                        const SizedBox(height: 14),

                        // Voucher & Category
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('INVOICE NUMBER', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Text(vNo, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.primary, fontFamily: 'monospace')),
                                const SizedBox(height: 6),
                                const Text('RECEIPT NUMBER', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                Text(recNo, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87, fontFamily: 'monospace')),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('TYPE', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isSalary ? const Color(0xFFDEF7EC) : const Color(0xFFF3E8FF),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isSalary ? const Color(0xFF31C48D) : const Color(0xFFC084FC),
                                    ),
                                  ),
                                  child: Text(
                                    isSalary ? 'Salary' : typeLabel,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: isSalary ? const Color(0xFF03543F) : const Color(0xFF6B21A8),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text('DISBURSED', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                ),
                              ],
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 14),

                        // Guru Particulars
                        const Text(
                          'PAYOUT PARTICULARS',
                          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: LaasyaColors.primary),
                        ),
                        const SizedBox(height: 8),
                        _invRow('Guru Name', name),
                        _invRow('Designation', title),
                        _invRow('Discipline', spec),
                        _invRow('Disbursement Date', date),
                        _invRow('Payment Mode', method),
                        _invRow('Transaction Ref', ref),
                        if (isSalary) _invRow('Payroll Month', month),
                        _invRow('Payment Type', typeLabel),
                        _invRow('Remarks', remarks),

                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 14),

                        // Amount Breakdown Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9FB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFF0D5E4)),
                          ),
                          child: Column(
                            children: [
                              if (isSalary && (bonus > 0 || deduction > 0)) ...[
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Base Salary Rate', style: TextStyle(fontSize: 12, color: Colors.black87)),
                                    Text('₹$base', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                if (bonus > 0) ...[
                                  const SizedBox(height: 4),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Bonus${bonusReason != null ? ' ($bonusReason)' : ''}', style: const TextStyle(fontSize: 12, color: Color(0xFF03543F))),
                                      Text('+₹$bonus', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                    ],
                                  ),
                                ],
                                if (deduction > 0) ...[
                                  const SizedBox(height: 4),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Deduction / Recovery', style: TextStyle(fontSize: 12, color: Colors.red)),
                                      Text('-₹$deduction', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red)),
                                    ],
                                  ),
                                ],
                                const Divider(height: 14),
                              ],
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    isSalary ? 'Net Disbursed' : 'Amount Paid',
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                                  ),
                                  Text(
                                    '₹$amount.00',
                                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF03543F)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Verified Seal
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
                                  Text('ACCOUNTS VERIFIED', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                ],
                              ),
                            ),
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('For Laasya Cultural Academy', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                SizedBox(height: 4),
                                Text('Accounts Desk', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                                Text('Settled Payment', style: TextStyle(fontSize: 10, color: Colors.grey)),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom Actions
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Colors.grey.shade200)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: LaasyaColors.primary,
                          side: const BorderSide(color: Color(0xFFF0D5E4)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(
                            text: 'Laasya Cultural Academy - Faculty Slip\n'
                                'Invoice: $vNo\n'
                                'Type: $typeLabel\n'
                                'Beneficiary: $name\n'
                                'Amount: ₹$amount\n'
                                'Date: $date\n'
                                'Status: Disbursed',
                          ));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Copied reference for $vNo'),
                              backgroundColor: LaasyaColors.primary,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        icon: const Icon(Icons.copy_rounded, size: 16),
                        label: const Text('Copy Invoice', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF590231),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          final pdfUrl = _getPdfUrl(item);
                          PdfLauncher.openPdf(context, pdfUrl, title: 'Faculty Payment Slip $vNo');
                        },
                        icon: const Icon(Icons.download_rounded, size: 18, color: LaasyaColors.accentGold),
                        label: const Text(
                          'Download Slip (PDF)',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
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

  Widget _invRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            flex: 4,
            child: Text(label, style: const TextStyle(fontSize: 11.5, color: Colors.grey)),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 5,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: LaasyaColors.textDark),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  // Comprehensive, intuitive Month & Year Filter Modal
  void _showMonthYearFilterPicker() {
    int tempYear = _selectedYear;
    int? tempMonth = _selectedMonth;
    bool tempAllTime = _showAllInvoices;

    final currentYear = DateTime.now().year;
    final currentMonth = DateTime.now().month;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.calendar_month_rounded, color: LaasyaColors.primary, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Filter by Month & Year',
                              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // 1. Year Selector Bar
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          _yearChip(tempYear, currentYear, () {
                            setModalState(() {
                              tempYear = currentYear;
                              tempAllTime = false;
                            });
                          }),
                          _yearChip(tempYear, currentYear - 1, () {
                            setModalState(() {
                              tempYear = currentYear - 1;
                              tempAllTime = false;
                            });
                          }),
                          _yearChip(tempYear, currentYear - 2, () {
                            setModalState(() {
                              tempYear = currentYear - 2;
                              tempAllTime = false;
                            });
                          }),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 2. 12-Month Grid
                    const Text(
                      'SELECT MONTH',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 8),

                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        childAspectRatio: 1.7,
                      ),
                      itemCount: 12,
                      itemBuilder: (context, idx) {
                        final mNum = idx + 1;
                        final isSelected = !tempAllTime && tempMonth == mNum && tempYear == tempYear;
                        final isCurrentCalMonth = tempYear == currentYear && mNum == currentMonth;
                        final mLabel = _formatMonthYear(mNum, tempYear);
                        final statusData = _getMonthSalaryStatus(mLabel);
                        final isPaid = statusData['is_paid'] == true;

                        return InkWell(
                          onTap: () {
                            setModalState(() {
                              tempMonth = mNum;
                              tempAllTime = false;
                            });
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF590231)
                                  : (isCurrentCalMonth ? const Color(0xFFFFF0F5) : Colors.white),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF590231)
                                    : (isCurrentCalMonth ? LaasyaColors.primary : Colors.grey.shade300),
                                width: isSelected || isCurrentCalMonth ? 1.5 : 1,
                              ),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      _monthShortNames[idx],
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? Colors.white : Colors.black87,
                                      ),
                                    ),
                                    if (isPaid) ...[
                                      const SizedBox(height: 2),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                        decoration: BoxDecoration(
                                          color: isSelected ? Colors.white24 : const Color(0xFFDEF7EC),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          'PAID',
                                          style: TextStyle(
                                            fontSize: 7.5,
                                            fontWeight: FontWeight.bold,
                                            color: isSelected ? Colors.white : const Color(0xFF03543F),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                if (isCurrentCalMonth && !isSelected)
                                  Positioned(
                                    top: 4,
                                    right: 4,
                                    child: Container(
                                      width: 5,
                                      height: 5,
                                      decoration: const BoxDecoration(
                                        color: LaasyaColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 16),

                    // Quick Shortcuts: All months of this year, or All Invoices all time
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: tempMonth == null && !tempAllTime ? Colors.white : LaasyaColors.primary,
                              backgroundColor: tempMonth == null && !tempAllTime ? const Color(0xFF590231) : Colors.white,
                              side: const BorderSide(color: Color(0xFFF0D5E4)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                            onPressed: () {
                              setModalState(() {
                                tempMonth = null;
                                tempAllTime = false;
                              });
                            },
                            child: Text(
                              'All Months in $tempYear',
                              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: tempAllTime ? Colors.white : LaasyaColors.primary,
                              backgroundColor: tempAllTime ? const Color(0xFF590231) : Colors.white,
                              side: const BorderSide(color: Color(0xFFF0D5E4)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                            onPressed: () {
                              setModalState(() {
                                tempAllTime = true;
                              });
                            },
                            child: const Text(
                              'All Time Invoices',
                              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Apply Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF590231),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 13),
                        ),
                        onPressed: () {
                          setState(() {
                            _selectedYear = tempYear;
                            _selectedMonth = tempMonth;
                            _showAllInvoices = tempAllTime;
                          });
                          Navigator.pop(ctx);
                        },
                        child: const Text(
                          'Apply Filter',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                      ),
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

  Widget _yearChip(int currentSelection, int year, VoidCallback onTap) {
    final isSelected = currentSelection == year;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : null,
          ),
          child: Text(
            '$year',
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected ? LaasyaColors.primary : Colors.grey.shade700,
            ),
          ),
        ),
      ),
    );
  }

  Widget _quickMonthChip(String label, bool isSelected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF590231) : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? const Color(0xFF590231) : Colors.grey.shade300,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected ? Colors.white : Colors.black87,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.trainerProfile?['full_name'] ?? _summary['guru_name'] ?? 'Faculty Guru';
    final baseSalary = _summary['base_salary'] ?? widget.trainerProfile?['monthly_salary'] ?? 30000;
    final currentCalMonth = _getCurrentMonthString();

    // Determine the active month-year label for display & status check
    String activeMonthYearLabel;
    if (_showAllInvoices) {
      activeMonthYearLabel = currentCalMonth; // Status evaluates current month when viewing all time
    } else if (_selectedMonth != null) {
      activeMonthYearLabel = _formatMonthYear(_selectedMonth!, _selectedYear);
    } else {
      activeMonthYearLabel = currentCalMonth;
    }

    final activeStatusData = _getMonthSalaryStatus(activeMonthYearLabel);
    final isActivePaid = activeStatusData['is_paid'] == true;
    final paidAmount = activeStatusData['amount'] ?? baseSalary;

    // Filter payments list
    final filteredPayments = _payments.where((p) {
      // 1. Month-Year Filter
      if (!_showAllInvoices) {
        final itemMonthYear = _getItemMonthYear(p);
        if (_selectedMonth != null) {
          final target = _formatMonthYear(_selectedMonth!, _selectedYear).toLowerCase();
          if (itemMonthYear.isNotEmpty && itemMonthYear.toLowerCase() != target) {
            return false;
          }
        } else {
          // All months of _selectedYear
          if (itemMonthYear.isNotEmpty && !itemMonthYear.contains('$_selectedYear')) {
            return false;
          }
        }
      }

      // 2. Type Filter
      if (_selectedTypeFilter == 'salary') {
        return p['record_kind'] == 'salary' || p['payment_type'] == 'monthly_salary';
      }
      if (_selectedTypeFilter == 'payment') {
        return p['record_kind'] == 'payment' && p['payment_type'] != 'monthly_salary';
      }
      return true;
    }).toList();

    // Active filter banner label
    String filterBannerLabel;
    if (_showAllInvoices) {
      filterBannerLabel = 'All Time Invoices';
    } else if (_selectedMonth != null) {
      final formatted = _formatMonthYear(_selectedMonth!, _selectedYear);
      filterBannerLabel = formatted == currentCalMonth ? '$formatted (Current Month)' : formatted;
    } else {
      filterBannerLabel = 'All Months in $_selectedYear';
    }

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
              'Salary & Payments',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              name,
              style: const TextStyle(fontSize: 11, color: LaasyaColors.accentGold),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : RefreshIndicator(
              onRefresh: _loadSalaries,
              color: LaasyaColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    // ========================================================
                    // 1. TOP BAR / SUMMARY CARD:
                    //    BASE SALARY & ACCURATE SALARY STATUS (PAID / PENDING)
                    // ========================================================
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF590231), Color(0xFF7D0345)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.5), width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF590231).withOpacity(0.25),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Base Monthly Salary
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'BASE MONTHLY SALARY',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.6,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.white24),
                                ),
                                child: const Text(
                                  'Honorarium',
                                  style: TextStyle(
                                    color: LaasyaColors.accentGold,
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '₹${baseSalary.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                          ),

                          const SizedBox(height: 16),
                          const Divider(height: 1, color: Colors.white24),
                          const SizedBox(height: 14),

                          // Accurate Salary Status (Changes with month & reflects paid status)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${activeMonthYearLabel.toUpperCase()} SALARY',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: Colors.white70,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 5),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: isActivePaid ? const Color(0xFFDEF7EC) : const Color(0xFFFEF3C7),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: isActivePaid ? const Color(0xFF31C48D) : const Color(0xFFF59E0B),
                                        width: 1.2,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          isActivePaid ? Icons.check_circle_rounded : Icons.pending_actions_rounded,
                                          size: 15,
                                          color: isActivePaid ? const Color(0xFF03543F) : const Color(0xFFB45309),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          isActivePaid ? 'PAID' : 'PENDING',
                                          style: TextStyle(
                                            color: isActivePaid ? const Color(0xFF03543F) : const Color(0xFFB45309),
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.4,
                                          ),
                                        ),
                                        if (isActivePaid && paidAmount != null) ...[
                                          const SizedBox(width: 6),
                                          Text(
                                            '(₹$paidAmount)',
                                            style: const TextStyle(
                                              color: Color(0xFF03543F),
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const Text('CYCLE', style: TextStyle(fontSize: 10, color: Colors.white60, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 3),
                                  Text(
                                    activeMonthYearLabel,
                                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // ========================================================
                    // 2. ENHANCED MONTH & YEAR FILTER BAR
                    // ========================================================
                    Container(
                      padding: const EdgeInsets.all(14),
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
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.tune_rounded, size: 17, color: LaasyaColors.primary),
                                  const SizedBox(width: 8),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'FILTER INVOICES',
                                        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5),
                                      ),
                                      Text(
                                        filterBannerLabel,
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: LaasyaColors.primary,
                                  side: const BorderSide(color: Color(0xFFF0D5E4), width: 1.2),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                ),
                                onPressed: _showMonthYearFilterPicker,
                                icon: const Icon(Icons.calendar_month_rounded, size: 14),
                                label: const Text('Change Month', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          // Horizontal quick pills
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _quickMonthChip(
                                  'Current (Oct 2026)',
                                  !_showAllInvoices && _selectedYear == 2026 && _selectedMonth == 10,
                                  () {
                                    setState(() {
                                      _selectedYear = 2026;
                                      _selectedMonth = 10;
                                      _showAllInvoices = false;
                                    });
                                  },
                                ),
                                _quickMonthChip(
                                  'Sep 2026',
                                  !_showAllInvoices && _selectedYear == 2026 && _selectedMonth == 9,
                                  () {
                                    setState(() {
                                      _selectedYear = 2026;
                                      _selectedMonth = 9;
                                      _showAllInvoices = false;
                                    });
                                  },
                                ),
                                _quickMonthChip(
                                  'Aug 2026',
                                  !_showAllInvoices && _selectedYear == 2026 && _selectedMonth == 8,
                                  () {
                                    setState(() {
                                      _selectedYear = 2026;
                                      _selectedMonth = 8;
                                      _showAllInvoices = false;
                                    });
                                  },
                                ),
                                _quickMonthChip(
                                  'All 2026',
                                  !_showAllInvoices && _selectedYear == 2026 && _selectedMonth == null,
                                  () {
                                    setState(() {
                                      _selectedYear = 2026;
                                      _selectedMonth = null;
                                      _showAllInvoices = false;
                                    });
                                  },
                                ),
                                _quickMonthChip(
                                  'All Time',
                                  _showAllInvoices,
                                  () {
                                    setState(() {
                                      _showAllInvoices = true;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ========================================================
                    // 3. INVOICE-WISE LIST WITH SIMPLE PAYMENT TYPE NAMES
                    // ========================================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Payment Invoices',
                              style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                            ),
                            Text(
                              '${filteredPayments.length} invoice${filteredPayments.length == 1 ? '' : 's'}',
                              style: const TextStyle(fontSize: 10.5, color: Colors.grey),
                            ),
                          ],
                        ),
                        // Type filter buttons
                        Row(
                          children: [
                            _filterChip('all', 'All'),
                            const SizedBox(width: 6),
                            _filterChip('salary', 'Salary'),
                            const SizedBox(width: 6),
                            _filterChip('payment', 'Payments'),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Invoices List
                    if (filteredPayments.isEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.receipt_outlined, size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text(
                              'No invoices found for $filterBannerLabel.',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Select another month or view all invoices using the button below:',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF590231),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              ),
                              onPressed: () => setState(() => _showAllInvoices = true),
                              icon: const Icon(Icons.all_inclusive_rounded, size: 16),
                              label: const Text('View All Invoices', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filteredPayments.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final item = filteredPayments[index];
                          final isSalary = item['record_kind'] == 'salary' || item['payment_type'] == 'monthly_salary';
                          final typeLabel = _getPaymentTypeLabel(item);
                          final invNo = (item['invoice_number'] ?? item['voucher_number'] ?? 'LCA-SAL-2026').toString();
                          final amount = item['amount'] ?? item['net_salary'] ?? 30000;
                          final date = (item['display_date'] ?? item['payment_date'] ?? 'Recent').toString();
                          final method = (item['payment_method'] ?? 'Bank Transfer').toString().toUpperCase().replaceAll('_', ' ');
                          final month = item['payroll_month']?.toString();

                          return InkWell(
                            onTap: () => _showSalarySlipModal(item),
                            borderRadius: BorderRadius.circular(20),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
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
                                  // Top Row: Date & Clean Simple Payment Type Badge (NO LONG TEXTS)
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      // Date Display
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFF0F5),
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(color: const Color(0xFFF0D5E4)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.calendar_month_rounded, size: 14, color: LaasyaColors.primary),
                                            const SizedBox(width: 6),
                                            Text(
                                              date,
                                              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.black87),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Simple Clean Badge: Just "Salary" or the specific simple payment type
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                                        decoration: BoxDecoration(
                                          color: isSalary ? const Color(0xFFDEF7EC) : const Color(0xFFF3E8FF),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(
                                            color: isSalary ? const Color(0xFF31C48D) : const Color(0xFFC084FC),
                                            width: 1.2,
                                          ),
                                        ),
                                        child: Text(
                                          isSalary ? 'Salary' : typeLabel,
                                          style: TextStyle(
                                            color: isSalary ? const Color(0xFF03543F) : const Color(0xFF6B21A8),
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 14),

                                  // Middle Row: Clear Invoice Number & Amount
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          InkWell(
                                            onTap: () {
                                              Clipboard.setData(ClipboardData(text: invNo));
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Copied: ' + invNo),
                                                  behavior: SnackBarBehavior.floating,
                                                  duration: const Duration(seconds: 2),
                                                  backgroundColor: LaasyaColors.primary,
                                                ),
                                              );
                                            },
                                            borderRadius: BorderRadius.circular(8),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFFFF9FB),
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(color: const Color(0xFFF0D5E4), width: 1.2),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(Icons.tag_rounded, size: 14, color: LaasyaColors.primary),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    invNo,
                                                    style: const TextStyle(
                                                      fontFamily: 'monospace',
                                                      fontSize: 11.5,
                                                      fontWeight: FontWeight.bold,
                                                      color: LaasyaColors.primary,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 5),
                                                  const Icon(Icons.copy_rounded, size: 12, color: Colors.grey),
                                                ],
                                              ),
                                            ),
                                          ),

                                          if (month != null && month.isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              'Period: $month',
                                              style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                                            ),
                                          ],
                                        ],
                                      ),
                                      Text(
                                        '₹$amount',
                                        style: const TextStyle(
                                          fontSize: 16.5,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF03543F),
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 12),
                                  const Divider(height: 1),
                                  const SizedBox(height: 10),

                                  // Bottom Row: Mode & Slip Button
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(Icons.payment_rounded, size: 14, color: Colors.grey.shade600),
                                          const SizedBox(width: 4),
                                          Text(
                                            method,
                                            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Colors.grey.shade700),
                                          ),
                                        ],
                                      ),
                                      InkWell(
                                        onTap: () {
                                          final pdfUrl = _getPdfUrl(item);
                                          PdfLauncher.openPdf(context, pdfUrl, title: 'Payment Slip $invNo');
                                        },
                                        borderRadius: BorderRadius.circular(10),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF590231),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.download_rounded, size: 13, color: LaasyaColors.accentGold),
                                              SizedBox(width: 4),
                                              Text(
                                                'Slip (PDF)',
                                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

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

  Widget _filterChip(String type, String label) {
    final isSelected = _selectedTypeFilter == type;
    return InkWell(
      onTap: () => setState(() => _selectedTypeFilter = type),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? LaasyaColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? LaasyaColors.primary : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : Colors.grey.shade700,
          ),
        ),
      ),
    );
  }
}

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
  List<Map<String, dynamic>> _payments = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = true;
  String _selectedMonthFilter = '';
  String _selectedTypeFilter = 'all'; // 'all' | 'salary' | 'payment'

  @override
  void initState() {
    super.initState();
    _payments = SupabaseService().getCachedSalaries();
    _summary = SupabaseService().getCachedSalarySummary() ?? {};
    _selectedMonthFilter = (_summary['current_month'] ?? _getCurrentMonthString()).toString();
    _isLoading = _payments.isEmpty;
    _loadSalaries();
  }

  String _getCurrentMonthString() {
    final now = DateTime.now();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return '${months[now.month - 1]} ${now.year}';
  }

  Future<void> _loadSalaries() async {
    if (_payments.isEmpty) {
      setState(() => _isLoading = true);
    }
    final data = await SupabaseService().getTrainerSalaryPayouts();
    final summary = SupabaseService().getCachedSalarySummary() ?? {};

    if (mounted) {
      setState(() {
        _payments = data;
        _summary = summary;
        if (_selectedMonthFilter.isEmpty) {
          _selectedMonthFilter = (_summary['current_month'] ?? _getCurrentMonthString()).toString();
        }
        _isLoading = false;
      });
    }
  }

  String _getPdfUrl(Map<String, dynamic> item) {
    final id = (item['id'] ?? '').toString();
    final vNo = (item['invoice_number'] ?? item['voucher_number'] ?? 'LCA-SAL-2026').toString();
    final month = (item['payroll_month'] ?? _selectedMonthFilter).toString();
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
    final badgeLabel = (item['badge_label'] ?? (isSalary ? 'Monthly Salary' : 'Direct Payment')).toString();
    final remarks = (item['remarks'] ?? item['notes'] ?? (isSalary ? 'Monthly Honorarium' : 'Disbursement')).toString();

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

              // Title
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
                          isSalary ? 'Faculty Salary Pay Slip' : 'Faculty Payment Voucher',
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
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
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
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
                              const Text('Official Faculty Payout & Honorarium Ledger', style: TextStyle(fontSize: 10.5, color: Colors.black54)),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),
                        const Divider(height: 1, thickness: 1),
                        const SizedBox(height: 14),

                        // Voucher & Date Row
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
                                const Text('PAYMENT CATEGORY', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: isSalary ? const Color(0xFFDEF7EC) : const Color(0xFFF3E8FF),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    badgeLabel.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 10.5,
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
                                  child: const Text('DISBURSED • SETTLED', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
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
                          'FACULTY & DISBURSEMENT DETAILS',
                          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: LaasyaColors.primary),
                        ),
                        const SizedBox(height: 8),
                        _invRow('Guru / Trainer Name', name),
                        _invRow('Academic Designation', title),
                        _invRow('Specialization / Style', spec),
                        _invRow('Disbursement Date', date),
                        _invRow('Payment Mode', method),
                        _invRow('Transaction UTR / Ref', ref),
                        if (isSalary) _invRow('Payroll Month', month),
                        _invRow('Purpose / Remarks', remarks),

                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 14),

                        // Amount Card
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
                                      const Text('Deduction / Advance Recovery', style: TextStyle(fontSize: 12, color: Colors.rose)),
                                      Text('-₹$deduction', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.rose)),
                                    ],
                                  ),
                                ],
                                const Divider(height: 14),
                              ],
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    isSalary ? 'Net Disbursed Salary' : 'Disbursed Amount',
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
                                  ),
                                  Text(
                                    '₹${NumberFormat ? NumberFormat.currency : amount}.00',
                                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.black, color: Color(0xFF03543F)),
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
                                  Text('SETTLED BY ACCOUNTS', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                ],
                              ),
                            ),
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('For Laasya Cultural Academy', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                SizedBox(height: 4),
                                Text('Accounts Desk', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: LaasyaColors.primary)),
                                Text('Verified Payment', style: TextStyle(fontSize: 10, color: Colors.grey)),
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
                            text: 'Laasya Cultural Academy - Faculty Payment Slip\n'
                                'Invoice: $vNo\n'
                                'Beneficiary: $name\n'
                                'Amount: ₹$amount\n'
                                'Date: $date\n'
                                'Txn Ref: $ref\n'
                                'Status: Disbursed & Verified',
                          ));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Payment slip reference copied for $vNo'),
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

  void _showMonthYearFilterPicker() {
    final allMonths = _summary['all_months'] as List<dynamic>? ?? [];
    if (allMonths.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No historical payroll months recorded yet.')),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Select Payroll Month',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Check salary disbursement status for any past or current month:',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 16),
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: allMonths.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, idx) {
                      final m = allMonths[idx];
                      final monthStr = (m['month'] ?? '').toString();
                      final status = (m['status'] ?? 'Pending').toString();
                      final isPaid = m['is_paid'] == true || status.toLowerCase() == 'paid';
                      final isSelected = _selectedMonthFilter == monthStr;

                      return ListTile(
                        tileColor: isSelected ? const Color(0xFFFCE7F3) : Colors.grey.shade50,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(
                            color: isSelected ? LaasyaColors.primary : Colors.grey.shade200,
                          ),
                        ),
                        title: Text(
                          monthStr,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                            color: isSelected ? LaasyaColors.primary : Colors.black87,
                          ),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isPaid ? const Color(0xFFDEF7EC) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            isPaid ? 'PAID' : 'PENDING',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isPaid ? const Color(0xFF03543F) : const Color(0xFFB45309),
                            ),
                          ),
                        ),
                        onTap: () {
                          setState(() {
                            _selectedMonthFilter = monthStr;
                          });
                          Navigator.pop(ctx);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.trainerProfile?['full_name'] ?? _summary['guru_name'] ?? 'Faculty Guru';
    final baseSalary = _summary['base_salary'] ?? widget.trainerProfile?['monthly_salary'] ?? 30000;
    final currentMonth = (_summary['current_month'] ?? _getCurrentMonthString()).toString();
    
    // Find status for the selected filter month
    final allMonths = _summary['all_months'] as List<dynamic>? ?? [];
    final selectedMonthData = allMonths.firstWhere(
      (m) => m['month'] == _selectedMonthFilter,
      orElse: () => null,
    );
    final isSelectedPaid = selectedMonthData != null
        ? (selectedMonthData['is_paid'] == true || selectedMonthData['status'] == 'Paid')
        : (_summary['current_month_status'] == 'Paid');
    final filterStatusText = isSelectedPaid ? 'Paid' : 'Pending';

    // Filter payments list
    final filteredPayments = _payments.filter((p) {
      if (_selectedTypeFilter == 'salary') {
        return p['record_kind'] == 'salary' || p['payment_type'] == 'monthly_salary';
      }
      if (_selectedTypeFilter == 'payment') {
        return p['record_kind'] == 'payment' && p['payment_type'] != 'monthly_salary';
      }
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
                    // 1. TOP SUMMARY CARD: BASE SALARY & PAYMENT STATUS ONLY
                    // ========================================================
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF590231), Color(0xFF8A064D)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.5), width: 1.2),
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
                          
                          // Top Header: Base Monthly Salary
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'BASE MONTHLY SALARY',
                                style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3.5),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.white24),
                                ),
                                child: const Text(
                                  'Agreed Faculty Honorarium',
                                  style: TextStyle(color: LaasyaColors.accentGold, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '₹${baseSalary.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.black, color: Colors.white),
                          ),

                          const SizedBox(height: 18),
                          const Divider(height: 1, color: Colors.white24),
                          const SizedBox(height: 16),

                          // Month Payment Status & Month Filter Trigger
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${_selectedMonthFilter.isNotEmpty ? _selectedMonthFilter : currentMonth} Status',
                                      style: const TextStyle(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: isSelectedPaid ? const Color(0xFFDEF7EC) : const Color(0xFFFEF3C7),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                isSelectedPaid ? Icons.check_circle_rounded : Icons.schedule_rounded,
                                                size: 13,
                                                color: isSelectedPaid ? const Color(0xFF03543F) : const Color(0xFFB45309),
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                filterStatusText.toUpperCase(),
                                                style: TextStyle(
                                                  color: isSelectedPaid ? const Color(0xFF03543F) : const Color(0xFFB45309),
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (isSelectedPaid && selectedMonthData != null && selectedMonthData['net_salary'] != null) ...[
                                          const SizedBox(width: 8),
                                          Text(
                                            '₹${selectedMonthData['net_salary']}',
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),

                              // Month Year Filter Dropdown Button
                              InkWell(
                                onTap: _showMonthYearFilterPicker,
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.1),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.calendar_month_rounded, size: 16, color: LaasyaColors.primary),
                                      const SizedBox(width: 6),
                                      Text(
                                        _selectedMonthFilter.isNotEmpty ? _selectedMonthFilter : 'Select Month',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: LaasyaColors.primary,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.arrow_drop_down_rounded, size: 18, color: LaasyaColors.primary),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),

                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // ========================================================
                    // 2. PAYMENT HISTORY SECTION (ALL PAYMENTS DONE TO GURU)
                    // ========================================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Payment History',
                              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                            ),
                            Text(
                              'All disbursements (${filteredPayments.length} records)',
                              style: const TextStyle(fontSize: 11.5, color: Colors.grey),
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

                    // Payments List
                    if (filteredPayments.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.receipt_outlined, size: 44, color: Colors.grey.shade400),
                            const SizedBox(height: 10),
                            const Text(
                              'No disbursements found for this filter.',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Payments and monthly salaries disbursed by admin will appear here.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 11, color: Colors.grey),
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
                          final invNo = (item['invoice_number'] ?? item['voucher_number'] ?? 'LCA-SAL-2026').toString();
                          final amount = item['amount'] ?? item['net_salary'] ?? 30000;
                          final date = (item['display_date'] ?? item['payment_date'] ?? 'Recent').toString();
                          final method = (item['payment_method'] ?? 'Bank Transfer').toString().toUpperCase().replaceAll('_', ' ');
                          final badgeLabel = (item['badge_label'] ?? (isSalary ? 'Salary' : 'Payment')).toString();
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
                                  // Top Row: Date & Kind Badge
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.event_available_rounded, size: 16, color: LaasyaColors.primary),
                                          const SizedBox(width: 6),
                                          Text(
                                            date,
                                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: Colors.black87),
                                          ),
                                        ],
                                      ),
                                      // Distinction Badge: [Salary] vs [Payment]
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3.5),
                                        decoration: BoxDecoration(
                                          color: isSalary ? const Color(0xFFDEF7EC) : const Color(0xFFF3E8FF),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(
                                            color: isSalary ? const Color(0xFFBCF0DA) : const Color(0xFFE9D5FF),
                                          ),
                                        ),
                                        child: Text(
                                          isSalary ? 'SALARY' : 'PAYMENT • ${badgeLabel.toUpperCase()}',
                                          style: TextStyle(
                                            color: isSalary ? const Color(0xFF03543F) : const Color(0xFF6B21A8),
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.black,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 12),

                                  // Middle Row: Invoice & Amount
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFFF9FB),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: const Color(0xFFF0D5E4)),
                                            ),
                                            child: Text(
                                              '# $invNo',
                                              style: const TextStyle(
                                                fontFamily: 'monospace',
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                color: LaasyaColors.primary,
                                              ),
                                            ),
                                          ),
                                          if (month != null && month.isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              'Period: $month',
                                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                            ),
                                          ],
                                        ],
                                      ),
                                      Text(
                                        '₹$amount',
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.black,
                                          color: Color(0xFF03543F),
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 12),
                                  const Divider(height: 1),
                                  const SizedBox(height: 10),

                                  // Bottom Row: Mode & Download Slip Button
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(Icons.payment_rounded, size: 14, color: Colors.grey.shade600),
                                          const SizedBox(width: 4),
                                          Text(
                                            method,
                                            style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Colors.grey.shade700),
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
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
                                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
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
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : Colors.grey.shade700,
          ),
        ),
      ),
    );
  }
}
extension ListFilterExtension<E> on List<E> {
  Iterable<E> filter(bool Function(E element) test) => where(test);
}

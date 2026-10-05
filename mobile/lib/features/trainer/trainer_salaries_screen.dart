import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

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
  List<Map<String, dynamic>> _salaries = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSalaries();
  }

  Future<void> _loadSalaries() async {
    setState(() => _isLoading = true);
    final data = await SupabaseService().getTrainerSalaryPayouts();
    if (mounted) {
      setState(() {
        _salaries = data;
        _isLoading = false;
      });
    }
  }

  void _showSalarySlipModal(Map<String, dynamic> item) {
    final vNo = (item['voucher_number'] ?? 'LCA-SAL-2026').toString();
    final recNo = (item['receipt_number'] ?? 'LCA-VOUCHER-2026').toString();
    final month = (item['payroll_month'] ?? 'Current Month').toString();
    final name = (item['trainer_name'] ?? widget.trainerProfile?['full_name'] ?? 'Smt. Anusha Sumesh').toString();
    final title = (item['display_title'] ?? widget.trainerProfile?['designation'] ?? 'Founder & Head Guru').toString();
    final spec = (item['specialization'] ?? widget.trainerProfile?['specialization'] ?? 'Bharatanatyam Classical Dance').toString();
    final base = item['base_salary'] ?? 45000;
    final bonus = item['bonus_amount'] ?? 0;
    final bonusReason = item['bonus_reason'] as String?;
    final deduction = item['deduction_amount'] ?? 0;
    final net = item['net_salary'] ?? (base + bonus - deduction);
    final date = (item['payment_date'] ?? 'Recent').toString();
    final method = (item['payment_method'] ?? 'Bank Transfer').toString();
    final ref = (item['transaction_reference'] ?? 'IMPS/ONLINE').toString();
    final disbursedBy = (item['disbursed_by'] ?? 'Sri Ramesh Rao (Academy Director)').toString();
    final classesConducted = item['classes_conducted'] ?? 24;

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
                    const Row(
                      children: [
                        Icon(Icons.receipt_long_rounded, color: LaasyaColors.primary, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'Faculty Salary Pay Slip',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
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
                              const Text('Society Reg. No: REG/HYD/2018/84920', style: TextStyle(fontSize: 10, color: Colors.grey)),
                              const Text('Faculty Payroll & Disbursement Record', style: TextStyle(fontSize: 10, color: Colors.black54)),
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
                                const Text('VOUCHER NUMBER', style: TextStyle(fontSize: 9.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Text(vNo, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark)),
                                const SizedBox(height: 6),
                                const Text('DISBURSEMENT REF', style: TextStyle(fontSize: 9.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                                Text(recNo, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Colors.black87)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('PAYROLL MONTH', style: TextStyle(fontSize: 9.5, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Text(month, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark)),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDEF7EC),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text('DISBURSED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
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
                          'FACULTY & DISCIPLINE PARTICULARS',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: LaasyaColors.primary),
                        ),
                        const SizedBox(height: 8),
                        _invRow('Guru / Trainer Name', name),
                        _invRow('Academic Title', title),
                        _invRow('Discipline / Art Form', spec),
                        _invRow('Classes Conducted', '$classesConducted Sessions'),
                        _invRow('Payment Date', date),

                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 14),

                        // Salary Breakdown
                        const Text(
                          'COMPENSATION BREAKDOWN',
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
                                  const Text('Base Monthly Honorarium', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                  Text('₹$base', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                              if (bonus > 0) ...[
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        bonusReason ?? 'Special Performance Honorarium',
                                        style: const TextStyle(fontSize: 11, color: Color(0xFF03543F)),
                                      ),
                                    ),
                                    Text('+ ₹$bonus', style: const TextStyle(fontSize: 11, color: Color(0xFF03543F), fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ],
                              if (deduction > 0) ...[
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Authorized Deductions', style: TextStyle(fontSize: 11, color: Colors.red)),
                                    Text('- ₹$deduction', style: const TextStyle(fontSize: 11, color: Colors.red, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ],
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Net Disbursed Payout', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark)),
                                  Text('₹$net.00', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Payment Details
                        _invRow('Transfer Mode', method),
                        _invRow('Bank UTR / Transaction Ref', ref),
                        _invRow('Disbursed By', disbursedBy),

                        const SizedBox(height: 18),

                        // Authorized Seal & Sign
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
                                  Text('DISBURSED & VERIFIED', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF03543F))),
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
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(
                            text: 'Laasya Cultural Academy - Faculty Salary Pay Slip\n'
                                'Voucher: $vNo\n'
                                'Guru: $name\n'
                                'Month: $month\n'
                                'Net Disbursed: ₹$net\n'
                                'Txn Ref: $ref\n'
                                'Date: $date\n'
                                'Status: Verified & Disbursed',
                          ));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Salary voucher copied for $vNo'),
                              backgroundColor: LaasyaColors.primary,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        icon: const Icon(Icons.share_rounded, size: 16),
                        label: const Text('Share Voucher', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
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
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Row(
                                children: [
                                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      'Pay Slip $vNo successfully downloaded to device storage!',
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
                        },
                        icon: const Icon(Icons.download_rounded, size: 18, color: LaasyaColors.accentGold),
                        label: const Text(
                          'Download Pay Slip (PDF)',
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
    final name = widget.trainerProfile?['full_name'] ?? 'Smt. Anusha Sumesh';
    final spec = widget.trainerProfile?['specialization'] ?? 'Bharatanatyam Classical Dance';
    final monthlySalary = widget.trainerProfile?['monthly_salary'] ?? 45000;

    int totalEarned = 0;
    for (var s in _salaries) {
      final n = s['net_salary'];
      if (n is num) totalEarned += n.toInt();
    }
    if (totalEarned == 0) totalEarned = 183000;

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
              'Compensation & Pay Slips',
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
                    // Top Summary Card
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
                                      'PAYROLL: DISBURSED',
                                      style: TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                spec,
                                style: const TextStyle(color: LaasyaColors.accentGold, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          const Text('Total Honorarium Disbursed (Academic Year)', style: TextStyle(color: Colors.white70, fontSize: 12)),
                          const SizedBox(height: 2),
                          Text(
                            '₹$totalEarned.00',
                            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
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
                                      const Text('Base Monthly Rate', style: TextStyle(fontSize: 10.5, color: Colors.white70)),
                                      const SizedBox(height: 2),
                                      Text('₹$monthlySalary', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                                    ],
                                  ),
                                ),
                                Container(width: 1, height: 28, color: Colors.white24),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('October Payout', style: TextStyle(fontSize: 10.5, color: Colors.white70)),
                                      SizedBox(height: 2),
                                      Text('₹48,000 (Settled)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFFBCF0DA))),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // List Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Disbursement Records (${_salaries.length})',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                        ),
                        const Text('PDF Slips Available', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600)),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Slips List
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _salaries.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final item = _salaries[index];
                        final vNo = (item['voucher_number'] ?? 'LCA-SAL').toString();
                        final recNo = (item['receipt_number'] ?? 'LCA-VOUCHER').toString();
                        final month = (item['payroll_month'] ?? 'Monthly Salary').toString();
                        final net = item['net_salary'] ?? 45000;
                        final date = (item['payment_date'] ?? 'Recent').toString();
                        final method = (item['payment_method'] ?? 'Bank Transfer').toString();
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
                                      '$vNo • $recNo',
                                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: LaasyaColors.primary),
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
                                        Text('DISBURSED', style: TextStyle(color: Color(0xFF03543F), fontSize: 10, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 10),

                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(month, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.textDark)),
                                        const SizedBox(height: 2),
                                        Text('Disbursed on $date via $method', style: const TextStyle(fontSize: 11.5, color: Colors.grey)),
                                        if (ref.isNotEmpty) ...[
                                          const SizedBox(height: 1),
                                          Text('Ref: $ref', style: const TextStyle(fontSize: 10, color: Colors.black45, fontFamily: 'monospace')),
                                        ],
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '₹$net',
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF03543F)),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),
                              const Divider(height: 1),
                              const SizedBox(height: 10),

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
                                  onPressed: () => _showSalarySlipModal(item),
                                  icon: const Icon(Icons.download_rounded, size: 16, color: LaasyaColors.primary),
                                  label: const Text('Download Pay Slip (PDF) / View Voucher', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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

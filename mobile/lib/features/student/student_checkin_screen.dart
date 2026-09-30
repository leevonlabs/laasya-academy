import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/services/supabase_service.dart';

class StudentCheckInScreen extends StatefulWidget {
  final List<Map<String, dynamic>> enrolledBatches;

  const StudentCheckInScreen({super.key, required this.enrolledBatches});

  @override
  State<StudentCheckInScreen> createState() => _StudentCheckInScreenState();
}

class _StudentCheckInScreenState extends State<StudentCheckInScreen> {
  final _pinController = TextEditingController();
  String? _selectedBatchId;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    if (widget.enrolledBatches.isNotEmpty) {
      _selectedBatchId = widget.enrolledBatches.first['batches']?['id'];
    }
  }

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _submitCheckIn() async {
    final pin = _pinController.text.trim();
    if (pin.length != 6) {
      setState(() => _errorMessage = 'Please enter the full 6-digit PIN.');
      return;
    }

    if (_selectedBatchId == null) {
      setState(() => _errorMessage = 'Please select a batch.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Find the active session for this batch today
      final sessionId = await SupabaseService().getActiveSessionIdForBatch(_selectedBatchId!) ?? 'sess-mock-today';

      // Execute secure database RPC check-in
      final result = await SupabaseService().studentCheckIn(
        sessionId: sessionId,
        checkInCode: pin,
      );

      if (result['success'] == true) {
        setState(() => _isSuccess = true);
      } else {
        throw Exception(result['error'] ?? 'Check-in failed. Please try again.');
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Class Self Check-In'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: _isSuccess ? _buildSuccessView() : _buildFormView(),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Container(
      padding: const EdgeInsets.all(32),
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: LaasyaColors.success.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: LaasyaColors.success.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle, color: LaasyaColors.success, size: 48),
          ),
          const SizedBox(height: 20),
          const Text(
            'Check-In Verified!',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: LaasyaColors.textDark,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Your attendance has been recorded as PRESENT for today\'s class session.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: LaasyaColors.textMuted),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: LaasyaColors.primary,
              ),
              child: const Text('Back to Home'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Golden Instruction Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFFFFDF7), Color(0xFFFFF9E6)],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: LaasyaColors.accentGold),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline, color: LaasyaColors.primary, size: 28),
              SizedBox(width: 14),
              Expanded(
                child: Text(
                  'Your guru/instructor will share a 6-digit PIN on the classroom screen. Enter the PIN below to check in.',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: LaasyaColors.primaryDark,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        if (_errorMessage != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: const Color(0xFFFEE2E2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, color: LaasyaColors.error, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: LaasyaColors.error, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),

        // Select Batch Dropdown
        const Text(
          'Select Class Batch',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: LaasyaColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedBatchId,
              isExpanded: true,
              items: widget.enrolledBatches.map((item) {
                final b = item['batches'];
                return DropdownMenuItem<String>(
                  value: b['id'],
                  child: Text(
                    '${b['name']} (${b['courses']?['title'] ?? 'Art'})',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                );
              }).toList(),
              onChanged: (val) {
                setState(() => _selectedBatchId = val);
              },
            ),
          ),
        ),

        const SizedBox(height: 24),

        // 6-Digit PIN Field
        const Text(
          '6-Digit Trainer Check-In PIN',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _pinController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            letterSpacing: 12,
            color: LaasyaColors.primary,
          ),
          decoration: InputDecoration(
            counterText: '',
            hintText: '••••••',
            hintStyle: TextStyle(letterSpacing: 10, color: Colors.grey.shade300),
            prefixIcon: const Icon(Icons.pin, color: LaasyaColors.primary),
          ),
        ),

        const SizedBox(height: 28),

        // Submit Button
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _submitCheckIn,
            child: _isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text('Verify PIN & Check In'),
          ),
        ),
      ],
    );
  }
}

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';

class ActiveSessionsScreen extends StatefulWidget {
  final Map<String, dynamic>? userProfile;

  const ActiveSessionsScreen({super.key, this.userProfile});

  @override
  State<ActiveSessionsScreen> createState() => _ActiveSessionsScreenState();
}

class _ActiveSessionsScreenState extends State<ActiveSessionsScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<Map<String, dynamic>> _sessions = [];
  String? _revokingId;

  @override
  void initState() {
    super.initState();
    _fetchSessions();
  }

  Future<void> _fetchSessions() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final token = await SupabaseService().getAuthToken();
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/auth/active-sessions');
      final res = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true && decoded['sessions'] is List) {
          setState(() {
            _sessions = List<Map<String, dynamic>>.from(decoded['sessions']);
            _isLoading = false;
          });
          return;
        }
      }

      setState(() {
        _errorMessage = 'Unable to fetch active sessions. Please try again.';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _revokeSession(String sessionId, String deviceName) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Revoke Device Session?'),
        content: Text('Are you sure you want to sign out from "$deviceName"? That device will be disconnected immediately.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE53E3E),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out Device'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _revokingId = sessionId);

    try {
      final token = await SupabaseService().getAuthToken();
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/auth/active-sessions');
      final res = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'action': 'revoke',
          'sessionId': sessionId,
        }),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Successfully signed out from $deviceName.'),
              backgroundColor: const Color(0xFF2E7D32),
            ),
          );
          _fetchSessions();
          return;
        }
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to revoke session. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _revokingId = null);
    }
  }

  Future<void> _revokeAllOthers() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out All Other Devices?'),
        content: const Text(
          'This will revoke all active sessions on other phones and computers, leaving only this device logged in.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE53E3E),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out Others'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);

    try {
      final token = await SupabaseService().getAuthToken();
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/auth/active-sessions');
      final res = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'action': 'revoke_others',
        }),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['success'] == true) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('All other sessions signed out successfully.'),
              backgroundColor: Color(0xFF2E7D32),
            ),
          );
          _fetchSessions();
          return;
        }
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to sign out other sessions.'),
          backgroundColor: Colors.red,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _formatTimeAgo(dynamic dateRaw) {
    if (dateRaw == null) return 'Active recently';
    try {
      final date = DateTime.parse(dateRaw.toString());
      final diff = DateTime.now().difference(date);
      if (diff.inMinutes < 1) return 'Active just now';
      if (diff.inMinutes < 60) return 'Active ${diff.inMinutes}m ago';
      if (diff.inHours < 24) return 'Active ${diff.inHours}h ago';
      return 'Active ${diff.inDays}d ago';
    } catch (_) {
      return 'Active recently';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F5F7),
      appBar: AppBar(
        title: const Text(
          'Active Logins & Devices',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.3,
          ),
        ),
        backgroundColor: const Color(0xFF590231),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 22),
            onPressed: _fetchSessions,
            tooltip: 'Refresh Sessions',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8A064D)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Colors.red, size: 48),
                        const SizedBox(height: 12),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8A064D),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _fetchSessions,
                          child: const Text('Try Again'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  color: const Color(0xFF8A064D),
                  onRefresh: _fetchSessions,
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    children: [
                      // Overview Banner
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF2F8),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFF0D5E4)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.shield_outlined, color: Color(0xFF8A064D), size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Account Security & Active Devices',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF8A064D),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'You are currently signed in on ${_sessions.length} device${_sessions.length == 1 ? '' : 's'}. You can sign out any device you do not recognize.',
                                    style: TextStyle(fontSize: 12, color: Colors.grey.shade700, height: 1.3),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          'CONNECTED DEVICES',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                            color: Color(0xFF8A064D),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Session Cards
                      ..._sessions.map((sess) {
                        final id = sess['id']?.toString() ?? '';
                        final deviceName = sess['device_name']?.toString() ?? 'Web Device';
                        final browser = sess['browser']?.toString() ?? '';
                        final ip = sess['ip_address']?.toString() ?? '127.0.0.1';
                        final isCurrent = sess['is_current'] == true;
                        final lastActive = _formatTimeAgo(sess['last_active_at']);
                        final isMobile = deviceName.toLowerCase().contains('phone') ||
                            deviceName.toLowerCase().contains('android') ||
                            deviceName.toLowerCase().contains('ios');

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isCurrent ? const Color(0xFFF9E33A) : const Color(0xFFF0D5E4),
                              width: isCurrent ? 1.5 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: isCurrent ? const Color(0xFFFFF2F8) : Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    isMobile ? Icons.smartphone_rounded : Icons.laptop_rounded,
                                    color: isCurrent ? const Color(0xFF8A064D) : Colors.grey.shade700,
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Flexible(
                                            child: Text(
                                              deviceName,
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF260317),
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          if (isCurrent) ...[
                                            const SizedBox(width: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFFEF3C7),
                                                borderRadius: BorderRadius.circular(6),
                                                border: Border.all(color: const Color(0xFFF9E33A)),
                                              ),
                                              child: const Text(
                                                'THIS DEVICE',
                                                style: TextStyle(
                                                  fontSize: 9.5,
                                                  fontWeight: FontWeight.bold,
                                                  color: Color(0xFF92400E),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        '$browser • IP: $ip',
                                        style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        lastActive,
                                        style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                                      ),
                                    ],
                                  ),
                                ),
                                if (!isCurrent)
                                  TextButton(
                                    onPressed: _revokingId == id ? null : () => _revokeSession(id, deviceName),
                                    style: TextButton.styleFrom(
                                      foregroundColor: const Color(0xFFE53E3E),
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    ),
                                    child: _revokingId == id
                                        ? const SizedBox(
                                            width: 14,
                                            height: 14,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red),
                                          )
                                        : const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                              ],
                            ),
                          ),
                        );
                      }),

                      const SizedBox(height: 12),

                      // Sign Out All Other Devices Button
                      if (_sessions.where((s) => s['is_current'] != true).isNotEmpty)
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFFE53E3E),
                              side: const BorderSide(color: Color(0xFFFEB2B2), width: 1.2),
                              backgroundColor: const Color(0xFFFFF5F5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            icon: const Icon(Icons.logout_rounded, size: 18),
                            label: const Text(
                              'Sign Out All Other Devices',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            onPressed: _revokeAllOthers,
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}

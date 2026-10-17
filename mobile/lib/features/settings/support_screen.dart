import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/avatar_helper.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _profile = {
    'full_name': 'Satya',
    'avatar_url': '',
    'designation': 'Academy Director & Operations Lead',
    'contacts': [
      {'title': 'Office Desk & Admissions', 'phone': '7780763121'}
    ],
    'emails': [
      {'title': 'Official Inquiries', 'email': 'admin@laasyaacademy.com'}
    ],
    'campus_address': 'Laasya Cultural Academy, Main Campus, Hyderabad',
    'map_url': 'https://maps.google.com/?q=Laasya+Cultural+Academy',
  };

  @override
  void initState() {
    super.initState();
    _fetchSupportProfile();
  }

  Future<void> _fetchSupportProfile() async {
    try {
      final res = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/api/settings/admin-profile'),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['profile'] is Map) {
          if (mounted) {
            setState(() {
              _profile = Map<String, dynamic>.from(data['profile']);
              _isLoading = false;
            });
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('[SupportScreen] Notice fetching support profile: $e');
    }
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _makeCall(String phone) async {
    final clean = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _openWhatsApp(String phone) async {
    final clean = phone.replaceAll(RegExp(r'[^0-9]'), '');
    final uri = Uri.parse('https://wa.me/$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _sendEmail(String email) async {
    final uri = Uri.parse('mailto:$email');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _openMap(String mapUrl) async {
    if (mapUrl.isEmpty) return;
    final uri = Uri.parse(mapUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = (_profile['full_name'] ?? 'Satya').toString();
    final avatarUrl = _profile['avatar_url'];
    final designation = (_profile['designation'] ?? 'Academy Director').toString();
    final address = (_profile['campus_address'] ?? 'Laasya Cultural Academy, Main Campus').toString();
    final mapUrl = (_profile['map_url'] ?? '').toString();

    final rawContacts = _profile['contacts'];
    final List<Map<String, dynamic>> contacts = (rawContacts is List)
        ? rawContacts.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList()
        : [{'title': 'Office Desk', 'phone': '7780763121'}];

    final rawEmails = _profile['emails'];
    final List<Map<String, dynamic>> emails = (rawEmails is List)
        ? rawEmails.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList()
        : [{'title': 'Official Inquiries', 'email': 'admin@laasyaacademy.com'}];

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Support & Helpdesk',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: LaasyaColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Executive Director / Admin Header Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2D041A), Color(0xFF590231), Color(0xFF8A064D)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        AppAvatar(
                          avatarUrl: avatarUrl,
                          name: name,
                          radius: 34,
                          backgroundColor: Colors.white12,
                          textColor: LaasyaColors.accentGold,
                          border: Border.all(color: LaasyaColors.accentGold, width: 2),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'ACADEMY EXECUTIVE DESK',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w900,
                                    color: LaasyaColors.accentGold,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                name,
                                style: const TextStyle(
                                  fontSize: 19,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                designation,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.white.withOpacity(0.85),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 2. Contact Numbers Section
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      'OFFICIAL CONTACT HELPLINES',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: Color(0xFF8A064D),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  Container(
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
                    child: ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: contacts.length,
                      separatorBuilder: (_, __) => const Divider(height: 1, indent: 56),
                      itemBuilder: (context, idx) {
                        final c = contacts[idx];
                        final title = (c['title'] ?? 'Contact').toString();
                        final phone = (c['phone'] ?? '').toString();

                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          leading: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: const Color(0xFFDEF7EC),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.phone_rounded, color: Color(0xFF03543F), size: 20),
                          ),
                          title: Text(
                            title,
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF8A064D)),
                          ),
                          subtitle: Text(
                            phone,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF2D041A)),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.call_rounded, color: Color(0xFF047857), size: 20),
                                tooltip: 'Call',
                                onPressed: () => _makeCall(phone),
                              ),
                              IconButton(
                                icon: Image.asset(
                                  'assets/images/header_logo.png',
                                  width: 20,
                                  height: 20,
                                  errorBuilder: (_, __, ___) => const Icon(Icons.chat_rounded, color: Color(0xFF075E54), size: 20),
                                ),
                                tooltip: 'WhatsApp',
                                onPressed: () => _openWhatsApp(phone),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 3. Official Emails Section
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      'ACADEMY CORRESPONDENCE EMAILS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: Color(0xFF8A064D),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  Container(
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
                    child: ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: emails.length,
                      separatorBuilder: (_, __) => const Divider(height: 1, indent: 56),
                      itemBuilder: (context, idx) {
                        final em = emails[idx];
                        final title = (em['title'] ?? 'Email').toString();
                        final email = (em['email'] ?? '').toString();

                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          leading: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE1EFFE),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.mail_rounded, color: Color(0xFF1E429F), size: 20),
                          ),
                          title: Text(
                            title,
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1E429F)),
                          ),
                          subtitle: Text(
                            email,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF2D041A)),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.send_rounded, color: Color(0xFF1E429F), size: 19),
                            tooltip: 'Send Email',
                            onPressed: () => _sendEmail(email),
                          ),
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 4. Campus Location & Google Maps
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      'CAMPUS ADDRESS & LOCATION',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: Color(0xFF8A064D),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  Container(
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF2F8),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFF0D5E4)),
                              ),
                              child: const Icon(Icons.location_on_rounded, color: LaasyaColors.primary, size: 24),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Main Campus Address',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF8A064D)),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    address,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF2D041A), height: 1.4),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        if (mapUrl.isNotEmpty) ...[
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () => _openMap(mapUrl),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF8A064D),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                              icon: const Icon(Icons.map_rounded, size: 18),
                              label: const Text(
                                'Open in Google Maps',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}

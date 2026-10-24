import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/supabase_service.dart';

class ChatMessage {
  final String role;
  final String text;
  final DateTime timestamp;

  ChatMessage({
    required this.role,
    required this.text,
    required this.timestamp,
  });
}

class StudentAiAssistantScreen extends StatefulWidget {
  const StudentAiAssistantScreen({super.key});

  @override
  State<StudentAiAssistantScreen> createState() => _StudentAiAssistantScreenState();
}

class _StudentAiAssistantScreenState extends State<StudentAiAssistantScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initWelcomeMessage();
  }

  void _initWelcomeMessage() {
    final profile = SupabaseService().currentUserProfile;
    final studentName = profile?['full_name']?.toString() ?? 'Disciple';

    _messages.add(
      ChatMessage(
        role: 'assistant',
        text: 'Namaste, $studentName! 🙏\n\n'
            'I am your personal **Laasya AI Learning Companion**.\n\n'
            'I can guide you on:\n'
            '• Daily practice drills and warmup routines\n'
            '• Classical mudras, adavus, and vocal exercises\n'
            '• Class schedule, batch timings, and holiday alerts\n'
            '• Event video library & guru feedback questions\n\n'
            'What would you like assistance with today?',
        timestamp: DateTime.now(),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || _isLoading) return;

    final userMessage = ChatMessage(
      role: 'user',
      text: trimmed,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
      _isLoading = true;
    });
    _controller.clear();
    _scrollToBottom();

    try {
      final payload = {
        'messages': _messages.map((m) => {
          'role': m.role,
          'content': m.text,
        }).toList(),
      };

      final uri = Uri.parse('${ApiConstants.baseUrl}/api/ai-chat');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 8));

      String reply = '';
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        reply = data['reply']?.toString() ?? '';
      }

      if (reply.trim().isEmpty) {
        reply = _localKnowledgeReply(trimmed);
      }

      if (mounted) {
        setState(() {
          _messages.add(
            ChatMessage(
              role: 'assistant',
              text: reply,
              timestamp: DateTime.now(),
            ),
          );
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _messages.add(
            ChatMessage(
              role: 'assistant',
              text: _localKnowledgeReply(trimmed),
              timestamp: DateTime.now(),
            ),
          );
          _isLoading = false;
        });
        _scrollToBottom();
      }
    }
  }

  String _localKnowledgeReply(String query) {
    final q = query.toLowerCase();
    if (q.contains('practice') || q.contains('warm') || q.contains('drill')) {
      return '🧘 **Recommended Daily Practice Routine:**\n\n'
          '1. **Warm-Up (10 mins):** Neck rotations, arm circles, ankle stretching, and Suryanamaskar.\n'
          '2. **Technical Basics (20 mins):** Practice fundamental steps (Tatta Adavu / Natta Adavu for dance, or Sarali Varisai in 3 speeds for music).\n'
          '3. **Core Repertoire (25 mins):** Practice the specific item assigned by your Guru in your latest session.\n'
          '4. **Cool Down (5 mins):** Deep breathing and namaskaram.\n\n'
          'Consistent daily 45-minute practice yields the greatest artistic transformation!';
    } else if (q.contains('timing') || q.contains('schedule') || q.contains('class') || q.contains('time')) {
      return '⏰ **Academy Schedule & Timings:**\n\n'
          '• **Weekday Classes (Mon–Fri):** 08:30 AM – 08:30 PM\n'
          '• **Weekend Classes (Sat–Sun):** 07:30 AM – 08:30 PM\n\n'
          'You can see your enrolled batch timing directly in the **"Schedule"** tab of this app!';
    } else if (q.contains('mudra') || q.contains('dance') || q.contains('bharat')) {
      return '💃 **Classical Dance Foundations:**\n\n'
          '• **Asamyutta Hastas (Single Hand Mudras):** Pataka, Tripataka, Ardhapataka, Kartarimukha...\n'
          '• **Posture:** Maintain Aramandi (half-sit) with erect spine and focused eye movements (Drishti Bhedas).\n'
          '• Check the **"Videos"** library tab in the app to view monthly practice recordings shared by your Guru!';
    } else if (q.contains('vocal') || q.contains('carnatic') || q.contains('raga') || q.contains('music')) {
      return '🎶 **Carnatic Vocal Fundamentals:**\n\n'
          '• **Akaram Practice:** Sing basic swara exercises in Akaram to cultivate voice flexibility and resonance.\n'
          '• **Shruti Alignment:** Always align precisely with your Tanpura pitch (Sa - Pa - Sa).\n'
          '• **Tala Keeping:** Maintain steady hand counts with the appropriate Jaathi & Tala beats.';
    } else if (q.contains('attendance') || q.contains('leave') || q.contains('absent')) {
      return '📋 **Attendance Policy:**\n\n'
          '• Students should maintain at least **80% attendance** for annual showcase eligibility and certification.\n'
          '• When taking planned leave, please notify your Guru in advance through the Messages tab.';
    }

    return 'Namaste! 🙏 I am here to help you excel in your classical arts training.\n\n'
        'You can ask me about practice techniques, mudras, vocal exercises, syllabus, or academy batch schedules!';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF5F7),
      appBar: AppBar(
        backgroundColor: LaasyaColors.primary,
        elevation: 2,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: Color(0x26FFFFFF),
              child: Icon(Icons.auto_awesome, color: Color(0xFFFBF0B9), size: 18),
            ),
            SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Laasya AI Assistant',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '24/7 Practice & Learning Companion',
                    style: TextStyle(
                      color: Color(0xFFFBF0B9),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: Colors.white70, size: 22),
            tooltip: 'Clear Chat',
            onPressed: () {
              setState(() {
                _messages.clear();
                _initWelcomeMessage();
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages View
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg.role == 'user';

                return Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Row(
                    mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!isUser) ...[
                        const CircleAvatar(
                          radius: 16,
                          backgroundColor: LaasyaColors.primary,
                          child: Icon(Icons.smart_toy_rounded, color: Color(0xFFFBF0B9), size: 18),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isUser ? LaasyaColors.primary : Colors.white,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(16),
                              topRight: const Radius.circular(16),
                              bottomLeft: Radius.circular(isUser ? 16 : 4),
                              bottomRight: Radius.circular(isUser ? 4 : 16),
                            ),
                            border: Border.all(
                              color: isUser ? LaasyaColors.primary : const Color(0xFFE2D4DC),
                              width: 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                msg.text,
                                style: TextStyle(
                                  color: isUser ? Colors.white : const Color(0xFF220314),
                                  fontSize: 13,
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${msg.timestamp.hour.toString().padLeft(2, '0')}:${msg.timestamp.minute.toString().padLeft(2, '0')}',
                                style: TextStyle(
                                  color: isUser ? Colors.white70 : Colors.grey.shade500,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (isUser) ...[
                        const SizedBox(width: 8),
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: Colors.grey.shade300,
                          child: const Icon(Icons.person, color: LaasyaColors.primary, size: 18),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: LaasyaColors.primary,
                    ),
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Laasya AI is generating your response...',
                    style: TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ],
              ),
            ),

          // Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 6,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFFAF5F7),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFD4BAC7)),
                      ),
                      child: TextField(
                        controller: _controller,
                        textInputAction: TextInputAction.send,
                        onSubmitted: _sendMessage,
                        decoration: const InputDecoration(
                          hintText: 'Ask your AI assistant anything...',
                          hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(24),
                      onTap: _isLoading
                          ? null
                          : () {
                              final text = _controller.text;
                              if (text.trim().isNotEmpty) {
                                _sendMessage(text);
                              }
                            },
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: _isLoading ? Colors.grey.shade400 : LaasyaColors.primary,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: LaasyaColors.primary.withOpacity(0.25),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Center(
                          child: _isLoading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : const Icon(
                                  Icons.send_rounded,
                                  color: Color(0xFFFBF0B9),
                                  size: 20,
                                ),
                        ),
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
  }
}

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

  final List<String> _quickSuggestions = [
    '📚 What batches are assigned to me?',
    '📅 Do I have a class today?',
    '⏰ What is my next class?',
    '📆 My classes this week',
    '✨ Any extra or make-up classes?',
  ];

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
            'You can ask me:\n'
            '• "What batches are assigned to me?"\n'
            '• "Do I have a class today?"\n'
            '• "What is my next class?"\n'
            '• "What are my classes this week?"\n'
            '• "Are any extra or make-up classes available for me?"\n\n'
            'How may I assist your practice today?',
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
      final token = await SupabaseService().getAuthToken();

      if (token == null || token.isEmpty) {
        // Fallback to verified local cached student profile to prevent public-mode downgrade
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
        return;
      }

      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
        'X-Chat-Mode': 'student',
      };

      final payload = {
        'mode': 'student',
        'messages': _messages.map((m) => {
          'role': m.role,
          'content': m.text,
        }).toList(),
      };

      final uri = Uri.parse('${ApiConstants.baseUrl}/api/ai-chat');
      final res = await http.post(
        uri,
        headers: headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 15));

      String reply = '';
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        reply = data['reply']?.toString() ?? '';
      } else if (res.statusCode == 401) {
        reply = '🔒 **Session Expired or Sign-In Required**\n\n'
            'Your student session could not be verified or has expired. Please sign out and sign in again to view your personal timetable and assigned batches.';
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
    final profile = SupabaseService().currentUserProfile;
    final studentName = profile?['full_name']?.toString() ?? 'Disciple';
    final courses = (profile?['enrolled_courses'] as List<dynamic>?) ?? [];
    final q = query.toLowerCase();

    if (courses.isEmpty) {
      return 'Namaste, **$studentName**! 🙏\n\n'
          'You are currently not enrolled in an active batch. Please speak with academy administration or visit the reception desk to complete your batch allocation.';
    }

    if (q.contains('assigned') || q.contains('my batch') || q.contains('what batches') || q.contains('which batch') || q.contains('batches assigned')) {
      var resp = 'Namaste, **$studentName**! 🙏\n\n'
          '**Your Assigned Batches & Schedule:**\n\n';
      for (final c in courses) {
        resp += '• **${c['title']} — ${c['batch_name']}:** ${c['timings'] ?? 'Regular timing'}\n'
            '  📍 Venue: ${c['room'] ?? 'Studio'} | Guru: ${c['trainer_name'] ?? 'Assigned Guru'}\n';
      }
      return resp;
    }

    if (q.contains('today') || q.contains('class today')) {
      final now = DateTime.now();
      final weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      final todayName = weekdays[now.weekday - 1];

      final todayBatches = courses.where((c) {
        final days = c['days_of_week'];
        if (days is List) {
          return days.any((d) => d.toString().toLowerCase() == todayName.toLowerCase());
        }
        return false;
      }).toList();

      if (todayBatches.isNotEmpty) {
        var resp = 'Namaste, **$studentName**! 🙏\n\n'
            '**Yes, you have class today ($todayName):**\n\n';
        for (final b in todayBatches) {
          resp += '• **${b['title']} (${b['batch_name']}):** ${b['timings'] ?? 'Regular timing'}\n'
              '  📍 Venue: ${b['room'] ?? 'Studio'} | Guru: ${b['trainer_name'] ?? 'Faculty Guru'}\n';
        }
        return resp;
      } else {
        return 'Namaste, **$studentName**! 🙏\n\n'
            '**No classes are scheduled for you today ($todayName).**\n\n'
            'Your enrolled batches run on:\n'
            '${courses.map((c) => '• ${c['title']} (${c['batch_name']}): ${c['timings']}').join('\n')}';
      }
    } else if (q.contains('timing') || q.contains('schedule') || q.contains('batch')) {
      var resp = 'Namaste, **$studentName**! 🙏\n\n'
          '**Your Enrolled Batch Timetable:**\n\n';
      for (final c in courses) {
        resp += '• **${c['title']} (${c['batch_name']}):** ${c['timings']}\n'
            '  📍 Venue: ${c['room'] ?? 'Studio'} | Guru: ${c['trainer_name'] ?? 'Assigned Guru'}\n';
      }
      return resp;
    } else if (q.contains('extra') || q.contains('make-up') || q.contains('makeup') || q.contains('tally')) {
      return 'Namaste, **$studentName**! 🙏\n\n'
          'Extra and make-up classes are scheduled when regular sessions are impacted by holidays or Guru leave.\n\n'
          'Currently, no special make-up classes are pending for your batches. Regular classes follow your standard timetable.';
    } else if (q.contains('practice') || q.contains('warm') || q.contains('drill')) {
      return '🧘 **Recommended Daily Practice Routine:**\n\n'
          '1. **Warm-Up (10 mins):** Neck rotations, arm circles, ankle stretching, and Suryanamaskar.\n'
          '2. **Technical Basics (20 mins):** Practice fundamental steps (Tatta Adavu / Natta Adavu for dance, or Sarali Varisai in 3 speeds for music).\n'
          '3. **Core Repertoire (25 mins):** Practice the specific item assigned by your Guru in your latest session.\n'
          '4. **Cool Down (5 mins):** Deep breathing and namaskaram.\n\n'
          'Consistent daily 45-minute practice yields the greatest artistic transformation!';
    }

    return 'Namaste, **$studentName**! 🙏\n\n'
        'You can ask me about:\n'
        '• "What batches are assigned to me?"\n'
        '• "Do I have a class today?"\n'
        '• "What is my next class?"\n'
        '• "What are my classes this week?"\n'
        '• "What are my batch timings?"';
  }

  Widget _buildFormattedMessage(String text, bool isUser) {
    if (isUser) {
      return Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          height: 1.45,
        ),
      );
    }

    final lines = text.split('\n');
    final widgets = <Widget>[];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i].trim();
      if (line.isEmpty) {
        widgets.add(const SizedBox(height: 5));
        continue;
      }

      if (line == '---' || line == '***' || line == '___') {
        widgets.add(const Divider(color: Color(0xFFE2D4DC), height: 12));
        continue;
      }

      if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
        final headingText = line.replaceFirst(RegExp(r'^#+\s*'), '');
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 6, bottom: 3),
            child: Text(
              headingText,
              style: const TextStyle(
                color: LaasyaColors.primary,
                fontSize: 13.5,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        );
        continue;
      }

      final isBullet = line.startsWith('• ') || line.startsWith('* ') || line.startsWith('- ');
      final content = isBullet ? line.substring(2) : line;

      final spans = <TextSpan>[];
      final regex = RegExp(r'\*\*(.*?)\*\*');
      int lastIndex = 0;

      for (final match in regex.allMatches(content)) {
        if (match.start > lastIndex) {
          spans.add(TextSpan(
            text: content.substring(lastIndex, match.start),
            style: const TextStyle(color: Color(0xFF220314), fontSize: 13, height: 1.4),
          ));
        }
        spans.add(TextSpan(
          text: match.group(1),
          style: const TextStyle(
            color: LaasyaColors.primary,
            fontWeight: FontWeight.bold,
            fontSize: 13,
            height: 1.4,
          ),
        ));
        lastIndex = match.end;
      }

      if (lastIndex < content.length) {
        spans.add(TextSpan(
          text: content.substring(lastIndex),
          style: const TextStyle(color: Color(0xFF220314), fontSize: 13, height: 1.4),
        ));
      }

      if (isBullet) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 1.5, bottom: 1.5, left: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 6, right: 6),
                  child: CircleAvatar(
                    radius: 2.5,
                    backgroundColor: LaasyaColors.primary,
                  ),
                ),
                Expanded(
                  child: RichText(text: TextSpan(children: spans)),
                ),
              ],
            ),
          ),
        );
      } else {
        widgets.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 1),
            child: RichText(text: TextSpan(children: spans)),
          ),
        );
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
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
              child: Icon(Icons.smart_toy_rounded, color: Color(0xFFFBF0B9), size: 18),
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
                              _buildFormattedMessage(msg.text, isUser),
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

          // Quick Suggestion Chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _quickSuggestions.map((suggestion) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ActionChip(
                      label: Text(
                        suggestion,
                        style: const TextStyle(
                          fontSize: 11,
                          color: LaasyaColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      backgroundColor: const Color(0xFFFAF5F7),
                      side: const BorderSide(color: Color(0xFFD4BAC7)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      onPressed: _isLoading ? null : () => _sendMessage(suggestion),
                    ),
                  );
                }).toList(),
              ),
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
                          hintText: 'Ask about your schedule, assigned batches, practice...',
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

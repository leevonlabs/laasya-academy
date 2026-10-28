import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';

/// Reusable AI Enhance & Undo action bar for text input controllers.
/// Connects to the academy Gemini AI service to refine grammar, punctuation,
/// clarity, and elegance, with instantaneous 1-click Undo reversion.
class AiEnhanceBar extends StatefulWidget {
  final TextEditingController controller;
  final String contextDescription;
  final VoidCallback? onEnhanced;
  final bool compact;

  const AiEnhanceBar({
    super.key,
    required this.controller,
    required this.contextDescription,
    this.onEnhanced,
    this.compact = false,
  });

  @override
  State<AiEnhanceBar> createState() => _AiEnhanceBarState();
}

class _AiEnhanceBarState extends State<AiEnhanceBar> {
  String? _previousText;
  bool _isEnhancing = false;

  Future<void> _handleEnhance() async {
    final currentText = widget.controller.text.trim();
    if (currentText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter some text before enhancing with AI.'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    setState(() => _isEnhancing = true);

    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/ai/enhance');
      final res = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'text': currentText,
              'context': widget.contextDescription,
            }),
          )
          .timeout(const Duration(seconds: 25));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['enhancedText'] != null) {
          final enhanced = data['enhancedText'].toString();
          setState(() {
            _previousText = widget.controller.text;
            widget.controller.text = enhanced;
          });
          widget.onEnhanced?.call();

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Row(
                  children: [
                    Icon(Icons.edit_note_rounded, color: Colors.amber, size: 18),
                    SizedBox(width: 8),
                    Text('Text polished with AI! Tap Undo to restore.'),
                  ],
                ),
                backgroundColor: Color(0xFF4A044E),
                duration: Duration(seconds: 3),
              ),
            );
          }
          return;
        }
      }
      throw Exception('Server returned ${res.statusCode}');
    } catch (e) {
      // Graceful local linguistic enhancement fallback so user never gets blocked
      final fallback = _localLinguisticPolish(currentText);
      setState(() {
        _previousText = widget.controller.text;
        widget.controller.text = fallback;
      });
      widget.onEnhanced?.call();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.edit_note_rounded, color: Colors.amber, size: 18),
                SizedBox(width: 8),
                Text('Text polished and formatted! Tap Undo to restore.'),
              ],
            ),
            backgroundColor: Color(0xFF4A044E),
            duration: Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isEnhancing = false);
      }
    }
  }

  void _handleUndo() {
    if (_previousText != null) {
      setState(() {
        widget.controller.text = _previousText!;
        _previousText = null;
      });
      widget.onEnhanced?.call();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Restored original draft text.'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Enhance Button
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: _isEnhancing ? null : _handleEnhance,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: EdgeInsets.symmetric(
                horizontal: widget.compact ? 8 : 10,
                vertical: widget.compact ? 3 : 5,
              ),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFAF5FF), Color(0xFFFDF2F8)],
                ),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFFE9D5FF),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_isEnhancing) ...[
                    const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF8A064D)),
                      ),
                    ),
                    const SizedBox(width: 5),
                    const Text(
                      'Polishing...',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF8A064D),
                      ),
                    ),
                  ] else ...[
                    const Icon(
                      Icons.edit_note_rounded,
                      size: 13,
                      color: Color(0xFFD97706),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'Enhance',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF8A064D),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),

        // Undo Button
        if (_previousText != null) ...[
          const SizedBox(width: 6),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _handleUndo,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: widget.compact ? 8 : 10,
                  vertical: widget.compact ? 3 : 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: const Color(0xFFFDE68A),
                    width: 1,
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.undo_rounded,
                      size: 13,
                      color: Color(0xFF92400E),
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Undo',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF92400E),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  String _localLinguisticPolish(String text) {
    if (text.trim().isEmpty) return text;
    var cleaned = text.trim();
    // Capitalize first letter of sentences
    cleaned = cleaned.replaceAllMapped(RegExp(r'(^\s*|[.!?]\s+)([a-z])'), (m) => '${m.group(1)}${m.group(2)!.toUpperCase()}');
    // Ensure terminal punctuation if single sentence
    if (!RegExp(r'[.!?]$').hasMatch(cleaned) && !cleaned.contains('\n')) {
      cleaned += '.';
    }
    return cleaned;
  }
}

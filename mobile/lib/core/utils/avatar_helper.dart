import 'dart:convert';
import 'package:flutter/material.dart';
import '../constants/api_constants.dart';

/// Resolves any image URL to a full network URL if it's relative
String resolveImageUrl(dynamic rawUrl) {
  if (rawUrl == null) return '';
  final s = rawUrl.toString().trim();
  if (s.isEmpty || s == 'null') return '';
  if (s.startsWith('/')) {
    return '${ApiConstants.baseUrl}$s';
  }
  return s;
}

ImageProvider? getAvatarImageProvider(dynamic rawUrl) {
  if (rawUrl == null) return null;
  final s = rawUrl.toString().trim();
  if (s.isEmpty || s == 'null') return null;

  try {
    if (s.startsWith('data:image/') || s.contains(';base64,')) {
      final commaIndex = s.indexOf(',');
      final base64Str = commaIndex != -1 ? s.substring(commaIndex + 1).trim() : s;
      final cleanBase64 = base64Str.replaceAll(RegExp(r'\s+'), '');
      final bytes = base64Decode(cleanBase64);
      return MemoryImage(bytes);
    }

    if (s.startsWith('http://') || s.startsWith('https://')) {
      return NetworkImage(s);
    }

    // Relative uploads path from ERP web backend
    if (s.startsWith('/')) {
      return NetworkImage('${ApiConstants.baseUrl}$s');
    }

    // Attempt raw base64 decode if long enough
    if (s.length > 100 && !s.contains(' ') && !s.contains('/')) {
      final cleanBase64 = s.replaceAll(RegExp(r'\s+'), '');
      final bytes = base64Decode(cleanBase64);
      return MemoryImage(bytes);
    }
  } catch (e) {
    debugPrint('[AvatarHelper] Error decoding avatar image: $e');
  }

  return null;
}

/// Reusable avatar widget that handles base64 data URIs, network images, and fallback initials
class AppAvatar extends StatelessWidget {
  final dynamic avatarUrl;
  final String? name;
  final double radius;
  final Color? backgroundColor;
  final Color? textColor;
  final Widget? fallbackIcon;
  final Border? border;
  final VoidCallback? onTap;

  const AppAvatar({
    super.key,
    required this.avatarUrl,
    this.name,
    this.radius = 20,
    this.backgroundColor,
    this.textColor,
    this.fallbackIcon,
    this.border,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final imageProvider = getAvatarImageProvider(avatarUrl);
    final initials = (name ?? '')
        .trim()
        .split(' ')
        .where((p) => p.isNotEmpty)
        .map((p) => p[0])
        .take(2)
        .join()
        .toUpperCase();

    Widget avatar = CircleAvatar(
      radius: radius,
      backgroundColor: backgroundColor ?? const Color(0xFFFFF2F8),
      backgroundImage: imageProvider,
      child: imageProvider == null
          ? (initials.isNotEmpty
              ? Text(
                  initials,
                  style: TextStyle(
                    fontSize: radius * 0.75,
                    fontWeight: FontWeight.bold,
                    color: textColor ?? const Color(0xFF8A064D),
                  ),
                )
              : (fallbackIcon ?? Icon(Icons.person_rounded, size: radius * 1.1, color: textColor ?? const Color(0xFF8A064D))))
          : null,
    );

    if (border != null) {
      avatar = Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: border,
        ),
        child: avatar,
      );
    }

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: avatar,
      );
    }

    return avatar;
  }
}

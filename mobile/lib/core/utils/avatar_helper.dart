import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/api_constants.dart';

/// Resolves any image URL to a full network URL if it's relative
String resolveImageUrl(dynamic rawUrl) {
  if (rawUrl == null) return '';
  final s = rawUrl.toString().trim();
  if (s.isEmpty || s == 'null') return '';
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  if (s.startsWith('/')) {
    return '${ApiConstants.baseUrl}$s';
  }
  if (s.startsWith('uploads/')) {
    return '${ApiConstants.baseUrl}/$s';
  }
  if (s.startsWith('avatars/')) {
    return '${ApiConstants.baseUrl}/uploads/$s';
  }
  if (s.contains('.') && !s.contains(' ') && (s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.png') || s.endsWith('.webp') || s.endsWith('.gif'))) {
    return '${ApiConstants.baseUrl}/uploads/avatars/$s';
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

    final resolved = resolveImageUrl(s);
    if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
      if (kIsWeb) {
        return NetworkImage(resolved);
      }
      return CachedNetworkImageProvider(resolved);
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

  // Statically cache base64 decoded bytes to eliminate stutter on re-renders
  static final Map<String, Uint8List> _bytesCache = {};

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
    // 1. Build initial fallback badge
    final initials = (name ?? '')
        .trim()
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .map((p) => p[0])
        .take(2)
        .join()
        .toUpperCase();

    final fallbackWidget = Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        color: backgroundColor ?? const Color(0xFFFFF2F8),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: initials.isNotEmpty
          ? Text(
              initials,
              style: TextStyle(
                fontSize: radius * 0.72,
                fontWeight: FontWeight.bold,
                color: textColor ?? const Color(0xFF8A064D),
                letterSpacing: 0.5,
              ),
            )
          : (fallbackIcon ?? Icon(Icons.person_rounded, size: radius * 1.1, color: textColor ?? const Color(0xFF8A064D))),
    );

    // 2. Check if avatarUrl is actually present
    if (avatarUrl == null) {
      return _wrapAvatar(fallbackWidget);
    }
    final rawStr = avatarUrl.toString().trim();
    if (rawStr.isEmpty || rawStr == 'null') {
      return _wrapAvatar(fallbackWidget);
    }

    final resolved = resolveImageUrl(rawStr);
    final isDataUri = rawStr.contains(';base64,') || rawStr.startsWith('data:image');
    final isNetwork = resolved.startsWith('http://') || resolved.startsWith('https://');

    Widget avatar;
    if (isDataUri) {
      try {
        final commaIdx = rawStr.indexOf(',');
        final b64 = commaIdx != -1 ? rawStr.substring(commaIdx + 1).trim() : rawStr;
        Uint8List? cached = _bytesCache[b64];
        if (cached == null) {
          cached = base64Decode(b64.replaceAll(RegExp(r'\s+'), ''));
          if (_bytesCache.length > 50) _bytesCache.remove(_bytesCache.keys.first);
          _bytesCache[b64] = cached;
        }
        avatar = ClipOval(
          child: Image.memory(
            cached,
            width: radius * 2,
            height: radius * 2,
            fit: BoxFit.cover,
            gaplessPlayback: true,
            errorBuilder: (_, __, ___) => fallbackWidget,
          ),
        );
      } catch (_) {
        avatar = fallbackWidget;
      }
    } else if (isNetwork) {
      if (kIsWeb) {
        avatar = ClipOval(
          child: Image.network(
            resolved,
            width: radius * 2,
            height: radius * 2,
            fit: BoxFit.cover,
            gaplessPlayback: true,
            errorBuilder: (_, __, ___) => fallbackWidget,
          ),
        );
      } else {
        avatar = ClipOval(
          child: CachedNetworkImage(
            imageUrl: resolved,
            width: radius * 2,
            height: radius * 2,
            fit: BoxFit.cover,
            placeholder: (_, __) => fallbackWidget,
            errorWidget: (_, __, ___) => fallbackWidget,
          ),
        );
      }
    } else {
      avatar = fallbackWidget;
    }

    return _wrapAvatar(avatar);
  }

  Widget _wrapAvatar(Widget avatar) {
    Widget res = avatar;
    if (border != null) {
      res = Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: border,
        ),
        child: res,
      );
    }

    if (onTap != null) {
      res = GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: res,
      );
    }

    return RepaintBoundary(child: res);
  }
}

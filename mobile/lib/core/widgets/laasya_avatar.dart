import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../constants/api_constants.dart';
import '../constants/colors.dart';

/// Rock-solid, flicker-free avatar widget that prevents "glittering"
/// caused by frequent parent rebuilds, timer ticks, or banner auto-scrolls.
/// 
/// Key stability features:
/// 1. Decoded Base64 bytes are statically cached so images are never re-decoded on rebuilds.
/// 2. [gaplessPlayback] is enabled so frames do not blank out between frame paints.
/// 3. Wrapped in a [RepaintBoundary] so parent repaint cycles do not force the avatar to repaint.
class LaasyaAvatar extends StatelessWidget {
  final String? avatarUrl;
  final double size;
  final VoidCallback? onTap;
  final Color borderColor;
  final double borderWidth;
  final bool showShadow;
  final Widget? fallback;

  // Statically cache decoded base64 bytes to eliminate re-decoding and frame flickering
  static final Map<String, Uint8List> _bytesCache = {};

  const LaasyaAvatar({
    super.key,
    required this.avatarUrl,
    this.size = 58,
    this.onTap,
    this.borderColor = LaasyaColors.accentGold,
    this.borderWidth = 2.0,
    this.showShadow = true,
    this.fallback,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: borderColor, width: borderWidth),
            boxShadow: showShadow
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: ClipOval(
            child: _buildImageContent(),
          ),
        ),
      ),
    );
  }

  Widget _buildImageContent() {
    if (avatarUrl == null || avatarUrl!.trim().isEmpty) {
      return _buildFallback();
    }

    final trimmed = avatarUrl!.trim();

    // 1. Base64 Data URI
    if (trimmed.startsWith('data:image')) {
      try {
        final commaIdx = trimmed.indexOf(',');
        final base64Str = commaIdx != -1 ? trimmed.substring(commaIdx + 1) : trimmed;
        
        Uint8List? cachedBytes = _bytesCache[base64Str];
        if (cachedBytes == null) {
          cachedBytes = base64Decode(base64Str);
          // Keep cache bounded
          if (_bytesCache.length > 50) {
            _bytesCache.remove(_bytesCache.keys.first);
          }
          _bytesCache[base64Str] = cachedBytes;
        }

        return Image.memory(
          cachedBytes,
          fit: BoxFit.cover,
          width: size,
          height: size,
          gaplessPlayback: true,
          errorBuilder: (_, __, ___) => _buildFallback(),
        );
      } catch (_) {
        return _buildFallback();
      }
    }

    // 2. HTTP / HTTPS Network Image
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return Image.network(
        trimmed,
        fit: BoxFit.cover,
        width: size,
        height: size,
        gaplessPlayback: true,
        cacheWidth: (size * 2).round(),
        cacheHeight: (size * 2).round(),
        errorBuilder: (_, __, ___) => _buildFallback(),
      );
    }

    // 2b. Relative backend URL (e.g. /uploads/avatars/...)
    if (trimmed.startsWith('/')) {
      return Image.network(
        '${ApiConstants.baseUrl}$trimmed',
        fit: BoxFit.cover,
        width: size,
        height: size,
        gaplessPlayback: true,
        cacheWidth: (size * 2).round(),
        cacheHeight: (size * 2).round(),
        errorBuilder: (_, __, ___) => _buildFallback(),
      );
    }

    // 3. Local Asset
    if (trimmed.startsWith('assets/')) {
      return Image.asset(
        trimmed,
        fit: BoxFit.cover,
        width: size,
        height: size,
        gaplessPlayback: true,
        errorBuilder: (_, __, ___) => _buildFallback(),
      );
    }

    return _buildFallback();
  }

  Widget _buildFallback() {
    if (fallback != null) return fallback!;
    return Container(
      width: size,
      height: size,
      color: const Color(0xFF590231),
      child: Center(
        child: Icon(
          Icons.person_rounded,
          color: LaasyaColors.accentGold,
          size: size * 0.58,
        ),
      ),
    );
  }
}

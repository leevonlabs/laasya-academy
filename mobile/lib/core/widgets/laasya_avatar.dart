import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/api_constants.dart';
import '../constants/colors.dart';

/// Rock-solid, flicker-free avatar widget that prevents "glittering"
/// caused by frequent parent rebuilds, timer ticks, or banner auto-scrolls.
/// 
/// Key stability features:
/// 1. Decoded Base64 bytes are statically cached so images are never re-decoded on rebuilds.
/// 2. [gaplessPlayback] is enabled so frames do not blank out between frame paints.
/// 3. On Flutter Web, leverages native browser image pipeline for instant zero-latency caching.
/// 4. Provides elegant initials badges matching Admin ERP when photo is absent.
/// 5. Wrapped in a [RepaintBoundary] so parent repaint cycles do not force the avatar to repaint.
class LaasyaAvatar extends StatelessWidget {
  final String? avatarUrl;
  final String? name;
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
    this.name,
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
    if (avatarUrl == null || avatarUrl!.trim().isEmpty || avatarUrl!.trim() == 'null') {
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

    // 2. HTTP / HTTPS Network Image (Persistent Browser & Disk Caching)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (kIsWeb) {
        return Image.network(
          trimmed,
          fit: BoxFit.cover,
          width: size,
          height: size,
          gaplessPlayback: true,
          errorBuilder: (_, __, ___) => _buildFallback(),
        );
      }
      return CachedNetworkImage(
        imageUrl: trimmed,
        fit: BoxFit.cover,
        width: size,
        height: size,
        placeholder: (_, __) => _buildFallback(),
        errorWidget: (_, __, ___) => _buildFallback(),
      );
    }

    // 2b. Relative backend URL (e.g. /uploads/avatars/...)
    if (trimmed.startsWith('/')) {
      final fullUrl = '${ApiConstants.baseUrl}$trimmed';
      if (kIsWeb) {
        return Image.network(
          fullUrl,
          fit: BoxFit.cover,
          width: size,
          height: size,
          gaplessPlayback: true,
          errorBuilder: (_, __, ___) => _buildFallback(),
        );
      }
      return CachedNetworkImage(
        imageUrl: fullUrl,
        fit: BoxFit.cover,
        width: size,
        height: size,
        placeholder: (_, __) => _buildFallback(),
        errorWidget: (_, __, ___) => _buildFallback(),
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

    // Extract 1-2 uppercase initials from name if available (matches Admin ERP)
    String initials = '';
    if (name != null && name!.trim().isNotEmpty) {
      final parts = name!.trim().split(RegExp(r'\s+'));
      if (parts.length >= 2 && parts[0].isNotEmpty && parts[1].isNotEmpty) {
        initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else if (parts.isNotEmpty && parts[0].isNotEmpty) {
        initials = parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
      }
    }

    return Container(
      width: size,
      height: size,
      color: const Color(0xFF590231),
      child: Center(
        child: initials.isNotEmpty
            ? Text(
                initials,
                style: TextStyle(
                  color: LaasyaColors.accentGold,
                  fontSize: size * 0.40,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              )
            : Icon(
                Icons.person_rounded,
                color: LaasyaColors.accentGold,
                size: size * 0.58,
              ),
      ),
    );
  }
}

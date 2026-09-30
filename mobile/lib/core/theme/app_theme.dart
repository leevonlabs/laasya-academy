import 'package:flutter/material.dart';
import '../constants/colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: LaasyaColors.background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: LaasyaColors.primary,
        primary: LaasyaColors.primary,
        secondary: LaasyaColors.accentGold,
        surface: LaasyaColors.cardSurface,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: LaasyaColors.primaryDark,
        foregroundColor: LaasyaColors.textLight,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: LaasyaColors.textLight,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: LaasyaColors.cardSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: LaasyaColors.border, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: LaasyaColors.primary,
          foregroundColor: LaasyaColors.textLight,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: LaasyaColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: LaasyaColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: LaasyaColors.primary, width: 2),
        ),
        labelStyle: const TextStyle(color: LaasyaColors.textMuted, fontSize: 13),
      ),
    );
  }
}

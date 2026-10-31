import 'package:flutter/foundation.dart';

class SupabaseConstants {
  static const String devSupabaseUrl = 'https://bhpqzrcohjigkkpmcdsy.supabase.co';
  static const String prodSupabaseUrl = 'https://bhpqzrcohjigkkpmcdsy.supabase.co';

  /// Dynamically resolves production Supabase (bhpqzrcohjigkkpmcdsy).
  static String get supabaseUrl {
    const fromEnv = String.fromEnvironment('SUPABASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;

    return prodSupabaseUrl;
  }

  // Set your Supabase anon public key here (or pass via environment)
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_YYNMbpP8q7I3x3Jq78RiaQ_UB_6KKWN',
  );
}

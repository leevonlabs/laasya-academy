class SupabaseConstants {
  static const String supabaseUrl = 'https://kumbtvmjpmjtmoefddux.supabase.co';
  
  // Set your Supabase anon public key here (or pass via environment)
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_YYNMbpP8q7I3x3Jq78RiaQ_UB_6KKWN',
  );
}

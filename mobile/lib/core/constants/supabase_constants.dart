class SupabaseConstants {
  static const String supabaseUrl = 'https://bhpqzrcohjigkkpmcdsy.supabase.co';
  
  // Set your Supabase anon public key here (or pass via environment)
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
  );
}

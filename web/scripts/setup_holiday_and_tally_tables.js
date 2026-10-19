const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  console.log('Connecting to database...');

  // Ensure announcements has publish_time
  await pool.query(`
    ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS publish_time TEXT DEFAULT '00:00:00';
  `);
  console.log('Verified publish_time on public.announcements.');

  // 1. Create holiday_alerts table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.holiday_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      holiday_date DATE NOT NULL,
      title TEXT NOT NULL,
      reason TEXT NOT NULL,
      target_course_ids JSONB DEFAULT '[]'::jsonb,
      target_course_titles JSONB DEFAULT '[]'::jsonb,
      target_batch_ids JSONB DEFAULT '[]'::jsonb,
      target_batch_names JSONB DEFAULT '[]'::jsonb,
      affected_guru_ids JSONB DEFAULT '[]'::jsonb,
      affected_guru_names JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'Scheduled',
      is_broadcast_sent BOOLEAN DEFAULT true,
      created_by TEXT DEFAULT 'Admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Created or verified public.holiday_alerts table.');

  // 2. Create tally_classes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.tally_classes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      holiday_alert_id UUID REFERENCES public.holiday_alerts(id) ON DELETE SET NULL,
      batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
      batch_name TEXT NOT NULL,
      batch_code TEXT,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      course_title TEXT NOT NULL,
      course_code TEXT,
      trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
      trainer_name TEXT NOT NULL,
      original_date DATE,
      rescheduled_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      room_or_hall TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'Scheduled',
      students_count INT DEFAULT 0,
      is_notified BOOLEAN DEFAULT true,
      created_by TEXT DEFAULT 'Admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Created or verified public.tally_classes table.');

  await pool.query(`
    ALTER TABLE public.tally_classes ADD COLUMN IF NOT EXISTS cancellation_type TEXT DEFAULT 'holiday';
    ALTER TABLE public.tally_classes ADD COLUMN IF NOT EXISTS absent_guru_name TEXT;
  `);
  console.log('Added cancellation_type and absent_guru_name to public.tally_classes.');

  // 3. Create guru_absences table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.guru_absences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
      trainer_name TEXT NOT NULL,
      batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
      batch_name TEXT NOT NULL,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      course_title TEXT NOT NULL,
      absence_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'Pending Reschedule',
      tally_class_id UUID REFERENCES public.tally_classes(id) ON DELETE SET NULL,
      created_by TEXT DEFAULT 'Admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Created or verified public.guru_absences table.');

  // Check RLS
  await pool.query(`
    ALTER TABLE public.holiday_alerts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tally_classes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.guru_absences ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow all for authenticated on holiday_alerts" ON public.holiday_alerts;
    CREATE POLICY "Allow all for authenticated on holiday_alerts" ON public.holiday_alerts
      FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow all for authenticated on tally_classes" ON public.tally_classes;
    CREATE POLICY "Allow all for authenticated on tally_classes" ON public.tally_classes
      FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow all for authenticated on guru_absences" ON public.guru_absences;
    CREATE POLICY "Allow all for authenticated on guru_absences" ON public.guru_absences
      FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log('Configured RLS policies.');

  await pool.end();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error setting up tables:', err);
  process.exit(1);
});

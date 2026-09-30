import { query } from '../lib/db';

async function main() {
  // 1. Add monthly_salary to trainers
  await query('ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC DEFAULT 25000');
  console.log('Added monthly_salary to trainers');

  // 2. Create rooms table
  await query(`
    CREATE TABLE IF NOT EXISTS public.rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      capacity INT DEFAULT 25,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('Created rooms table');

  // 3. Populate initial rooms from distinct rooms in batches
  const batchRooms = await query<{ room_or_hall: string }>('SELECT DISTINCT room_or_hall FROM public.batches WHERE room_or_hall IS NOT NULL AND room_or_hall != \'\'');
  const defaultRooms = [
    'Natya Mandapam (Room 101)',
    'Vindhyagiri Studio 1',
    'Vindhyagiri Studio 2',
    'Sangeetha Shala (Room 102)',
    'Chitrakala Hall (Art Studio)',
    'Yoga & Dhyana Pavilion',
    'Kathak Studio A',
    'Kalaripayattu Arena',
    'Chess & Mind Lab'
  ];
  const allRooms = Array.from(new Set([...defaultRooms, ...batchRooms.map(r => r.room_or_hall)]));
  for (const r of allRooms) {
    if (r && r.trim()) {
      await query('INSERT INTO public.rooms (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [r.trim()]);
    }
  }
  const count = await query('SELECT COUNT(*) as count FROM public.rooms');
  console.log('Rooms total count:', count[0].count);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});

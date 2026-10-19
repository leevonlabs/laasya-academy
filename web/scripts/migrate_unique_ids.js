const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('1. Adding columns if not exist...');
  await pool.query('ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS code text;');
  await pool.query('ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS guru_id text;');
  await pool.query('ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS code text;');

  console.log('2. Normalizing course codes...');
  const coursesRes = await pool.query('SELECT id, title, code FROM public.courses ORDER BY title ASC');
  const courseCodeMap = {};
  
  for (const c of coursesRes.rows) {
    const clean = c.title.trim().toLowerCase();
    const firstWord = clean.split(/\s+/)[0].replace(/[^a-z0-9]/g, '');
    let baseCode = firstWord.slice(0, 4);
    if (baseCode.length < 3) baseCode = clean.replace(/[^a-z0-9]/g, '').slice(0, 4);
    if (!baseCode) baseCode = 'crs';

    if (clean === 'art and craft') baseCode = 'art';
    if (clean === 'instrument classes') baseCode = 'inst';
    if (clean === 'semi classical') baseCode = 'semi';
    if (clean === 'western dance') baseCode = 'west';

    let finalCode = baseCode;
    let counter = 2;
    while (Object.values(courseCodeMap).includes(finalCode)) {
      finalCode = `${baseCode}${counter}`;
      counter++;
    }
    courseCodeMap[c.id] = finalCode;
    await pool.query('UPDATE public.courses SET code = $1 WHERE id = $2', [finalCode, c.id]);
    console.log(`   Course: ${c.title} -> ${finalCode}`);
  }

  console.log('3. Backfilling batch codes based on course code...');
  const batchesRes = await pool.query('SELECT id, name, course_id FROM public.batches ORDER BY course_id, created_at ASC, name ASC');
  const courseBatchCounters = {};
  for (const b of batchesRes.rows) {
    const cCode = courseCodeMap[b.course_id] || 'bat';
    courseBatchCounters[b.course_id] = (courseBatchCounters[b.course_id] || 0) + 1;
    const batchCode = `${cCode}-${courseBatchCounters[b.course_id]}`;
    await pool.query('UPDATE public.batches SET code = $1 WHERE id = $2', [batchCode, b.id]);
    console.log(`   Batch: ${b.name} (${cCode}) -> ${batchCode}`);
  }

  console.log('4. Backfilling guru IDs...');
  const trainersRes = await pool.query('SELECT t.id, p.full_name FROM public.trainers t JOIN public.profiles p ON p.id = t.profile_id ORDER BY t.created_at ASC, p.full_name ASC');
  for (let i = 0; i < trainersRes.rows.length; i++) {
    const t = trainersRes.rows[i];
    const guruId = `GURU-${String(i + 1).padStart(3, '0')}`;
    await pool.query('UPDATE public.trainers SET guru_id = $1, code = $1 WHERE id = $2', [guruId, t.id]);
    console.log(`   Guru: ${t.full_name} -> ${guruId}`);
  }

  console.log('Migration completed successfully!');
  await pool.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});

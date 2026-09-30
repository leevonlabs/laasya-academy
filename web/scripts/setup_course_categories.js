const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  // Create course_categories table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.course_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('course_categories table verified/created');

  // Insert default categories
  const defaultCats = [
    'Classical Dance',
    'Modern Dance & Fitness',
    'Vocal & Music',
    'Musical Instruments',
    'Martial Arts',
    'Fine Arts',
    'Mind Sports'
  ];

  for (const cat of defaultCats) {
    await client.query(`
      INSERT INTO public.course_categories (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING;
    `, [cat]);
  }

  // Also insert any categories currently present in courses
  const existingCourses = await client.query('SELECT DISTINCT category FROM public.courses WHERE category IS NOT NULL AND category != \'\'');
  for (const row of existingCourses.rows) {
    if (row.category && row.category.trim()) {
      await client.query(`
        INSERT INTO public.course_categories (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING;
      `, [row.category.trim()]);
    }
  }

  const result = await client.query('SELECT * FROM public.course_categories ORDER BY name');
  console.log('Categories in DB:', result.rows.map(r => r.name));

  await client.end();
}

run().catch(console.error);

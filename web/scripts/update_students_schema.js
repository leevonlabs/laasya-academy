const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await pool.query(`
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_relation text DEFAULT 'Parent';
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address text DEFAULT 'Kannamangala, Bangalore';
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_contact text;
  `);
  console.log('Columns added or already exist!');

  // Update existing students with realistic addresses and relations
  await pool.query(`
    UPDATE public.students
    SET parent_relation = CASE 
          WHEN id::text LIKE '%1%' THEN 'Mother'
          WHEN id::text LIKE '%2%' THEN 'Father'
          WHEN id::text LIKE '%3%' THEN 'Father'
          WHEN id::text LIKE '%4%' THEN 'Mother'
          ELSE 'Guardian'
        END,
        address = CASE 
          WHEN id::text LIKE '%1%' THEN 'Flat 304, Prestige Willow, Whitefield, Bangalore - 560066'
          WHEN id::text LIKE '%2%' THEN '#42, 3rd Cross, Doddabanahalli, Kannamangala, Bangalore - 560067'
          WHEN id::text LIKE '%3%' THEN 'Villa 12, Chaithanya Smaran, Hoskote Road, Bangalore - 560067'
          WHEN id::text LIKE '%4%' THEN 'Apt 201, Brigade Cosmopolis, ITPL Main Road, Bangalore - 560066'
          ELSE '2nd Main, Seegehalli, Kadugodi, Bangalore - 560067'
        END,
        parent_contact = COALESCE(parent_contact, emergency_contact, '+91 98450 12345')
    WHERE parent_relation IS NULL OR parent_relation = 'Parent';
  `);
  console.log('Existing students updated with relations and addresses!');

  const { rows } = await pool.query(`
    SELECT s.id, s.roll_number, p.full_name, s.parent_name, s.parent_relation, s.parent_contact, s.address
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    LIMIT 5;
  `);
  console.log('Sample updated students:', rows);

  await pool.end();
}

main().catch(console.error);

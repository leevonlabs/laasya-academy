const { Pool } = require('pg');
const pool = 
const fs = require('fs');
const path = require('path');
let dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl) {
  try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
      }
    }
  } catch (_) {}
}
if (!dbUrl) {
  throw new Error('DATABASE_URL is not configured in process.env or web/.env.local');
}

new Pool({
  connectionString: dbUrl,
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

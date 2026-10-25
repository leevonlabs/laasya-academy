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

const titles = {
  'Amos P Ovung': 'Director & Multi-Instrumentalist',
  'Shahil Patro': 'Senior Music Mentor (Trinity / RSL)',
  'Shri H. Manikandan': 'Carnatic Vocal Guru (Sangeetha Acharya)',
  'Smt. Anusha Sumesh': 'Bharatanatyam Master & Academy Founder',
  'Pramod T. Peethambaran': 'Choreographer & Natyamandra Founder',
  'Nandhana': 'Bharatanatyam Soloist',
  'Sruthy Ramesh': 'Mohiniyattam & Classical Dance Specialist',
  'Vijay Kumar Olekar': 'Chief Karate Master (2nd Dan Black Belt)',
  'Dipayan Sarkar': 'Senior Visual Artist (MFA Santiniketan)',
  'Ranjith Kumar S J': 'Acrobatics, Gymnastics & Fitness Coach',
  'Vrushabh Prakash Owhal': 'Kalaripayattu & Martial Arts Instructor',
  'Karthik R': 'Lead Choreographer & Hip-Hop Specialist',
  'Sai Krishna': 'Chess Coach & FIDE Rated Player',
  'Sathish Kale': 'Yoga Acharya & Wellness Specialist'
};

async function run() {
  for (const [name, title] of Object.entries(titles)) {
    const res = await pool.query(`
      UPDATE public.trainers
      SET display_title = $1
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE full_name ILIKE $2
      )
    `, [title, '%' + name + '%']);
    console.log(`Updated ${name} -> ${title} (${res.rowCount} row)`);
  }
  await pool.end();
}

run().catch(console.error);

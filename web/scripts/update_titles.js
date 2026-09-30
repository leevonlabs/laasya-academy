const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
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

/**
 * Production Readiness Database Migration & Seed Script
 * - Exactly 18 Courses
 * - Exactly 4 Rooms
 * - Exactly 20 Gurus (Trainers) with Real Human Portrait Photos & Passwords (Guru@123)
 * - Exactly 400 Students with Real Human Portrait Photos & Passwords (Student@123)
 * - Batches for All 18 Courses mapped to Gurus and Rooms
 * - Batch Enrollments for all 400 students
 * - Clear Timetable data (class_sessions) for current month
 * - Supabase Health & Storage Analysis
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let dbUrl = '';
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Helper for Auth Users
async function getOrCreateAuthUser(client, email, phone, fullName, role, defaultPassword, extraMeta = {}) {
  let res = await client.query('SELECT id FROM auth.users WHERE phone = $1 OR (email IS NOT NULL AND email = $2) LIMIT 1', [phone, email]);
  let userId;
  
  if (res.rows.length > 0) {
    userId = res.rows[0].id;
  } else {
    let pRes = await client.query('SELECT id FROM public.profiles WHERE phone = $1 OR email = $2 LIMIT 1', [phone, email]);
    if (pRes.rows.length > 0) {
      userId = pRes.rows[0].id;
    } else {
      userId = crypto.randomUUID();
    }
  }

  const meta = JSON.stringify({ full_name: fullName, role, phone, ...extraMeta });

  await client.query(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, phone, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data, is_sso_user, is_anonymous, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, $3,
      crypt($4, gen_salt('bf')), NOW(),
      $5::jsonb,
      '{"provider":"email","providers":["email"]}'::jsonb, false, false, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      encrypted_password = crypt($4, gen_salt('bf')),
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();
  `, [userId, email, phone, defaultPassword, meta]);

  return userId;
}

// -------------------------------------------------------------
// Real Human Photo Sources (Unsplash & RandomUser)
// -------------------------------------------------------------
const FEMALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&h=400&q=80',
];

const MALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1517070208541-6ddc4d3efbcb?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1508341591423-4347099e1f19?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=400&h=400&q=80',
  'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=400&h=400&q=80',
];

function getRealPortrait(gender, index) {
  if (gender === 'female') {
    if (index % 2 === 0) {
      return FEMALE_PORTRAITS[index % FEMALE_PORTRAITS.length];
    } else {
      const id = ((index * 7) % 95) + 1;
      return `https://randomuser.me/api/portraits/women/${id}.jpg`;
    }
  } else {
    if (index % 2 === 0) {
      return MALE_PORTRAITS[index % MALE_PORTRAITS.length];
    } else {
      const id = ((index * 7) % 95) + 1;
      return `https://randomuser.me/api/portraits/men/${id}.jpg`;
    }
  }
}

// -------------------------------------------------------------
// Course Definitions (18 Courses)
// -------------------------------------------------------------
const COURSES = [
  { code: 'bhar', title: 'Bharatanatyam', category: 'Classical Dance', fee: 2500, room: 'Natya Mandapam (Room 101)', image: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80' },
  { code: 'kuch', title: 'Kuchupudi', category: 'Classical Dance', fee: 2500, room: 'Natya Mandapam (Room 101)', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80' },
  { code: 'mohi', title: 'Mohiniyatam', category: 'Classical Dance', fee: 2500, room: 'Natya Mandapam (Room 101)', image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80' },
  { code: 'semi', title: 'Semi Classical', category: 'Classical Dance', fee: 2200, room: 'Natya Mandapam (Room 101)', image: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80' },
  { code: 'west', title: 'Western Dance', category: 'Contemporary Dance', fee: 2200, room: 'Natya Mandapam (Room 101)', image: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80' },
  { code: 'carn', title: 'Carnatic Music', category: 'Classical Music', fee: 2500, room: 'Sangeetha Shala (Room 102)', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80' },
  { code: 'keyb', title: 'Keyboard', category: 'Musical Instruments', fee: 2400, room: 'Sangeetha Shala (Room 102)', image: 'https://images.unsplash.com/photo-1520523839898-5071282543e2?auto=format&fit=crop&w=800&q=80' },
  { code: 'guit', title: 'Guitar', category: 'Musical Instruments', fee: 2400, room: 'Sangeetha Shala (Room 102)', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80' },
  { code: 'viol', title: 'Violin', category: 'Musical Instruments', fee: 2600, room: 'Sangeetha Shala (Room 102)', image: 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=800&q=80' },
  { code: 'ukul', title: 'Ukulele', category: 'Musical Instruments', fee: 2200, room: 'Sangeetha Shala (Room 102)', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80' },
  { code: 'draw', title: 'Drawing', category: 'Visual Arts', fee: 1800, room: 'Chitrakala Hall (Room 103)', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
  { code: 'art', title: 'Art and Craft', category: 'Fine Arts', fee: 1800, room: 'Chitrakala Hall (Room 103)', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80' },
  { code: 'ches', title: 'Chess', category: 'Mind Sports', fee: 2000, room: 'Chitrakala Hall (Room 103)', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80' },
  { code: 'kala', title: 'Kalaripayattu', category: 'Martial Arts', fee: 2400, room: 'Veera Kalari Koodam (Room 104)', image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80' },
  { code: 'kara', title: 'Karate', category: 'Martial Arts', fee: 2200, room: 'Veera Kalari Koodam (Room 104)', image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80' },
  { code: 'yoga', title: 'Yoga', category: 'Wellness & Fitness', fee: 2000, room: 'Veera Kalari Koodam (Room 104)', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80' },
  { code: 'zumb', title: 'Zumba', category: 'Modern Dance & Fitness', fee: 2200, room: 'Natya Mandapam (Room 101)', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80' },
  { code: 'gymn', title: 'Gymnastic', category: 'Modern Dance & Fitness', fee: 2400, room: 'Veera Kalari Koodam (Room 104)', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' }
];

// -------------------------------------------------------------
// 20 Gurus (Trainers) Data
// -------------------------------------------------------------
const GURUS = [
  {
    guru_id: 'GURU-001',
    name: 'Nandana Krishna',
    phone: '+91 98765 00001',
    email: 'nandana@laasyaacademy.com',
    gender: 'female',
    age: 32,
    display_title: 'Guru',
    specializations: ['Bharatanatyam'],
    courses: ['bhar'],
    salary: 35000,
    experience: '10 years',
    bio: 'Renowned Bharatanatyam soloist and Arangetram mentor from Calicut. Master of Abhinaya and Nattuvangam.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-002',
    name: 'Amrutha Suresh',
    phone: '+91 98765 00002',
    email: 'amrutha@laasyaacademy.com',
    gender: 'female',
    age: 29,
    display_title: 'Guru',
    specializations: ['Bharatanatyam'],
    courses: ['bhar'],
    salary: 32000,
    experience: '8 years',
    bio: 'Kalakshetra style senior Bharatanatyam exponent, specializing in Adavus and rhythmic precision.',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-003',
    name: 'Vismaya Rajan',
    phone: '+91 98765 00003',
    email: 'vismaya@laasyaacademy.com',
    gender: 'female',
    age: 28,
    display_title: 'Guru',
    specializations: ['Bharatanatyam'],
    courses: ['bhar'],
    salary: 30000,
    experience: '7 years',
    bio: 'Bharatanatyam faculty, dedicated to beginner disciples and foundation technique mastery.',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-004',
    name: 'Kavya Shenoy',
    phone: '+91 7780763121', // preserved phone
    email: 'kavya@laasyaacademy.com',
    gender: 'female',
    age: 30,
    display_title: 'Guru',
    specializations: ['Bharatanatyam'],
    courses: ['bhar'],
    salary: 34000,
    experience: '9 years',
    bio: 'Lead faculty in Bharatanatyam with distinction in Tanjore quartet compositions.',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-005',
    name: 'Amos P Ovung',
    phone: '+91 98765 00005',
    email: 'amos@laasyaacademy.com',
    gender: 'male',
    age: 34,
    display_title: 'Master',
    specializations: ['Guitar', 'Ukulele', 'Violin'],
    courses: ['guit', 'ukul', 'viol'],
    salary: 38000,
    experience: '12 years',
    bio: 'Multi-instrumentalist certified with Trinity College London & Rockschool UK distinction.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-006',
    name: 'Shahil Patro',
    phone: '+91 98765 00006',
    email: 'sahil@laasyaacademy.com',
    gender: 'male',
    age: 31,
    display_title: 'Master',
    specializations: ['Keyboard', 'Piano'],
    courses: ['keyb'],
    salary: 34000,
    experience: '9 years',
    bio: 'Classical and contemporary keyboard educator, guiding students for international certifications.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-007',
    name: 'Shri H Manikandan',
    phone: '+91 98765 00007',
    email: 'manikandan@laasyaacademy.com',
    gender: 'male',
    age: 46,
    display_title: 'Sangeetha Acharya',
    specializations: ['Carnatic Music', 'Vocal'],
    courses: ['carn'],
    salary: 42000,
    experience: '20 years',
    bio: 'Palakkad lineage Carnatic Vocal Guru. Conferred Sangeetha Acharya for traditional discipleship.',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-008',
    name: 'Dipanyan Sarkar',
    phone: '+91 98765 00008',
    email: 'dipanyan@laasyaacademy.com',
    gender: 'male',
    age: 35,
    display_title: 'Artist Guru',
    specializations: ['Drawing', 'Art and Craft'],
    courses: ['draw', 'art'],
    salary: 32000,
    experience: '11 years',
    bio: 'Fine Arts graduate from Santiniketan. Mentor in charcoal sketching, watercolor, and traditional handicrafts.',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-009',
    name: 'Karthik V',
    phone: '+91 98765 00009',
    email: 'karthik@laasyaacademy.com',
    gender: 'male',
    age: 27,
    display_title: 'Choreographer',
    specializations: ['Western Dance', 'Hip-Hop'],
    courses: ['west'],
    salary: 30000,
    experience: '7 years',
    bio: 'Contemporary and hip-hop choreographer, specializing in high-energy youth dance routines.',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-010',
    name: 'Uday Shankar',
    phone: '+91 98765 00010',
    email: 'uday@laasyaacademy.com',
    gender: 'male',
    age: 33,
    display_title: 'Master',
    specializations: ['Western Dance', 'Freestyle'],
    courses: ['west'],
    salary: 31000,
    experience: '9 years',
    bio: 'Stage performance specialist and western dance mentor with international competition honors.',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-011',
    name: 'Manjunath Hegde',
    phone: '+91 98765 00011',
    email: 'manjunath@laasyaacademy.com',
    gender: 'male',
    age: 36,
    display_title: 'Master',
    specializations: ['Western Dance', 'Bollywood'],
    courses: ['west'],
    salary: 32000,
    experience: '12 years',
    bio: 'Cinematic and fusion dance educator training students for stage shows and inter-school festivals.',
    avatar_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-012',
    name: 'Vrushhabh Prakash',
    phone: '+91 98765 00012',
    email: 'vrushhabh@laasyaacademy.com',
    gender: 'male',
    age: 38,
    display_title: 'Gurukkal',
    specializations: ['Kalaripayattu'],
    courses: ['kala'],
    salary: 36000,
    experience: '15 years',
    bio: 'Traditional Northern Kalaripayattu Gurukkal from Calicut. Master of Meippayattu and armed defense.',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-013',
    name: 'Balraj Shetty',
    phone: '+91 98765 00013',
    email: 'balraj@laasyaacademy.com',
    gender: 'male',
    age: 41,
    display_title: 'Sensei',
    specializations: ['Karate', 'Self Defense'],
    courses: ['kara'],
    salary: 35000,
    experience: '18 years',
    bio: '4th Dan Black Belt Shotokan Karate Master, referee for state championships and youth trainer.',
    avatar_url: 'https://images.unsplash.com/photo-1517070208541-6ddc4d3efbcb?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-014',
    name: 'Satish Kale',
    phone: '+91 7780763120', // preserved phone
    email: 'satish@laasyaacademy.com',
    gender: 'male',
    age: 42,
    display_title: 'Acharya',
    specializations: ['Yoga', 'Pranayama'],
    courses: ['yoga'],
    salary: 35000,
    experience: '16 years',
    bio: 'Certified Yoga Siromani from Sivananda Ashram, mentor in Hatha and Ashtanga Yoga.',
    avatar_url: 'https://images.unsplash.com/photo-1508341591423-4347099e1f19?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-015',
    name: 'Smt. Radhika Swaminathan',
    phone: '+91 98765 00015',
    email: 'radhika@laasyaacademy.com',
    gender: 'female',
    age: 37,
    display_title: 'Vidushi',
    specializations: ['Kuchupudi'],
    courses: ['kuch'],
    salary: 36000,
    experience: '14 years',
    bio: 'Distinguished disciple of Kuchipudi Art Academy. Soloist with Tarangam brass plate mastery.',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-016',
    name: 'Smt. Bhavana Nair',
    phone: '+91 98765 00016',
    email: 'bhavana@laasyaacademy.com',
    gender: 'female',
    age: 35,
    display_title: 'Vidushi',
    specializations: ['Mohiniyatam'],
    courses: ['mohi'],
    salary: 35000,
    experience: '13 years',
    bio: 'Kerala Kalamandalam alumna, exponent of lyrical lasya dance and classical Mudras.',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-017',
    name: 'Vidushi Meera Krishnan',
    phone: '+91 98765 00017',
    email: 'meera@laasyaacademy.com',
    gender: 'female',
    age: 33,
    display_title: 'Guru',
    specializations: ['Semi Classical', 'Folk Arts'],
    courses: ['semi'],
    salary: 32000,
    experience: '11 years',
    bio: 'Specialist in Indian semi-classical choreographies and expressive devotional performance.',
    avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-018',
    name: 'Rajesh Acharya',
    phone: '+91 98765 00018',
    email: 'rajesh@laasyaacademy.com',
    gender: 'male',
    age: 39,
    display_title: 'Coach',
    specializations: ['Chess'],
    courses: ['ches'],
    salary: 33000,
    experience: '14 years',
    bio: 'FIDE rated chess mentor with 1950+ rating, preparing young minds for state and national tournaments.',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-019',
    name: 'Suresh Kumar',
    phone: '+91 98765 00019',
    email: 'suresh@laasyaacademy.com',
    gender: 'male',
    age: 34,
    display_title: 'Coach',
    specializations: ['Gymnastic', 'Acrobatics'],
    courses: ['gymn'],
    salary: 34000,
    experience: '11 years',
    bio: 'National gymnastics medalist, coaching artistic gymnastics, floor balance, and flexibility.',
    avatar_url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    guru_id: 'GURU-020',
    name: 'Deepa Bhatt',
    phone: '+91 98765 00020',
    email: 'deepa@laasyaacademy.com',
    gender: 'female',
    age: 31,
    display_title: 'Instructor',
    specializations: ['Zumba', 'Fitness'],
    courses: ['zumb'],
    salary: 31000,
    experience: '8 years',
    bio: 'Licensed Zumba Fitness instructor bringing infectious rhythm and high-energy cardiovascular health.',
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&h=400&q=80'
  }
];

// -------------------------------------------------------------
// Indian Student Names Data (for 400 students)
// -------------------------------------------------------------
const FIRST_NAMES_FEMALE = [
  'Aadhya', 'Aanya', 'Aditi', 'Akshara', 'Ananya', 'Anushka', 'Archana', 'Avani', 'Bhavana', 'Charumathi',
  'Deepika', 'Devika', 'Dhanya', 'Disha', 'Diya', 'Gargi', 'Gayatri', 'Harini', 'Ishita', 'Janani',
  'Jhanvi', 'Kavya', 'Keerthana', 'Lakshmi', 'Lavanya', 'Madhuri', 'Meera', 'Nandini', 'Navya', 'Neha',
  'Nisha', 'Nithya', 'Pallavi', 'Pavithra', 'Pooja', 'Pranathi', 'Priya', 'Priyanka', 'Radhika', 'Ramya',
  'Rashmi', 'Rhea', 'Ritika', 'Roopa', 'Ruchira', 'Sahana', 'Sanjana', 'Sarada', 'Shalini', 'Sharada',
  'Shashi', 'Shreya', 'Shrinidhi', 'Shruti', 'Sindhu', 'Sneha', 'Sowmya', 'Sreeja', 'Sudha', 'Sumathi',
  'Sushma', 'Swathi', 'Tanvi', 'Tejaswini', 'Trisha', 'Uma', 'Unnati', 'Vaishnavi', 'Vandana', 'Vidya',
  'Vrushali', 'Yamini', 'Yashaswini', 'Yukti', 'Zoya', 'Adhira', 'Anamika', 'Aparna', 'Chaithra', 'Eesha',
  'Geetha', 'Hamsa', 'Indira', 'Jyothi', 'Kamala', 'Lalitha', 'Malini', 'Manjula', 'Padma', 'Parvati',
  'Pushpa', 'Rajani', 'Renuka', 'Revathi', 'Rithika', 'Roshni', 'Samiksha', 'Samvritha', 'Sangeetha', 'Shubha'
];

const FIRST_NAMES_MALE = [
  'Aadhav', 'Aarav', 'Advait', 'Anand', 'Anirudh', 'Arjun', 'Arya', 'Aryan', 'Ashwin', 'Ayush',
  'Chinmay', 'Darshan', 'Dhruv', 'Eshwar', 'Giridhar', 'Goutham', 'Harish', 'Hemanth', 'Ishaan', 'Kalyan',
  'Karthik', 'Kiran', 'Krish', 'Krishna', 'Madhav', 'Manish', 'Mihir', 'Mohan', 'Mukund', 'Nakul',
  'Neeraj', 'Nikhil', 'Niranjan', 'Ojas', 'Pranav', 'Prashant', 'Prathik', 'Raghav', 'Rahul', 'Rajesh',
  'Ramesh', 'Ranjan', 'Ravi', 'Rishi', 'Rohan', 'Rohit', 'Sai', 'Samarth', 'Sameer', 'Sampada',
  'Sandhya', 'Sanjay', 'Santosh', 'Sarvesh', 'Sathya', 'Shankar', 'Shravan', 'Siddharth', 'Sohan', 'Srinath',
  'Srinivas', 'Subhash', 'Suhas', 'Suraj', 'Suresh', 'Suryakant', 'Tarun', 'Tejas', 'Uday', 'Upendra',
  'Vaibhav', 'Varun', 'Vasant', 'Vedant', 'Venkat', 'Venkatesh', 'Vijay', 'Vikas', 'Vikram', 'Vimal',
  'Vinay', 'Vinod', 'Vishal', 'Vishnu', 'Viswanathan', 'Vivek', 'Yash', 'Yogesh', 'Alok', 'Aniket',
  'Arvind', 'Bala', 'Bhadra', 'Damodar', 'Divyesh', 'Ganesh', 'Govind', 'Jaidev', 'Mahesh', 'Murthy'
];

const LAST_NAMES = [
  'Iyer', 'Iyengar', 'Rao', 'Sharma', 'Hegde', 'Kulkarni', 'Bhat', 'Krishnakumar', 'Narayanan', 'Pillai',
  'Nambiar', 'Menon', 'Nair', 'Shetty', 'Reddy', 'Murthy', 'Shastry', 'Prasad', 'Srinivasan', 'Raghavan',
  'Acharya', 'Kamath', 'Pai', 'Shenoy', 'Deshmukh', 'Joshi', 'Patil', 'Deshpande', 'Gokhale', 'Tendulkar',
  'Venkatraman', 'Venkatesh', 'Subramanian', 'Swamy', 'Bhattacharya', 'Mukherjee', 'Banerjee', 'Chatterjee', 'Sen', 'Dutta',
  'Verma', 'Gupta', 'Malhotra', 'Kapoor', 'Mehta', 'Chopra', 'Saxena', 'Pandey', 'Mishra', 'Choudhury'
];

const LOCALITIES = [
  'Jayanagar 4th Block, Bengaluru', 'Malleshwaram 15th Cross, Bengaluru', 'Indiranagar 100ft Rd, Bengaluru',
  'Basavanagudi Gandhi Bazaar, Bengaluru', 'Koramangala 5th Block, Bengaluru', 'Rajajinagar 2nd Stage, Bengaluru',
  'Sadashivanagar, Bengaluru', 'JP Nagar 6th Phase, Bengaluru', 'Vijayanagar, Bengaluru', 'Banashankari 3rd Stage, Bengaluru',
  'BTM Layout 2nd Stage, Bengaluru', 'HSR Layout Sector 2, Bengaluru', 'Whitefield Inner Circle, Bengaluru',
  'Yelahanka New Town, Bengaluru', 'Padmanabhanagar, Bengaluru', 'Seshadripuram, Bengaluru'
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Comprehensive Production Readiness Seed...');
    await client.query('BEGIN');

    // 1. CLEANUP / MERGE 'Instrument Classes' COURSE INTO 18 COURSES
    console.log('\n--- 1. Validating 18 Pristine Courses ---');
    const instCourse = await client.query("SELECT id FROM public.courses WHERE code = 'inst' OR title ILIKE '%Instrument%'");
    const keybCourse = await client.query("SELECT id FROM public.courses WHERE code = 'keyb'");
    const guitCourse = await client.query("SELECT id FROM public.courses WHERE code = 'guit'");

    if (instCourse.rows.length > 0) {
      const instId = instCourse.rows[0].id;
      const targetCourseId = keybCourse.rows[0]?.id || guitCourse.rows[0]?.id;
      
      await client.query('UPDATE public.batches SET course_id = $1 WHERE course_id = $2', [targetCourseId, instId]);
      await client.query('UPDATE public.class_sessions SET session_topic_notes = REPLACE(session_topic_notes, $2, $1) WHERE session_topic_notes LIKE $3', ['Keyboard', 'Instrument Classes', '%Instrument Classes%']);
      await client.query('UPDATE public.student_fee_invoices SET course_id = $1 WHERE course_id = $2', [targetCourseId, instId]);
      await client.query('UPDATE public.guru_absences SET course_id = $1 WHERE course_id = $2', [targetCourseId, instId]);
      await client.query('UPDATE public.tally_classes SET course_id = $1 WHERE course_id = $2', [targetCourseId, instId]);
      await client.query('UPDATE public.video_library SET target_course_id = $1 WHERE target_course_id = $2', [targetCourseId, instId]);

      await client.query('DELETE FROM public.courses WHERE id = $1', [instId]);
      console.log('Merged and removed redundant "Instrument Classes" course.');
    }

    // Ensure all 18 courses exist and have images & fees set
    for (const c of COURSES) {
      await client.query(`
        INSERT INTO public.courses (title, code, category, monthly_fee, is_active, image_url, description)
        VALUES ($1, $2, $3, $4, true, $5, $6)
        ON CONFLICT (code) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          monthly_fee = EXCLUDED.monthly_fee,
          is_active = true,
          image_url = COALESCE(courses.image_url, EXCLUDED.image_url),
          description = EXCLUDED.description;
      `, [c.title, c.code, c.category, c.fee, c.image, `Master the art of ${c.title} at Laasya Cultural Academy.`]);
    }

    const courseCountRes = await client.query('SELECT count(*) FROM public.courses');
    console.log(`✅ Verified Course Count: ${courseCountRes.rows[0].count} (Target: 18)`);

    // 2. VERIFY 4 ROOMS
    console.log('\n--- 2. Verifying 4 Academy Rooms ---');
    const ROOMS = [
      { name: 'Natya Mandapam (Room 101)', capacity: 25 },
      { name: 'Sangeetha Shala (Room 102)', capacity: 25 },
      { name: 'Chitrakala Hall (Room 103)', capacity: 25 },
      { name: 'Veera Kalari Koodam (Room 104)', capacity: 25 }
    ];

    for (const r of ROOMS) {
      await client.query(`
        INSERT INTO public.rooms (name, capacity)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE SET capacity = EXCLUDED.capacity;
      `, [r.name, r.capacity]);
    }
    const roomCountRes = await client.query('SELECT count(*) FROM public.rooms');
    console.log(`✅ Verified Room Count: ${roomCountRes.rows[0].count} (Target: 4)`);

    // 3. SEED EXACTLY 20 GURUS
    console.log('\n--- 3. Seeding Exactly 20 Gurus with Real Human Portraits & Passwords ---');
    const guruIdMap = new Map();

    for (let i = 0; i < GURUS.length; i++) {
      const g = GURUS[i];
      const profileId = await getOrCreateAuthUser(client, g.email, g.phone, g.name, 'trainer', 'Guru@123');

      await client.query(`
        INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, gender, age, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'trainer', $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = 'trainer',
          avatar_url = EXCLUDED.avatar_url,
          gender = EXCLUDED.gender,
          age = EXCLUDED.age,
          updated_at = NOW();
      `, [profileId, g.name, g.email, g.phone, g.avatar_url, g.gender, g.age]);

      // Check or create Trainer
      let trainerRes = await client.query('SELECT id FROM public.trainers WHERE guru_id = $1 OR profile_id = $2', [g.guru_id, profileId]);
      let trainerId;
      if (trainerRes.rows.length === 0) {
        const insTr = await client.query(`
          INSERT INTO public.trainers (
            profile_id, guru_id, code, display_title, specializations, bio, monthly_salary, 
            avatar_url, gender, age, experience, is_active, joined_date, created_at, updated_at
          ) VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, '2023-01-01', NOW(), NOW())
          RETURNING id;
        `, [profileId, g.guru_id, g.display_title, g.specializations, g.bio, g.salary, g.avatar_url, g.gender, g.age, g.experience]);
        trainerId = insTr.rows[0].id;
      } else {
        trainerId = trainerRes.rows[0].id;
        await client.query(`
          UPDATE public.trainers
          SET profile_id = $1, guru_id = $2, code = $2, display_title = $3, specializations = $4, bio = $5,
              monthly_salary = $6, avatar_url = $7, gender = $8, age = $9, experience = $10, is_active = true, updated_at = NOW()
          WHERE id = $11;
        `, [profileId, g.guru_id, g.display_title, g.specializations, g.bio, g.salary, g.avatar_url, g.gender, g.age, g.experience, trainerId]);
      }

      guruIdMap.set(g.guru_id, trainerId);
    }

    const trainerCountRes = await client.query('SELECT count(*) FROM public.trainers WHERE is_active = true');
    console.log(`✅ Verified Active Gurus: ${trainerCountRes.rows[0].count} (Target: 20)`);

    // 4. CREATE BATCHES FOR ALL 18 COURSES
    console.log('\n--- 4. Creating Balanced Batches for All 18 Courses ---');
    const courseMap = new Map();
    const allCoursesDb = await client.query('SELECT id, code, title FROM public.courses');
    allCoursesDb.rows.forEach(c => courseMap.set(c.code, c.id));

    const BATCH_SPECS = [
      // Bharatanatyam (4 Batches)
      { course: 'bhar', name: 'Alapadma (Kids Foundation)', guru: 'GURU-001', room: 'Natya Mandapam (Room 101)', days: ['Saturday', 'Sunday'], start: '09:00:00', end: '10:00:00', fee: 2500 },
      { course: 'bhar', name: 'Mudra (Junior Discipline)', guru: 'GURU-002', room: 'Natya Mandapam (Room 101)', days: ['Monday', 'Wednesday'], start: '17:00:00', end: '18:00:00', fee: 2500 },
      { course: 'bhar', name: 'Nrityam (Senior Varnams)', guru: 'GURU-003', room: 'Natya Mandapam (Room 101)', days: ['Tuesday', 'Thursday'], start: '18:00:00', end: '19:00:00', fee: 2500 },
      { course: 'bhar', name: 'Ladies Abhinaya Sadhana', guru: 'GURU-004', room: 'Natya Mandapam (Room 101)', days: ['Saturday', 'Sunday'], start: '11:00:00', end: '12:00:00', fee: 2500 },

      // Kuchupudi (2 Batches)
      { course: 'kuch', name: 'Tarangam Morning', guru: 'GURU-015', room: 'Natya Mandapam (Room 101)', days: ['Tuesday', 'Thursday'], start: '07:00:00', end: '08:00:00', fee: 2500 },
      { course: 'kuch', name: 'Natya Sree Weekend', guru: 'GURU-015', room: 'Natya Mandapam (Room 101)', days: ['Saturday', 'Sunday'], start: '14:00:00', end: '15:00:00', fee: 2500 },

      // Mohiniyatam (2 Batches)
      { course: 'mohi', name: 'Lasya Swaram (Morning)', guru: 'GURU-016', room: 'Natya Mandapam (Room 101)', days: ['Monday', 'Friday'], start: '08:00:00', end: '09:00:00', fee: 2500 },
      { course: 'mohi', name: 'Sopanam (Weekend)', guru: 'GURU-016', room: 'Natya Mandapam (Room 101)', days: ['Saturday', 'Sunday'], start: '15:00:00', end: '16:00:00', fee: 2500 },

      // Semi Classical (2 Batches)
      { course: 'semi', name: 'Ananda Tandavam (Weekday)', guru: 'GURU-017', room: 'Natya Mandapam (Room 101)', days: ['Wednesday', 'Friday'], start: '16:00:00', end: '17:00:00', fee: 2200 },
      { course: 'semi', name: 'Devotional Fusion (Weekend)', guru: 'GURU-017', room: 'Natya Mandapam (Room 101)', days: ['Saturday', 'Sunday'], start: '16:00:00', end: '17:00:00', fee: 2200 },

      // Western Dance (2 Batches)
      { course: 'west', name: 'Street Hip-Hop Crew', guru: 'GURU-009', room: 'Natya Mandapam (Room 101)', days: ['Tuesday', 'Thursday'], start: '19:00:00', end: '20:00:00', fee: 2200 },
      { course: 'west', name: 'Contemporary Stage Express', guru: 'GURU-010', room: 'Natya Mandapam (Room 101)', days: ['Saturday', 'Sunday'], start: '17:00:00', end: '18:00:00', fee: 2200 },

      // Zumba (2 Batches)
      { course: 'zumb', name: 'Morning Glow Cardio', guru: 'GURU-020', room: 'Natya Mandapam (Room 101)', days: ['Monday', 'Wednesday', 'Friday'], start: '06:00:00', end: '07:00:00', fee: 2200 },
      { course: 'zumb', name: 'Weekend Rhythmic Burn', guru: 'GURU-020', room: 'Natya Mandapam (Room 101)', days: ['Saturday', 'Sunday'], start: '08:00:00', end: '09:00:00', fee: 2200 },

      // Carnatic Music (2 Batches)
      { course: 'carn', name: 'Sarali & Geetham Foundation', guru: 'GURU-007', room: 'Sangeetha Shala (Room 102)', days: ['Tuesday', 'Thursday'], start: '17:00:00', end: '18:00:00', fee: 2500 },
      { course: 'carn', name: 'Varnam & Keerthanai Advanced', guru: 'GURU-007', room: 'Sangeetha Shala (Room 102)', days: ['Saturday', 'Sunday'], start: '10:00:00', end: '11:00:00', fee: 2500 },

      // Keyboard (2 Batches)
      { course: 'keyb', name: 'Trinity Scales (Weekday)', guru: 'GURU-006', room: 'Sangeetha Shala (Room 102)', days: ['Monday', 'Wednesday'], start: '16:00:00', end: '17:00:00', fee: 2400 },
      { course: 'keyb', name: 'RSL Chords & Melody (Weekend)', guru: 'GURU-006', room: 'Sangeetha Shala (Room 102)', days: ['Saturday', 'Sunday'], start: '11:00:00', end: '12:00:00', fee: 2400 },

      // Guitar (2 Batches)
      { course: 'guit', name: 'Acoustic Riffs (Weekday)', guru: 'GURU-005', room: 'Sangeetha Shala (Room 102)', days: ['Tuesday', 'Thursday'], start: '18:00:00', end: '19:00:00', fee: 2400 },
      { course: 'guit', name: 'Fingerstyle Mastery (Weekend)', guru: 'GURU-005', room: 'Sangeetha Shala (Room 102)', days: ['Saturday', 'Sunday'], start: '14:00:00', end: '15:00:00', fee: 2400 },

      // Violin (2 Batches)
      { course: 'viol', name: 'Carnatic Bowing Technique', guru: 'GURU-005', room: 'Sangeetha Shala (Room 102)', days: ['Monday', 'Wednesday'], start: '18:00:00', end: '19:00:00', fee: 2600 },
      { course: 'viol', name: 'Swaram & Gamakam (Weekend)', guru: 'GURU-005', room: 'Sangeetha Shala (Room 102)', days: ['Saturday', 'Sunday'], start: '15:00:00', end: '16:00:00', fee: 2600 },

      // Ukulele (2 Batches)
      { course: 'ukul', name: 'Strum & Sing Beginner', guru: 'GURU-005', room: 'Sangeetha Shala (Room 102)', days: ['Tuesday', 'Thursday'], start: '16:00:00', end: '17:00:00', fee: 2200 },
      { course: 'ukul', name: 'Island Melodies (Weekend)', guru: 'GURU-005', room: 'Sangeetha Shala (Room 102)', days: ['Saturday', 'Sunday'], start: '16:00:00', end: '17:00:00', fee: 2200 },

      // Drawing (2 Batches)
      { course: 'draw', name: 'Junior Strokes & Color', guru: 'GURU-008', room: 'Chitrakala Hall (Room 103)', days: ['Monday', 'Wednesday'], start: '17:00:00', end: '18:00:00', fee: 1800 },
      { course: 'draw', name: 'Master Charcoal & Perspective', guru: 'GURU-008', room: 'Chitrakala Hall (Room 103)', days: ['Saturday', 'Sunday'], start: '09:30:00', end: '10:30:00', fee: 1800 },

      // Art and Craft (2 Batches)
      { course: 'art', name: 'Creative Origami & Clay', guru: 'GURU-008', room: 'Chitrakala Hall (Room 103)', days: ['Tuesday', 'Thursday'], start: '17:00:00', end: '18:00:00', fee: 1800 },
      { course: 'art', name: 'Heritage Handicrafts', guru: 'GURU-008', room: 'Chitrakala Hall (Room 103)', days: ['Saturday', 'Sunday'], start: '11:00:00', end: '12:00:00', fee: 1800 },

      // Chess (2 Batches)
      { course: 'ches', name: 'Pawn Openings & Tactics', guru: 'GURU-018', room: 'Chitrakala Hall (Room 103)', days: ['Wednesday', 'Friday'], start: '18:00:00', end: '19:00:00', fee: 2000 },
      { course: 'ches', name: 'FIDE Endgame & Strategy', guru: 'GURU-018', room: 'Chitrakala Hall (Room 103)', days: ['Saturday', 'Sunday'], start: '14:30:00', end: '15:30:00', fee: 2000 },

      // Kalaripayattu (2 Batches)
      { course: 'kala', name: 'Meippayattu Dawn Discipline', guru: 'GURU-012', room: 'Veera Kalari Koodam (Room 104)', days: ['Monday', 'Wednesday', 'Friday'], start: '06:00:00', end: '07:00:00', fee: 2400 },
      { course: 'kala', name: 'Chuvadukal Dusk Warriors', guru: 'GURU-012', room: 'Veera Kalari Koodam (Room 104)', days: ['Tuesday', 'Thursday'], start: '18:00:00', end: '19:00:00', fee: 2400 },

      // Karate (2 Batches)
      { course: 'kara', name: 'White & Yellow Belt Kata', guru: 'GURU-013', room: 'Veera Kalari Koodam (Room 104)', days: ['Monday', 'Wednesday'], start: '17:00:00', end: '18:00:00', fee: 2200 },
      { course: 'kara', name: 'Kumite Sparring & Defense', guru: 'GURU-013', room: 'Veera Kalari Koodam (Room 104)', days: ['Saturday', 'Sunday'], start: '09:00:00', end: '10:00:00', fee: 2200 },

      // Yoga (2 Batches)
      { course: 'yoga', name: 'Surya Namaskar & Pranayama', guru: 'GURU-014', room: 'Veera Kalari Koodam (Room 104)', days: ['Monday', 'Wednesday', 'Friday'], start: '05:00:00', end: '06:00:00', fee: 2000 },
      { course: 'yoga', name: 'Sunset Asana & Dhyana', guru: 'GURU-014', room: 'Veera Kalari Koodam (Room 104)', days: ['Tuesday', 'Thursday'], start: '19:00:00', end: '20:00:00', fee: 2000 },

      // Gymnastic (2 Batches)
      { course: 'gymn', name: 'Acrobatic Balance (Junior)', guru: 'GURU-019', room: 'Veera Kalari Koodam (Room 104)', days: ['Tuesday', 'Thursday'], start: '16:00:00', end: '17:00:00', fee: 2400 },
      { course: 'gymn', name: 'Tumbling & Flexibility (Senior)', guru: 'GURU-019', room: 'Veera Kalari Koodam (Room 104)', days: ['Saturday', 'Sunday'], start: '10:30:00', end: '11:30:00', fee: 2400 }
    ];

    const activeBatchIds = [];
    for (const b of BATCH_SPECS) {
      const courseId = courseMap.get(b.course);
      const trainerId = guruIdMap.get(b.guru);
      if (!courseId || !trainerId) {
        console.warn(`Skipping batch ${b.name}: courseId or trainerId missing`);
        continue;
      }

      let bRes = await client.query('SELECT id FROM public.batches WHERE name = $1', [b.name]);
      let batchId;
      if (bRes.rows.length === 0) {
        const insB = await client.query(`
          INSERT INTO public.batches (
            course_id, trainer_id, name, days_of_week, start_time, end_time, room_or_hall,
            max_capacity, is_active, monthly_fee, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 25, true, $8, NOW(), NOW())
          RETURNING id;
        `, [courseId, trainerId, b.name, b.days, b.start, b.end, b.room, b.fee]);
        batchId = insB.rows[0].id;
      } else {
        batchId = bRes.rows[0].id;
        await client.query(`
          UPDATE public.batches
          SET course_id = $1, trainer_id = $2, days_of_week = $3, start_time = $4, end_time = $5,
              room_or_hall = $6, max_capacity = 25, is_active = true, monthly_fee = $7, updated_at = NOW()
          WHERE id = $8;
        `, [courseId, trainerId, b.days, b.start, b.end, b.room, b.fee, batchId]);
      }
      activeBatchIds.push(batchId);
    }

    console.log(`✅ Configured ${activeBatchIds.length} Batches across all 18 Courses and 4 Rooms.`);

    // 5. SEED EXACTLY 400 STUDENTS WITH REAL HUMAN PORTRAITS & PASSWORDS
    console.log('\n--- 5. Seeding Exactly 400 Students with Real Human Portraits & Passwords ---');
    const studentIds = [];

    for (let roll = 1; roll <= 400; roll++) {
      const rollNumber = `LCA-${String(roll).padStart(3, '0')}`;
      const isFemale = roll % 2 === 1;
      const firstNameList = isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
      const firstName = firstNameList[(roll * 3) % firstNameList.length];
      const lastName = LAST_NAMES[(roll * 7) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const email = `student_${String(roll).padStart(3, '0')}@laasyaacademy.in`;
      const phone = `+91 98000${String(10000 + roll).substring(1)}`;
      const parentName = `${LAST_NAMES[(roll * 11) % LAST_NAMES.length]} ${isFemale ? 'S' : 'R'}`;
      const parentRelation = roll % 3 === 0 ? 'Father' : 'Mother';
      const parentPhone = `+91 98765${String(20000 + roll).substring(1)}`;
      const locality = LOCALITIES[roll % LOCALITIES.length];
      const age = (roll % 25) + 6; // Ages 6 to 30
      const gender = isFemale ? 'female' : 'male';
      const avatarUrl = getRealPortrait(gender, roll);

      const profileId = await getOrCreateAuthUser(client, email, phone, fullName, 'student', 'Student@123', { roll_number: rollNumber });

      await client.query(`
        INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, gender, age, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = 'student',
          avatar_url = EXCLUDED.avatar_url,
          gender = EXCLUDED.gender,
          age = EXCLUDED.age,
          updated_at = NOW();
      `, [profileId, fullName, email, phone, avatarUrl, gender, age]);

      let stRes = await client.query('SELECT id FROM public.students WHERE roll_number = $1 OR profile_id = $2', [rollNumber, profileId]);
      let studentId;
      if (stRes.rows.length === 0) {
        const insSt = await client.query(`
          INSERT INTO public.students (
            profile_id, roll_number, parent_name, parent_contact, parent_relation, address,
            gender, age, date_of_birth, enrollment_date, status, avatar_url, advance_paid, fixed_discount, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '2015-05-15', '2026-09-01', 'active', $9, 500, 0, NOW(), NOW())
          RETURNING id;
        `, [profileId, rollNumber, parentName, parentPhone, parentRelation, locality, gender, age, avatarUrl]);
        studentId = insSt.rows[0].id;
      } else {
        studentId = stRes.rows[0].id;
        await client.query(`
          UPDATE public.students
          SET profile_id = $1, parent_name = $2, parent_contact = $3, parent_relation = $4, address = $5,
              gender = $6, age = $7, status = 'active', avatar_url = $8, updated_at = NOW()
          WHERE id = $9;
        `, [profileId, parentName, parentPhone, parentRelation, locality, gender, age, avatarUrl, studentId]);
      }

      studentIds.push(studentId);
    }

    const totalStudentsRes = await client.query("SELECT count(*) FROM public.students WHERE status = 'active'");
    console.log(`✅ Verified Active Students: ${totalStudentsRes.rows[0].count} (Target: 400)`);

    // 6. ENROLL STUDENTS INTO BATCHES
    console.log('\n--- 6. Enrolling 400 Students into Batches ---');
    for (let i = 0; i < studentIds.length; i++) {
      const stId = studentIds[i];
      const primaryBatchId = activeBatchIds[i % activeBatchIds.length];
      await client.query(`
        INSERT INTO public.batch_enrollments (student_id, batch_id, status)
        VALUES ($1, $2, 'active')
        ON CONFLICT (batch_id, student_id) DO UPDATE SET status = 'active';
      `, [stId, primaryBatchId]);

      // 40% secondary enrollment
      if (i % 2 === 0) {
        const secondaryBatchId = activeBatchIds[(i + 7) % activeBatchIds.length];
        if (secondaryBatchId !== primaryBatchId) {
          await client.query(`
            INSERT INTO public.batch_enrollments (student_id, batch_id, status)
            VALUES ($1, $2, 'active')
            ON CONFLICT (batch_id, student_id) DO UPDATE SET status = 'active';
          `, [stId, secondaryBatchId]);
        }
      }
    }
    const enrollmentsCountRes = await client.query("SELECT count(*) FROM public.batch_enrollments WHERE status = 'active'");
    console.log(`✅ Verified Active Batch Enrollments: ${enrollmentsCountRes.rows[0].count}`);

    // 7. CLEAR AND REGENERATE TIMETABLE DATA (class_sessions)
    console.log('\n--- 7. Generating Clear Timetable Data for November 2026 ---');
    const DAY_NAME_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const batchesData = await client.query(`
      SELECT id, trainer_id, days_of_week, start_time, end_time, name
      FROM public.batches
      WHERE is_active = true
    `);

    // Clean up sessions in November 2026 to ensure no overlaps
    await client.query(`DELETE FROM public.class_sessions WHERE session_date >= '2026-11-01' AND session_date <= '2026-11-30'`);

    let createdSessionsCount = 0;
    for (const b of batchesData.rows) {
      const days = b.days_of_week || [];
      for (let day = 1; day <= 30; day++) {
        const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
        const dt = new Date(`${dateStr}T12:00:00+05:30`);
        const dayName = DAY_NAME_MAP[dt.getDay()];

        if (days.includes(dayName)) {
          const isPast = day < 6; // Context: Nov 6, 2026
          const status = isPast ? 'completed' : 'scheduled';
          const checkInCode = String(1000 + ((day * 73 + b.name.length * 19) % 9000));
          const topic = `${b.name} - Lesson Session #${day}`;

          await client.query(`
            INSERT INTO public.class_sessions (
              batch_id, trainer_id, session_date, start_time, end_time, status, check_in_code, session_topic_notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW());
          `, [b.id, b.trainer_id, dateStr, b.start_time, b.end_time, status, checkInCode, topic]);
          createdSessionsCount++;
        }
      }
    }
    console.log(`✅ Generated ${createdSessionsCount} Clear Timetable Class Sessions for November 2026.`);

    await client.query('COMMIT');
    console.log('\n🎉 ALL DATABASE UPDATES COMMITTED SUCCESSFULLY!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration transaction rolled back due to error:', err);
    process.exit(1);
  } finally {
    client.release();
  }

  // 8. FINAL HEALTH & STORAGE METRICS
  console.log('\n========================================');
  console.log('📊 FINAL SUPABASE HEALTH & STORAGE AUDIT');
  console.log('========================================');

  const finalCheck = await pool.query(`
    SELECT
      (SELECT count(*) FROM public.courses) as courses_count,
      (SELECT count(*) FROM public.rooms) as rooms_count,
      (SELECT count(*) FROM public.trainers WHERE is_active = true) as gurus_count,
      (SELECT count(*) FROM public.students WHERE status = 'active') as students_count,
      (SELECT count(*) FROM public.batches WHERE is_active = true) as batches_count,
      (SELECT count(*) FROM public.batch_enrollments WHERE status = 'active') as enrollments_count,
      (SELECT count(*) FROM public.class_sessions) as sessions_count,
      pg_database_size(current_database()) as total_db_bytes,
      pg_size_pretty(pg_database_size(current_database())) as total_db_pretty
  `);

  const stats = finalCheck.rows[0];
  console.log(`Courses Count:       ${stats.courses_count} (Expected: 18)`);
  console.log(`Rooms Count:         ${stats.rooms_count} (Expected: 4)`);
  console.log(`Active Gurus:        ${stats.gurus_count} (Expected: 20)`);
  console.log(`Active Students:     ${stats.students_count} (Expected: 400)`);
  console.log(`Active Batches:      ${stats.batches_count}`);
  console.log(`Batch Enrollments:   ${stats.enrollments_count}`);
  console.log(`Class Sessions:      ${stats.sessions_count}`);
  console.log(`Total Database Size: ${stats.total_db_pretty} (${stats.total_db_bytes} bytes out of 500 MB Free Plan limit)`);

  await pool.end();
}

run();

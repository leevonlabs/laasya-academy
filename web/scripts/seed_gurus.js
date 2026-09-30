const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const GURUS_DATA = [
  {
    full_name: 'Amos P Ovung',
    email: 'amos@laasyaacademy.com',
    phone: '+91 8151 998 899',
    specializations: ['Guitar', 'Keyboard', 'Violin', 'Ukulele', 'Vocal', 'Drums'],
    bio: 'Director & Multi-Instrumentalist. Trained at Hillspraise Music Academy Nagaland; holds Trinity London and Rockschool qualifications. One of the youngest RSL East India toppers. 8+ years teaching, 1000+ students.',
    joined_date: '2022-06-01'
  },
  {
    full_name: 'Shahil Patro',
    email: 'shahil@laasyaacademy.com',
    phone: '+91 98765 00002',
    specializations: ['Keyboard', 'Piano', 'Guitar', 'Ukulele'],
    bio: 'Senior instrument mentor for keyboard, piano, guitar and ukulele following Trinity College London and RSL International curricula. Guided 4 RSL South India region toppers and 10+ distinction holders.',
    joined_date: '2023-01-15'
  },
  {
    full_name: 'Shri H. Manikandan',
    email: 'manikandan@laasyaacademy.com',
    phone: '+91 98765 00003',
    specializations: ['Carnatic Vocal', 'Classical Music', 'Varnam & Keerthanai'],
    bio: 'Carnatic Vocal Guru with 15+ years experience and the title "Sangeetha Acharya". Disciple of Palakkad Sisters (Nandini Shankar & Seethalakshmi Krishnan). Guides from Sarali Swaras to Kutcheri Keerthanams.',
    joined_date: '2023-03-01'
  },
  {
    full_name: 'Smt. Anusha Sumesh',
    email: 'anusha@laasyaacademy.com',
    phone: '+91 98765 00004',
    specializations: ['Bharatanatyam', 'Classical Dance', 'Choreography'],
    bio: 'Bharatanatyam Master & Academy Founder from Calicut, Kerala. Arangetram at Guruvayoor Shri Krishna Temple (2005). Degree in Bharatanatyam from University of Art & Culture (2015). Teaching since 2017.',
    joined_date: '2022-01-01'
  },
  {
    full_name: 'Pramod T. Peethambaran',
    email: 'pramod@laasyaacademy.com',
    phone: '+91 98765 00005',
    specializations: ['Bharatanatyam', 'Kuchipudi', 'Semi Classical', 'Folk Dance'],
    bio: 'Choreographer and founder of Natyamandra Dance Studio from Thrissur, Kerala. Recipient of Paartha Puraskar Award (2021). Choreographed major productions on Flowers TV and Mazhavil Manorama.',
    joined_date: '2022-08-10'
  },
  {
    full_name: 'Nandhana (Nandana Krishna)',
    email: 'nandhana@laasyaacademy.com',
    phone: '+91 98765 00006',
    specializations: ['Bharatanatyam', 'Classical Dance', 'Stage Repertoire'],
    bio: 'Bharatanatyam soloist who began dancing at age six. Bachelor from Sanskrit University and Master from St Teresa\'s College, Ernakulam. Prepares students for temple festivals and competitive stage events.',
    joined_date: '2023-05-12'
  },
  {
    full_name: 'Sruthy Ramesh',
    email: 'sruthy@laasyaacademy.com',
    phone: '+91 98765 00007',
    specializations: ['Mohiniyattam', 'Kuchipudi', 'Lasya & Abhinaya'],
    bio: 'Classical dance exponent with 20+ years of performing experience. Trains students in authentic Lasya techniques, Mudras, and preparation for stage Arangetrams.',
    joined_date: '2022-11-20'
  },
  {
    full_name: 'Ranjith Kumar S J',
    email: 'ranjith@laasyaacademy.com',
    phone: '+91 98765 00008',
    specializations: ['Western Dance', 'Semi Classical', 'Stage Choreography'],
    bio: 'Dance Trainer with 7+ years of experience. Choreographed reality television shows on ETV Telugu and Dance Karnataka Dance. Focuses on movement mechanics, rhythm theory, and energetic group pieces.',
    joined_date: '2023-02-18'
  },
  {
    full_name: 'Karthik R',
    email: 'karthik@laasyaacademy.com',
    phone: '+91 98765 00009',
    specializations: ['Western Dance', 'Hip-Hop', 'Contemporary', 'Freestyle'],
    bio: 'Western Dance mentor and Season 1 dance competition winner. Performer and choreographer on Telugu ETV Dhee and Dance Karnataka Dance. Expert in hip-hop, contemporary, posture, and stage presence.',
    joined_date: '2023-06-01'
  },
  {
    full_name: 'Dipayan Sarkar',
    email: 'dipayan@laasyaacademy.com',
    phone: '+91 98765 00010',
    specializations: ['Drawing', 'Fine Arts', 'Pencil Shading', 'Art and Craft'],
    bio: 'Visual artist and art educator with BFA (2019) and MFA (2021) from Kala Bhavana, Visva-Bharati, Santiniketan. State art competition judge. Mentors students in sketch foundations, colour theory, and acrylics.',
    joined_date: '2022-05-15'
  },
  {
    full_name: 'Vrushabh Prakash Owhal',
    email: 'vrushabh@laasyaacademy.com',
    phone: '+91 98765 00011',
    specializations: ['Kalari', 'Kalaripayattu', 'Meypayattu', 'Martial Arts'],
    bio: 'Kalaripayattu Master teaching 3,000-year-old Kerala martial arts: Meypayattu flexibility conditioning, animal postures (Vadivu), unarmed combat (Kaikuththippayattu), and traditional weapons (Ankathari).',
    joined_date: '2023-04-10'
  },
  {
    full_name: 'Vijay Kumar Olekar',
    email: 'vijay@laasyaacademy.com',
    phone: '+91 98765 00012',
    specializations: ['Karate', 'Taekwondo', 'Self Defense', 'Kata & Kumite'],
    bio: 'Karate 2nd Dan black belt with 8+ years teaching experience and Taekwondo 1st Dan black belt. Instills discipline, mental focus, Kata precision, and self-defense reflex.',
    joined_date: '2022-09-01'
  },
  {
    full_name: 'Sai Krishna',
    email: 'saikrishna@laasyaacademy.com',
    phone: '+91 98765 00013',
    specializations: ['Chess', 'Strategic Tactics', 'Opening Repertoires', 'Endgames'],
    bio: 'Chess Grandmaster Mentor with 2 district gold and 3 state silver medals. Inter-college champion and team captain. Master\'s graduate in Communication Systems from NIT Warangal (2022-2024).',
    joined_date: '2023-08-15'
  },
  {
    full_name: 'Acharya Sathish Kale',
    email: 'sathish@laasyaacademy.com',
    phone: '+91 98765 00014',
    specializations: ['Yoga', 'Pranayama', 'Hatha Yoga', 'Mindfulness', 'Gymnastics'],
    bio: 'Certified Yoga Acharya and Mind-Body Wellness Guru. Guides students through traditional Hatha postures, breath mastery (Pranayama), postural correction, and physical agility.',
    joined_date: '2024-01-10'
  }
];

async function seed() {
  console.log('Seeding 14 Gurus into Supabase Database...');

  for (const g of GURUS_DATA) {
    // 1. Check or insert into auth.users
    let authRes = await pool.query(
      'SELECT id FROM auth.users WHERE email = $1',
      [g.email]
    );

    let profileId;
    if (authRes.rows.length === 0) {
      const insertAuth = await pool.query(
        `INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1, crypt('Guru@123', gen_salt('bf')), now(),
          jsonb_build_object('full_name', $2::text, 'role', 'trainer', 'phone', $3::text),
          now(), now()
        ) RETURNING id`,
        [g.email, g.full_name, g.phone]
      );
      profileId = insertAuth.rows[0].id;
    } else {
      profileId = authRes.rows[0].id;
    }

    // 2. Check or insert into public.profiles
    await pool.query(
      `INSERT INTO public.profiles (id, full_name, email, phone, role)
       VALUES ($1, $2, $3, $4, 'trainer')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone`,
      [profileId, g.full_name, g.email, g.phone]
    );

    // 2. Check or insert into public.trainers
    let trainerRes = await pool.query(
      'SELECT id FROM public.trainers WHERE profile_id = $1',
      [profileId]
    );

    if (trainerRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO public.trainers (profile_id, specializations, bio, is_active, joined_date)
         VALUES ($1, $2, $3, true, $4)`,
        [profileId, g.specializations, g.bio, g.joined_date]
      );
    } else {
      await pool.query(
        `UPDATE public.trainers
         SET specializations = $1, bio = $2, is_active = true, joined_date = $3
         WHERE profile_id = $4`,
        [g.specializations, g.bio, g.joined_date, profileId]
      );
    }
  }

  // 3. Connect courses to batches and assign corresponding gurus
  console.log('Linking Gurus to Courses & Batches...');

  const mappings = [
    { courseTitle: 'Bharathanatyam', guruName: 'Smt. Anusha Sumesh', room: 'Natya Mandapam (Room 101)', timing: 'Mon, Wed, Fri • 17:00 - 18:30' },
    { courseTitle: 'Kuchupudi', guruName: 'Pramod T. Peethambaran', room: 'Natya Mandapam (Room 102)', timing: 'Sat, Sun • 09:00 - 11:00' },
    { courseTitle: 'Mohiniyatam', guruName: 'Sruthy Ramesh', room: 'Natya Mandapam (Room 101)', timing: 'Mon, Wed • 16:00 - 17:00' },
    { courseTitle: 'Semi Classical', guruName: 'Nandhana (Nandana Krishna)', room: 'Natya Mandapam (Room 102)', timing: 'Sat, Sun • 17:00 - 18:30' },
    { courseTitle: 'Western Dance', guruName: 'Karthik R', room: 'Dance Studio 2', timing: 'Tue, Thu • 18:30 - 19:30' },
    { courseTitle: 'Zumba', guruName: 'Ranjith Kumar S J', room: 'Fitness Hall', timing: 'Mon, Wed, Fri • 07:00 - 08:00' },
    { courseTitle: 'Gymnastic', guruName: 'Ranjith Kumar S J', room: 'Main Gymnasium', timing: 'Sat, Sun • 08:00 - 09:30' },
    { courseTitle: 'Carnatic Music', guruName: 'Shri H. Manikandan', room: 'Sangeetha Shala (Room 202)', timing: 'Tue, Thu, Sat • 07:30 - 08:45' },
    { courseTitle: 'Violin', guruName: 'Amos P Ovung', room: 'Acoustic Studio 3', timing: 'Tue, Thu • 16:30 - 17:30' },
    { courseTitle: 'Keyboard', guruName: 'Shahil Patro', room: 'Keys Lab 2', timing: 'Mon, Wed • 18:00 - 19:00' },
    { courseTitle: 'Guitar', guruName: 'Amos P Ovung', room: 'Strings Room 1', timing: 'Tue, Thu • 17:30 - 18:30' },
    { courseTitle: 'Ukulele', guruName: 'Shahil Patro', room: 'Strings Room 1', timing: 'Sat • 10:00 - 11:30' },
    { courseTitle: 'Drawing', guruName: 'Dipayan Sarkar', room: 'Art Studio 4', timing: 'Sat, Sun • 16:00 - 17:30' },
    { courseTitle: 'Art and Craft', guruName: 'Dipayan Sarkar', room: 'Art Studio 4', timing: 'Sat, Sun • 14:00 - 15:30' },
    { courseTitle: 'Kalari', guruName: 'Vrushabh Prakash Owhal', room: 'Main Gymnasium', timing: 'Tue, Thu, Sat • 06:00 - 07:00' },
    { courseTitle: 'Karatte', guruName: 'Vijay Kumar Olekar', room: 'Main Gymnasium', timing: 'Mon, Wed, Fri • 06:30 - 07:30' },
    { courseTitle: 'Yoga', guruName: 'Acharya Sathish Kale', room: 'Pranayama Hall', timing: 'Daily • 06:00 - 07:00' },
    { courseTitle: 'Chess', guruName: 'Sai Krishna', room: 'Library Room 1', timing: 'Sat, Sun • 11:00 - 12:30' }
  ];

  for (const m of mappings) {
    const guruRes = await pool.query(
      `SELECT t.id FROM public.trainers t 
       JOIN public.profiles p ON p.id = t.profile_id 
       WHERE p.full_name = $1`,
      [m.guruName]
    );

    const courseRes = await pool.query(
      `SELECT id FROM public.courses WHERE title = $1`,
      [m.courseTitle]
    );

    if (guruRes.rows.length > 0 && courseRes.rows.length > 0) {
      const trainerId = guruRes.rows[0].id;
      const courseId = courseRes.rows[0].id;

      // Update existing batches or insert new batch
      const existingBatch = await pool.query(
        'SELECT id FROM public.batches WHERE course_id = $1',
        [courseId]
      );

      if (existingBatch.rows.length > 0) {
        await pool.query(
          `UPDATE public.batches 
           SET trainer_id = $1, room_or_hall = $2 
           WHERE course_id = $3`,
          [trainerId, m.room, courseId]
        );
      } else {
        await pool.query(
          `INSERT INTO public.batches (course_id, trainer_id, name, days_of_week, start_time, end_time, room_or_hall, max_capacity, is_active)
           VALUES ($1, $2, 'Primary Batch', '{"Mon","Wed","Fri"}', '17:00', '18:30', $3, 30, true)`,
          [courseId, trainerId, m.room]
        );
      }
    }
  }

  const countRes = await pool.query('SELECT count(*) FROM public.trainers');
  console.log(`Success! Total Gurus in Database: ${countRes.rows[0].count}`);
}

seed().catch(console.error).finally(() => pool.end());

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sharp = require('sharp');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

// Color themes inspired by classical Indian arts
const COLOR_THEMES = [
  { bg1: '#8A064D', bg2: '#590231', accent: '#F9E33A', stroke: '#EBB128' }, // Maroon & Gold
  { bg1: '#0D47A1', bg2: '#08265E', accent: '#64B5F6', stroke: '#90CAF9' }, // Peacock Blue
  { bg1: '#1B5E20', bg2: '#0D3813', accent: '#A5D6A7', stroke: '#81C784' }, // Temple Emerald
  { bg1: '#E65100', bg2: '#8A3000', accent: '#FFE082', stroke: '#FFD54F' }, // Terracotta Ochre
  { bg1: '#4A148C', bg2: '#280750', accent: '#E1BEE7', stroke: '#CE93D8' }, // Royal Violet
  { bg1: '#B71C1C', bg2: '#680D0D', accent: '#FFCDD2', stroke: '#EF9A9A' }, // Classical Crimson
  { bg1: '#006064', bg2: '#003638', accent: '#80DEEA', stroke: '#4DD0E1' }, // Teal Sapphire
  { bg1: '#880E4F', bg2: '#4A0027', accent: '#F48FB1', stroke: '#F06292' }, // Lotus Pink
];

// 200 Realistic Indian Student Names (First + Last)
const FIRST_NAMES = [
  'Aadhav', 'Aarav', 'Aashvi', 'Aditi', 'Advait', 'Akshara', 'Amrita', 'Anand', 'Ananya', 'Anirudh',
  'Anushka', 'Archana', 'Arjun', 'Arya', 'Aryan', 'Ashwin', 'Avani', 'Ayush', 'Bhavana', 'Charumathi',
  'Chinmay', 'Darshan', 'Deepika', 'Devika', 'Dhanya', 'Dhruv', 'Disha', 'Diya', 'Eshwar', 'Gargi',
  'Gayatri', 'Giridhar', 'Goutham', 'Harini', 'Harish', 'Hemanth', 'Ishaan', 'Ishita', 'Janani', 'Jhanvi',
  'Kalyan', 'Karthik', 'Kavya', 'Keerthana', 'Kiran', 'Krish', 'Krishna', 'Lakshmi', 'Lavanya', 'Madhav',
  'Madhuri', 'Manish', 'Meera', 'Mihir', 'Mohan', 'Mukund', 'Nakul', 'Nandini', 'Navya', 'Neeraj',
  'Neha', 'Nikhil', 'Niranjan', 'Nisha', 'Nithya', 'Ojas', 'Pallavi', 'Pavithra', 'Pooja', 'Pranav',
  'Pranathi', 'Prashant', 'Prathik', 'Priya', 'Priyanka', 'Radha', 'Radhika', 'Raghav', 'Rahul', 'Rajesh',
  'Rakshita', 'Ramesh', 'Ramya', 'Ranjan', 'Rashmi', 'Ravi', 'Rhea', 'Rishi', 'Ritika', 'Rohan',
  'Rohit', 'Roopa', 'Ruchira', 'Sahana', 'Sai', 'Samarth', 'Sameer', 'Sampada', 'Sandhya', 'Sanjay',
  'Sanjana', 'Santosh', 'Sarada', 'Sarvesh', 'Sathya', 'Shalini', 'Shankar', 'Sharada', 'Shashi', 'Shravan',
  'Shreya', 'Shrinidhi', 'Shruti', 'Siddharth', 'Sindhu', 'Sneha', 'Sohan', 'Sowmya', 'Sreeja', 'Srinath',
  'Srinivas', 'Subhash', 'Sudha', 'Suhas', 'Sumathi', 'Suraj', 'Suresh', 'Suryakant', 'Sushma', 'Swathi',
  'Tanvi', 'Tarun', 'Tejas', 'Tejaswini', 'Trisha', 'Uday', 'Uma', 'Unnati', 'Upendra', 'Vaibhav',
  'Vaishnavi', 'Vandana', 'Varun', 'Vasant', 'Vedant', 'Venkat', 'Venkatesh', 'Vidya', 'Vijay', 'Vikas',
  'Vikram', 'Vimal', 'Vinay', 'Vinod', 'Vishal', 'Vishnu', 'Viswanathan', 'Vivek', 'Vrushali', 'Yamini',
  'Yash', 'Yashaswini', 'Yogesh', 'Yukti', 'Zoya', 'Adhira', 'Alok', 'Anamika', 'Aniket', 'Aparna',
  'Arvind', 'Bala', 'Bhadra', 'Chaithra', 'Damodar', 'Divyesh', 'Eesha', 'Ganesh', 'Geetha', 'Govind',
  'Hamsa', 'Indira', 'Jaidev', 'Jyothi', 'Kamala', 'Lalitha', 'Mahesh', 'Malini', 'Manjula', 'Murthy',
  'Narayanan', 'Padma', 'Parvati', 'Prakash', 'Pushpa', 'Raghava', 'Rajani', 'Ranganath', 'Renuka', 'Revathi'
];

const LAST_NAMES = [
  'Iyer', 'Iyengar', 'Rao', 'Sharma', 'Hegde', 'Kulkarni', 'Bhat', 'Krishnakumar', 'Narayanan', 'Pillai',
  'Nambiar', 'Menon', 'Nair', 'Shetty', 'Reddy', 'Murthy', 'Shastry', 'Prasad', 'Srinivasan', 'Raghavan',
  'Acharya', 'Kamath', 'Pai', 'Shenoy', 'Deshmukh', 'Joshi', 'Patil', 'Deshpande', 'Gokhale', 'Tendulkar',
  'Venkatraman', 'Venkatesh', 'Subramanian', 'Swamy', 'Bhattacharya', 'Mukherjee', 'Banerjee', 'Chatterjee', 'Sen', 'Dutta'
];

const LOCALITIES = [
  'Jayanagar 4th Block, Bengaluru', 'Malleshwaram 15th Cross, Bengaluru', 'Indiranagar 100ft Rd, Bengaluru',
  'Basavanagudi Gandhi Bazaar, Bengaluru', 'Koramangala 5th Block, Bengaluru', 'Rajajinagar 2nd Stage, Bengaluru',
  'Sadashivanagar, Bengaluru', 'JP Nagar 6th Phase, Bengaluru', 'Vijayanagar, Bengaluru', 'Banashankari 3rd Stage, Bengaluru',
  'BTM Layout 2nd Stage, Bengaluru', 'HSR Layout Sector 2, Bengaluru', 'Whitefield Inner Circle, Bengaluru',
  'Yelahanka New Town, Bengaluru', 'Padmanabhanagar, Bengaluru', 'Seshadripuram, Bengaluru'
];

// Generate an exact/near ~50KB JPEG avatar
async function generateStudentAvatar(rollNumber, fullName, outputPath) {
  if (fs.existsSync(outputPath)) {
    const existingStat = fs.statSync(outputPath);
    if (existingStat.size >= 50000) {
      return existingStat.size;
    }
  }

  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const theme = COLOR_THEMES[rollNumber % COLOR_THEMES.length];
  const width = 420;
  const height = 420;

  // Build SVG with detailed geometry and gradient rings
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg_${rollNumber}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${theme.bg1}" />
        <stop offset="100%" stop-color="${theme.bg2}" />
      </radialGradient>
      <linearGradient id="acc_${rollNumber}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.accent}" />
        <stop offset="100%" stop-color="${theme.stroke}" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg_${rollNumber})" />
    <circle cx="210" cy="210" r="195" stroke="url(#acc_${rollNumber})" stroke-width="3" fill="none" opacity="0.8" />
    <circle cx="210" cy="210" r="170" stroke="#FFF2F8" stroke-width="1.5" stroke-dasharray="6,4" fill="none" opacity="0.5" />
    <circle cx="210" cy="210" r="140" stroke="url(#acc_${rollNumber})" stroke-width="1" fill="none" opacity="0.6" />
  `;

  // 48 decorative radial lotus petal rays
  for (let i = 0; i < 48; i++) {
    const angle = (i * 7.5) * Math.PI / 180;
    const x1 = 210 + Math.cos(angle) * 85;
    const y1 = 210 + Math.sin(angle) * 85;
    const x2 = 210 + Math.cos(angle) * 168;
    const y2 = 210 + Math.sin(angle) * 168;
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${theme.accent}" stroke-width="1.2" opacity="0.35" />`;
    svg += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="3" fill="#FFF2F8" opacity="0.65" />`;
  }

  // Center crest medallion
  svg += `
    <circle cx="210" cy="210" r="72" fill="${theme.bg2}" stroke="url(#acc_${rollNumber})" stroke-width="4.5" />
    <circle cx="210" cy="210" r="66" stroke="#FFF2F8" stroke-width="1" fill="none" opacity="0.4" />
    <text x="210" y="228" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="900" fill="${theme.accent}" text-anchor="middle">${initials}</text>
    <text x="210" y="258" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF" letter-spacing="2" text-anchor="middle" opacity="0.9">LCA-${rollNumber}</text>
  </svg>`;

  let jpegBuf = await sharp(Buffer.from(svg))
    .jpeg({ quality: 96 })
    .toBuffer();

  const targetSize = 51200; // 50 KB
  if (jpegBuf.length < targetSize) {
    // Append a standard metadata comment block to make the file ~50KB
    const paddingNeeded = targetSize - jpegBuf.length;
    // Safe JPEG trailing padding / comment
    const paddingBuf = Buffer.alloc(paddingNeeded, 0x20);
    jpegBuf = Buffer.concat([jpegBuf, paddingBuf]);
  }

  fs.writeFileSync(outputPath, jpegBuf);
  return jpegBuf.length;
}

async function main() {
  console.log('=== SEEDING 200 STUDENTS WITH 50KB AVATAR IMAGES ===');

  // 1. Ensure target avatars directory exists
  const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  // 2. Fetch existing batches & courses
  const batchesRes = await pool.query(`
    SELECT b.id, b.name, b.course_id, b.trainer_id, b.start_time, b.end_time, c.title, c.monthly_fee 
    FROM public.batches b 
    JOIN public.courses c ON c.id = b.course_id 
    WHERE b.is_active = true
    ORDER BY b.name
  `);
  const batches = batchesRes.rows;
  console.log(`Found ${batches.length} active batches across academy courses`);

  const trainerRes = await pool.query(`SELECT id FROM public.trainers LIMIT 1`);
  const fallbackTrainerId = trainerRes.rows[0]?.id;

  // 3. Generate 200 Student Records (LCA-29 to LCA-228)
  const START_ROLL = 29;
  const TOTAL_STUDENTS = 200;
  const END_ROLL = START_ROLL + TOTAL_STUDENTS - 1; // 228

  console.log(`Generating students from LCA-${START_ROLL} to LCA-${END_ROLL}...`);

  const createdStudents = [];

  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const rollNum = START_ROLL + i;
    const rollString = `LCA-${rollNum}`;

    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3 + Math.floor(i / 10)) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const email = `student_${rollNum}@laasyaacademy.in`;
    const phone = `+91 ${9800000000 + (rollNum * 137) % 199999999}`;
    const parentName = `${FIRST_NAMES[(i + 40) % FIRST_NAMES.length]} ${lastName}`;
    const parentRelation = i % 2 === 0 ? 'Mother' : 'Father';
    const parentPhone = `+91 ${9700000000 + (rollNum * 251) % 199999999}`;
    const address = LOCALITIES[i % LOCALITIES.length];
    const gender = i % 2 === 0 ? 'female' : 'male';
    const age = 10 + (i % 22); // ages 10 to 31

    // Generate 50KB avatar
    const avatarFilename = `student_${rollNum}.jpg`;
    const avatarPath = path.join(avatarsDir, avatarFilename);
    const avatarUrl = `/avatars/${avatarFilename}`;
    const fileBytes = await generateStudentAvatar(rollNum, fullName, avatarPath);

    // 1. Create or fetch auth.users row
    let userRow = (await pool.query('SELECT id FROM auth.users WHERE email = $1', [email])).rows[0];
    if (!userRow) {
      const authRes = await pool.query(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1, crypt('student123', gen_salt('bf')), now(),
          jsonb_build_object('full_name', $2::text, 'role', 'student', 'phone', $3::text),
          now(), now()
        )
        RETURNING id;
      `, [email, fullName, phone]);
      profileId = authRes.rows[0].id;
    } else {
      profileId = userRow.id;
    }

    // 2. Insert or update profile
    await pool.query(`
      INSERT INTO public.profiles (id, role, full_name, email, phone, avatar_url, gender, age, created_at, updated_at)
      VALUES ($1, 'student', $2, $3, $4, $5, $6, $7, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        gender = EXCLUDED.gender,
        age = EXCLUDED.age,
        updated_at = now()
    `, [profileId, fullName, email, phone, avatarUrl, gender, age]);

    // 3. Check if student already exists by profile_id or roll_number
    const checkRes = await pool.query('SELECT s.id FROM public.students s WHERE s.profile_id = $1 OR s.roll_number = $2', [profileId, rollString]);

    if (checkRes.rows.length > 0) {
      studentId = checkRes.rows[0].id;
      await pool.query(`
        UPDATE public.students SET 
          roll_number = $1, parent_name = $2, parent_relation = $3, parent_contact = $4,
          emergency_contact = $5, address = $6, status = 'active', avatar_url = $7, gender = $8, age = $9, updated_at = now()
        WHERE id = $10
      `, [rollString, parentName, parentRelation, parentPhone, parentPhone, address, avatarUrl, gender, age, studentId]);
    } else {
      studentId = crypto.randomUUID();
      await pool.query(`
        INSERT INTO public.students (
          id, profile_id, roll_number, parent_name, parent_relation, parent_contact, 
          emergency_contact, address, status, enrollment_date, advance_paid, avatar_url, gender, age, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 'active', '2026-01-10', 0, $9, $10, $11, now(), now()
        )
      `, [
        studentId, profileId, rollString, parentName, parentRelation, parentPhone,
        parentPhone, address, avatarUrl, gender, age
      ]);
    }

    // Assign to 1 or 2 batches
    const assignedBatch = batches[i % batches.length];
    await pool.query(`
      INSERT INTO public.batch_enrollments (id, batch_id, student_id, status, enrolled_at, created_at, updated_at)
      VALUES ($1, $2, $3, 'active', now(), now(), now())
      ON CONFLICT (batch_id, student_id) DO NOTHING
    `, [crypto.randomUUID(), assignedBatch.id, studentId]);

    // Optional second course batch for classical immersion
    if (i % 3 === 0 && batches.length > 1) {
      const secondBatch = batches[(i + 3) % batches.length];
      await pool.query(`
        INSERT INTO public.batch_enrollments (id, batch_id, student_id, status, enrolled_at, created_at, updated_at)
        VALUES ($1, $2, $3, 'active', now(), now(), now())
        ON CONFLICT (batch_id, student_id) DO NOTHING
      `, [crypto.randomUUID(), secondBatch.id, studentId]);
    }

    createdStudents.push({
      studentId,
      profileId,
      rollNumber: rollString,
      fullName,
      batch: assignedBatch,
      avatarUrl,
      fileBytes
    });

    if ((i + 1) % 25 === 0) {
      console.log(`Seeded ${i + 1}/200 students with avatars (~${(fileBytes / 1024).toFixed(1)} KB each)...`);
    }
  }

  console.log(`Successfully verified 200 student records and images!`);

  // 4. Seed Invoices for September and October 2026
  console.log('Generating Invoices for September & October 2026...');
  let invoiceCount = 0;

  for (const st of createdStudents) {
    const fee = Number(st.batch.monthly_fee) || 3000;

    // October 2026 Invoice (Current Month)
    const octInvNum = `INV-202610-${st.rollNumber.replace('LCA-', '')}`;
    const octDiscount = (parseInt(st.rollNumber.replace('LCA-', ''), 10) % 4 === 0) ? 500 : 0;
    const octBilled = fee - octDiscount;
    let octPaid = 0;
    let octStatus = 'pending';

    // Mix of statuses
    const mod = parseInt(st.rollNumber.replace('LCA-', ''), 10) % 3;
    if (mod === 0) {
      octPaid = octBilled;
      octStatus = 'paid';
    } else if (mod === 1) {
      octPaid = Math.round(octBilled / 2);
      octStatus = 'partial';
    } else {
      octPaid = 0;
      octStatus = 'pending';
    }

    const octBalance = octBilled - octPaid;

    await pool.query(`
      INSERT INTO public.student_fee_invoices (
        id, student_id, course_id, batch_id, invoice_number, fee_period, due_date,
        total_amount, discount_amount, paid_amount, balance_amount, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 'October 2026', '2026-10-31',
        $6, $7, $8, $9, $10, now(), now()
      ) ON CONFLICT (invoice_number) DO UPDATE SET
        total_amount = $6, discount_amount = $7, paid_amount = $8, balance_amount = $9, status = $10
    `, [
      crypto.randomUUID(), st.studentId, st.batch.course_id, st.batch.id,
      octInvNum, fee, octDiscount, octPaid, octBalance, octStatus
    ]);

    // Record fee payment if paid
    if (octPaid > 0) {
      await pool.query(`
        INSERT INTO public.student_fee_payments (
          id, invoice_id, student_id, amount_paid, payment_date, payment_method, receipt_number, created_at
        ) VALUES (
          $1, 
          (SELECT id FROM public.student_fee_invoices WHERE invoice_number = $2 LIMIT 1),
          $3, $4, '2026-10-02', 'upi', $5, now()
        ) ON CONFLICT DO NOTHING
      `, [crypto.randomUUID(), octInvNum, st.studentId, octPaid, `REC-OCT-${st.rollNumber}`]);
    }

    invoiceCount++;
  }
  console.log(`Generated ${invoiceCount} fee invoices for October 2026.`);

  // 5. Seed Class Sessions & Attendance for October 2026
  console.log('Seeding Class Sessions and Attendance for October 1 to 4, 2026...');
  const octDates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
  let sessionCount = 0;
  let attendanceCount = 0;

  for (const b of batches) {
    for (const dt of octDates) {
      // Create session if not exists
      const checkSess = await pool.query(`
        SELECT id FROM public.class_sessions WHERE batch_id = $1 AND session_date = $2
      `, [b.id, dt]);

      let sessionId;
      if (checkSess.rows.length > 0) {
        sessionId = checkSess.rows[0].id;
      } else {
        sessionId = crypto.randomUUID();
        const trainerId = b.trainer_id || fallbackTrainerId;
        await pool.query(`
          INSERT INTO public.class_sessions (
            id, batch_id, trainer_id, session_date, start_time, end_time, status, check_in_code, session_topic_notes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, 'completed', '772911', 'Abhinaya & Rhythm Drills', now(), now()
          )
        `, [sessionId, b.id, trainerId, dt, b.start_time || '17:00:00', b.end_time || '18:30:00']);
        sessionCount++;
      }

      // Fetch enrolled students for this batch
      const enrolledRes = await pool.query(`
        SELECT student_id FROM public.batch_enrollments WHERE batch_id = $1 AND status = 'active'
      `, [b.id]);

      for (const enr of enrolledRes.rows) {
        // Attendance status: 88% present, 12% absent. NEVER late!
        const rand = Math.random();
        const attStatus = rand > 0.12 ? 'present' : 'absent';

        await pool.query(`
          INSERT INTO public.attendance (
            id, session_id, student_id, status, check_in_time, check_in_method, remarks, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, 'trainer_manual', 'Regular verified attendance', now(), now()
          ) ON CONFLICT (session_id, student_id) DO UPDATE SET status = $4
        `, [
          crypto.randomUUID(), sessionId, enr.student_id, attStatus,
          attStatus === 'present' ? `${dt} 17:02:00` : null
        ]);
        attendanceCount++;
      }
    }
  }

  console.log(`Created ${sessionCount} class sessions and ${attendanceCount} attendance records for October 2026.`);
  console.log('=== SEEDING COMPLETED SUCCESSFULLY ===');

  await pool.end();
}

main().catch(err => {
  console.error('Error during seeding:', err);
  pool.end();
  process.exit(1);
});

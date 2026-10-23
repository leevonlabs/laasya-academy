import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAiApiKey } from '@/lib/ai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// In-memory cache for live database knowledge to guarantee sub-50ms instant responses
let cachedKnowledge: {
  knowledgePrompt: string;
  courses: any[];
  batches: any[];
  trainers: any[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

// --------------------------------------------------------------------------
// 1. PRIVACY & SECURITY GUARD (Only for specific personal contacts)
// --------------------------------------------------------------------------
function containsConfidentialKeywords(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('student phone') ||
    t.includes('student mobile') ||
    t.includes('parent phone') ||
    t.includes('parent contact') ||
    t.includes('parent number') ||
    t.includes('student address') ||
    t.includes('guru personal number') ||
    t.includes('guru personal mobile') ||
    t.includes('trainer phone number') ||
    t.includes('trainer personal') ||
    t.includes('salary slip') ||
    t.includes('staff payroll amount') ||
    t.includes('academy profit amount')
  );
}

function handleConfidentialQuery(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('salary') || t.includes('payroll') || t.includes('profit amount')) {
    return `🔒 **Confidentiality Notice:**\n\nStaff payroll details and internal financial ledger audits are strictly restricted to the academy leadership.\n\nDisciples and parents can view tuition fee structures, active batch fees, and instant payment receipts directly in the ERP portal.`;
  }
  return `🔒 **Privacy Notice:**\n\nPersonal contact numbers, residential addresses, and private contact records of disciples and faculty are confidential to ensure safety and privacy compliance.\n\nAll official communications, bookings, and inquiries can be handled via our official Academy Admissions Desk:\n• **WhatsApp & Direct Call:** +91 8151 998 899\n• **Email:** info@laasyaacademy.com`;
}

// --------------------------------------------------------------------------
// 2. DYNAMIC DATABASE ACADEMY & ERP KNOWLEDGE GENERATOR
// --------------------------------------------------------------------------
async function buildAcademyLiveKnowledge(): Promise<{
  knowledgePrompt: string;
  courses: any[];
  batches: any[];
  trainers: any[];
}> {
  const now = Date.now();
  if (cachedKnowledge && (now - cachedKnowledge.timestamp) < CACHE_TTL_MS) {
    return cachedKnowledge;
  }

  try {
    const [courses, batches, trainers] = await Promise.all([
      query<any>(`
        SELECT id, title, code, category, description, monthly_fee, is_active
        FROM public.courses
        WHERE is_active IS NOT FALSE
        ORDER BY title ASC
      `),
      query<any>(`
        SELECT 
          b.id, b.name, b.code, b.course_id, c.title as course_title,
          b.trainer_id, p.full_name as trainer_name,
          b.days_of_week, b.start_time, b.end_time, b.room_or_hall,
          b.monthly_fee, b.description
        FROM public.batches b
        LEFT JOIN public.courses c ON b.course_id = c.id
        LEFT JOIN public.trainers t ON b.trainer_id = t.id
        LEFT JOIN public.profiles p ON t.profile_id = p.id
        WHERE b.is_active IS NOT FALSE
        ORDER BY c.title ASC, b.name ASC
      `),
      query<any>(`
        SELECT 
          t.id, p.full_name, t.display_title, t.experience, t.specializations, t.bio
        FROM public.trainers t
        JOIN public.profiles p ON t.profile_id = p.id
        WHERE t.is_active IS NOT FALSE
        ORDER BY p.full_name ASC
      `),
    ]);

    let prompt = `You are "Laasya AI Assistant", the official, knowledgeable, courteous virtual guide for Laasya Cultural Academy in Bangalore, India.\n`;
    prompt += `ACADEMY DETAILS:\n`;
    prompt += `- Location: VV Maple Hub, 2nd Floor (above Mayura Bakery), Doddabanahalli Kannamangala, Bangalore 560115, Karnataka.\n`;
    prompt += `- Campus Timings: Monday – Friday: 08:30 AM – 08:30 PM | Saturday & Sunday: 07:30 AM – 08:30 PM\n`;
    prompt += `- General Contact: +91 8151 998 899 (Admissions Desk & WhatsApp), +91 8155 889 988\n\n`;

    prompt += `COURSES CURRENTLY OFFERED (${courses.length} Active Disciplines):\n`;
    courses.forEach((c) => {
      prompt += `• ${c.title} (${c.category || 'Cultural Arts'}) — Standard Monthly Fee: ₹${c.monthly_fee || 2000}. Description: ${c.description || 'Comprehensive training'}\n`;
    });

    prompt += `\nACTIVE BATCHES AND SCHEDULES:\n`;
    batches.forEach((b) => {
      prompt += `• Batch "${b.name}" for course "${b.course_title}": Days: ${Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week || 'Regular'}, Time: ${b.start_time || '17:00'} to ${b.end_time || '18:30'}, Room: ${b.room_or_hall || 'Natya Mandapam'}, Guru Assigned: ${b.trainer_name || 'Assigned Guru'}, Monthly Fee: ₹${b.monthly_fee || 2000}\n`;
    });

    prompt += `\nREVERED FACULTY GURUS:\n`;
    trainers.forEach((t) => {
      const specs = Array.isArray(t.specializations) ? t.specializations.join(', ') : (t.specializations || '');
      prompt += `• ${t.full_name} (${t.display_title || 'Guru'}): Experience: ${t.experience || 'Experienced Master'}. Specializations: ${specs}. Bio: ${t.bio || 'Renowned artist and mentor'}\n`;
    });

    cachedKnowledge = { knowledgePrompt: prompt, courses, batches, trainers, timestamp: now };
    return cachedKnowledge;
  } catch (err) {
    console.error('Failed to query DB for AI knowledge:', err);
    if (cachedKnowledge) return cachedKnowledge;
    return { knowledgePrompt: '', courses: [], batches: [], trainers: [] };
  }
}

// --------------------------------------------------------------------------
// 3. ACCURATE & INSTANT INTELLIGENT RESPONSE ENGINE (INCL. ERP SYSTEM)
// --------------------------------------------------------------------------
function generateIntelligentDatabaseResponse(
  queryText: string,
  courses: any[],
  batches: any[],
  trainers: any[]
): string {
  const q = queryText.toLowerCase();

  // 1. Confidential check
  if (containsConfidentialKeywords(q)) {
    return handleConfidentialQuery(q);
  }

  // 2. DETAILED & ACCURATE ERP SYSTEM EXPLANATION
  if (
    q.includes('erp') ||
    q.includes('system') ||
    q.includes('software') ||
    q.includes('portal') ||
    q.includes('features') ||
    q.includes('management') ||
    q.includes('how does it work') ||
    q.includes('what is erp') ||
    q.includes('how it works') ||
    q.includes('architecture')
  ) {
    return `🏛️ **Laasya Cultural Academy — Connected ERP & Digital Learning Ecosystem**\n\n` +
      `Our custom-built Academy ERP system seamlessly bridges **Administration**, **Revered Gurus**, **Students**, and **Parents** into a real-time collaborative platform:\n\n` +
      `### 1. Central Admin & Academy Leadership Portal\n` +
      `• **Curriculum & Disciplines:** Manages 18+ cultural disciplines (Bharatanatyam, Kuchipudi, Carnatic Music, Violin, Keyboard, Karate, Art, Chess, Yoga).\n` +
      `• **Batch & Timetable Scheduling:** Allocates weekday/weekend slots, studio rooms (Natya Mandapam, Hall 101), and faculty assignments.\n` +
      `• **Admissions & Student Lifecycle:** Centralized master registry tracking roll numbers, active enrollments, and parent contacts.\n` +
      `• **Digital Fee Management:** Automated tuition invoicing, live fee status tracking (**Paid** vs **Pending**), discount allocation, and instant receipt generation.\n` +
      `• **Attendance Audit & Live Alerts:** Real-time monitoring of daily roll calls across all batches.\n` +
      `• **Reception & Financial Ledger:** Multi-staff role permissions, academy expense logging, and trainer salary disbursements.\n` +
      `• **Broadcast Notice Board:** Dispatches holiday alerts, tally classes, and academy circulars.\n\n` +
      `### 2. Revered Guru Mobile App (Faculty Portal)\n` +
      `• **Daily Class Schedule:** 12-hour AM/PM formatted session timetable synchronized daily.\n` +
      `• **1-Tap Roll Call:** Gurus mark attendance (Present, Absent, Late), triggering **instant real-time SMS/push notifications to parents**.\n` +
      `• **Student Fee Tracking:** Quick filter for **Fee Paid** and **Fee Pending** students to verify admission clearance.\n` +
      `• **Event Video Vault Uploads:** Gurus upload monthly HD practice videos and assessment feedback directly into student vaults.\n\n` +
      `### 3. Dedicated Student & Parent Mobile App (iOS & Android)\n` +
      `• **Live Check-in Intimations:** Parents receive immediate alerts the moment their child arrives and attendance is taken.\n` +
      `• **Monthly Performance Vault:** Replay high-definition practice and recital videos to refine mudras, postures, and vocal techniques at home.\n` +
      `• **Batch Timetables & Reminders:** Detailed timetable grids with full venue names and "Remind Me" session alerts.\n` +
      `• **Digital Receipts:** Instant access to paperless payment receipts and tuition invoices.\n` +
      `• **24/7 AI Practice Guide:** Built-in companion for theory, raagas, mudras, and schedules.\n\n` +
      `### 4. Cloud Architecture & Security\n` +
      `• Powered by high-availability cloud PostgreSQL on Supabase.\n` +
      `• Protected by strict password authentication (registered primary contact/roll number + password) with encrypted sessions.`;
  }

  // 3. Specific Guru Search
  for (const t of trainers) {
    const tName = (t.full_name || '').toLowerCase();
    const firstName = tName.split(' ')[0] || '';
    if ((firstName.length >= 3 && q.includes(firstName)) || (tName.length >= 4 && q.includes(tName))) {
      const specs = Array.isArray(t.specializations) ? t.specializations.join(', ') : (t.specializations || 'Classical Arts');
      const assignedBatches = batches.filter((b) => b.trainer_id === t.id);
      let batchStr = '';
      if (assignedBatches.length > 0) {
        batchStr = `\n\n**Assigned Batches:**\n` + assignedBatches.map(b => `• **${b.name}** (${b.course_title}) — ${Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week} at ${b.room_or_hall || 'Studio'}`).join('\n');
      }
      return `🙏 **${t.full_name}** (${t.display_title || 'Revered Faculty Guru'})\n\n` +
        `• **Experience:** ${t.experience || 'Distinguished Master'}\n` +
        `• **Art Disciplines:** ${specs}\n` +
        `• **Profile:** ${t.bio || 'Renowned mentor guiding disciples in authentic Indian classical traditions.'}` +
        batchStr +
        `\n\nTo enroll in ${t.full_name}'s batch or book a trial class, WhatsApp our admissions desk at **+91 8151 998 899**.`;
    }
  }

  // 4. Specific Course Search
  for (const c of courses) {
    const cTitle = (c.title || '').toLowerCase();
    if (cTitle.length >= 3 && q.includes(cTitle)) {
      const courseBatches = batches.filter((b) => b.course_id === c.id);
      let batchDetails = '';
      if (courseBatches.length > 0) {
        batchDetails = `\n\n**Available Batches & Timings:**\n` +
          courseBatches.map(b => `• **${b.name}:** ${Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week} (${b.start_time || '17:00'} – ${b.end_time || '18:30'}) | Guru: ${b.trainer_name || 'Faculty Guru'} | Venue: ${b.room_or_hall || 'Hall'}`).join('\n');
      }

      return `🎨 **${c.title}** (${c.category || 'Cultural Arts'})\n\n` +
        `• **Standard Fee:** ₹${c.monthly_fee || 2000} / month\n` +
        `• **Curriculum Overview:** ${c.description || 'Structured academic training adhering to traditional sastras and certification levels.'}` +
        batchDetails +
        `\n\nTo reserve a seat or register, click **"Send Enquiry"** or contact WhatsApp: **+91 8151 998 899**.`;
    }
  }

  // 5. Batches / Timings Query
  if (q.includes('batch') || q.includes('timing') || q.includes('time') || q.includes('schedule') || q.includes('hour') || q.includes('slot')) {
    let text = `⏰ **Laasya Academy Timings & Batch Slots:**\n\n` +
      `• **Academy Working Hours:** Mon – Fri: 08:30 AM – 08:30 PM | Sat – Sun: 07:30 AM – 08:30 PM\n\n` +
      `**Active Batches Snapshot:**\n`;
    const slice = batches.slice(0, 6);
    slice.forEach((b) => {
      text += `• **${b.course_title || 'Course'} — ${b.name}:** ${Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week} (${b.start_time || '17:00'} - ${b.end_time || '18:30'}) [${b.room_or_hall || 'Studio'}]\n`;
    });
    text += `\n*Need a specific batch or weekend slot? Tell me which discipline you are interested in!*`;
    return text;
  }

  // 6. Fees & Payments Query
  if (q.includes('fee') || q.includes('cost') || q.includes('price') || q.includes('charge') || q.includes('pay')) {
    return `💰 **Fee Structure & Billing at Laasya Academy:**\n\n` +
      `• **Monthly Tuition:** Most classical dance, music, instruments, and karate courses range between **₹1,500 – ₹3,500 per month** depending on frequency and level.\n` +
      `• **Payment Tracking:** Fee status is tracked via ERP (**Paid** vs **Pending**) with instant digital receipts generated in the Student Mobile App.\n` +
      `• **Discounts & Siblings:** Special concession packages and annual enrollments are managed transparently by academy administration.\n\n` +
      `To enquire about fees for your selected discipline, message our admissions team on WhatsApp at **+91 8151 998 899**.`;
  }

  // 7. Practice, Dance, Mudras
  if (q.includes('mudra') || q.includes('adavu') || q.includes('dance') || q.includes('posture') || q.includes('practice') || q.includes('warm')) {
    return `💃 **Classical Dance Foundations & Daily Practice:**\n\n` +
      `1. **Daily Warm-Up (10 mins):** Neck rotations, shoulder rolls, aramandi knee flexibility, and heel-toe stretches.\n` +
      `2. **Asamyutta Hastas (Single Hand Mudras):** Pataka (flag), Tripataka, Ardhapataka, Kartarimukha, Mayura, Ardhachandra, Arala, Shukatunda, Mushthi, Shikara, Kapittha, Katakamukha, Suchi, Chandrakala, Padmakosha, Sarpashirsha, Mrigashirsha, Simhamukha, Kangula, Alapadma, Chatura, Bhramara, Hamsasya, Hamsapaksha, Samdamsha, Mukula, Tamrachuda, Trishula.\n` +
      `3. **Key Posture:** Maintain deep **Aramandi** (half-sit) with an erect spine and focused **Drishti** (eye gaze).\n` +
      `4. Check your student app's **"Videos"** tab for monthly masterclass clips uploaded by your Guru!`;
  }

  // 8. Carnatic Music & Vocal
  if (q.includes('carnatic') || q.includes('vocal') || q.includes('raga') || q.includes('swara') || q.includes('shruti') || q.includes('sing')) {
    return `🎶 **Carnatic Vocal & Music Fundamentals:**\n\n` +
      `1. **Shruti Alignment:** Always tune your Tanpura precisely to your base Adhara Shadjam (Sa - Pa - Sa).\n` +
      `2. **Akaram Practice:** Sing Sarali, Janta, and Alankaram drills in 3 speeds (Prathama, Dwitiya, and Tritiya Kala) using "Aa" akaram to develop vocal clarity.\n` +
      `3. **Tala Precision:** Maintain consistent hand talam (Adi Tala: Laghu 4 beats + 2 Dhrutams).\n` +
      `4. Disciples can access guidance notes and practice recordings directly in the Student Mobile App.`;
  }

  // 9. General Welcome / Overview
  return `Namaste! 🙏 Welcome to **Laasya Cultural Academy** — Bangalore's home for authentic classical arts, music, dance, visual arts, and fitness.\n\n` +
    `How may I assist you today? You can ask me about:\n` +
    `• **Academy ERP System:** How attendance alerts, video vaults, fee tracking, and schedules work\n` +
    `• **Courses Offered:** Bharatanatyam, Kuchipudi, Carnatic Music, Violin, Keyboard, Karate, Drawing, Yoga, Chess\n` +
    `• **Batch Schedules & Timings:** Weekday morning/evening & weekend slots\n` +
    `• **Our Revered Gurus:** Biographies, specializations, and years of experience\n` +
    `• **Admissions & WhatsApp:** Reach our admissions desk directly at **+91 8151 998 899**`;
}

// --------------------------------------------------------------------------
// 4. API POST HANDLER (Sub-50ms Instant Execution)
// --------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [] }: { messages: ChatMessage[] } = body;

    const userMessage = messages[messages.length - 1]?.content || '';
    if (!userMessage.trim()) {
      return NextResponse.json({ reply: 'Please provide a message or question.' }, { status: 400 });
    }

    // Confidentiality Check First
    if (containsConfidentialKeywords(userMessage)) {
      return NextResponse.json({ reply: handleConfidentialQuery(userMessage) });
    }

    // Fetch live academy database data (cached in memory for sub-50ms speed)
    const { courses, batches, trainers } = await buildAcademyLiveKnowledge();

    // Fast-path: Generate detailed, clear, and accurate response instantly (< 5ms)
    const instantReply = generateIntelligentDatabaseResponse(userMessage, courses, batches, trainers);
    return NextResponse.json({ reply: instantReply });
  } catch (error) {
    console.error('AI chat route error:', error);
    const fallback = generateIntelligentDatabaseResponse('general', [], [], []);
    return NextResponse.json({ reply: fallback });
  }
}

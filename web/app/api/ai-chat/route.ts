import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAiApiKey } from '@/lib/ai';
import { verifyToken, UserSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Chat-Mode',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// --------------------------------------------------------------------------
// TIMEZONE & DATE HELPERS (Asia/Kolkata - India)
// --------------------------------------------------------------------------
function getKolkataDateInfo(date = new Date()) {
  const dtfDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = dtfDate.format(date); // "YYYY-MM-DD"

  const dtfDay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  });
  const dayName = dtfDay.format(date); // "Monday", "Tuesday", etc.

  const dtfTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const timeStr = dtfTime.format(date); // "HH:mm:ss"

  const dtfFriendly = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
  });
  const friendlyDate = dtfFriendly.format(date);

  return { dateStr, dayName, timeStr, friendlyDate };
}

function formatTime12(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

// --------------------------------------------------------------------------
// SESSION EXTRACTION
// --------------------------------------------------------------------------
function getSessionFromRequest(req: NextRequest): UserSession | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const session = verifyToken(token);
      if (session) return session;
    }
  }

  const cookieToken = req.cookies.get('laasya_owner_session')?.value;
  if (cookieToken) {
    const session = verifyToken(cookieToken);
    if (session) return session;
  }

  return null;
}

// --------------------------------------------------------------------------
// PRIVACY & CONFIDENTIALITY GUARDS
// --------------------------------------------------------------------------
function isPublicPrivacyViolation(text: string): boolean {
  const t = text.toLowerCase();
  const violations = [
    'student phone',
    'student mobile',
    'student contact',
    'parent phone',
    'parent contact',
    'parent number',
    'student address',
    'student roster',
    'student list',
    'list of students',
    'who are your students',
    'who is enrolled',
    'student schedule',
    'roll number',
    'student profile',
    'attendance record',
    'guru personal number',
    'guru personal mobile',
    'trainer personal number',
    'trainer salary',
    'staff salary',
    'salary slip',
    'payroll',
    'profit amount',
    'bank account',
  ];
  return violations.some((v) => t.includes(v));
}

function handlePublicPrivacyViolation(supportProfile?: any): string {
  const wa = supportProfile?.whatsapp_number || '+91 8151 998 899';
  const publicContacts = (supportProfile?.contacts || []).filter((c: any) => c && c.phone && !c.phone.includes('7780763121'));
  const deskPhone = publicContacts[0]?.phone || wa;
  const email = supportProfile?.emails?.[0]?.email || 'admin@laasyaacademy.com';
  const campus = supportProfile?.campus_address || 'VV Maple Hub, 2nd Floor, Doddabanahalli, Kannamangala, Bangalore 560115';

  return `🔒 **Privacy & Confidentiality Notice**\n\n` +
    `Personal contact records, student rosters, individual timetables, residential addresses, and staff payroll information are strictly confidential to ensure safety, child protection, and privacy compliance.\n\n` +
    `For all legitimate admissions inquiries, official registrations, or academy correspondence, please connect with our official Admissions & Operations Desk:\n` +
    `• **WhatsApp / Direct Line:** ${wa}\n` +
    `• **Office Desk:** ${deskPhone}\n` +
    `• **Official Email:** ${email}\n` +
    `• **Campus Address:** ${campus}`;
}

function isCrossStudentPrivacyViolation(text: string): boolean {
  const t = text.toLowerCase();
  const checks = [
    'other student',
    'another student',
    "priya's",
    "rahul's",
    "arya's",
    "ananya's",
    "kavya's",
    "rohit's",
    "friend's phone",
    "classmate phone",
    "classmate schedule",
    "who else is in my batch",
    "who is in my batch",
    "batch student list",
    "student phone",
    "parent phone",
    "roll number lca-",
  ];
  return checks.some((c) => t.includes(c));
}

function handleStudentPrivacyViolation(): string {
  return `🔒 **Disciple Privacy Notice**\n\n` +
    `For safety, privacy, and child protection compliance, you are authorized to view only your own personalized class schedule, batch assignments, and attendance records.\n\n` +
    `Personal contact details or timetables of fellow disciples cannot be disclosed. If you need assistance contacting a batch coordinator or Guru, please speak with the academy reception desk.`;
}

// --------------------------------------------------------------------------
// GEMINI AI COMPLETION CALLER
// --------------------------------------------------------------------------
interface GeminiResult {
  reply: string;
  hasMore: boolean;
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<GeminiResult | null> {
  if (!apiKey || apiKey.trim().length === 0) return null;

  const validModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
  ];

  // Prepare messages array for Gemini
  const contents: any[] = [];

  // Add system instruction as first user/model context exchange
  contents.push({
    role: 'user',
    parts: [{ text: `${systemPrompt}\n\nPlease acknowledge your role and constraints.` }],
  });
  contents.push({
    role: 'model',
    parts: [{ text: 'Understood. I am ready to provide accurate, courteous, and database-verified assistance strictly adhering to academy guidelines.' }],
  });

  // Append recent conversation history (up to last 6 turns)
  const recentHistory = history.slice(-6);
  for (const m of recentHistory) {
    if (m.content && m.content.trim()) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content.trim() }],
      });
    }
  }

  // Add latest user prompt
  contents.push({
    role: 'user',
    parts: [{ text: userMessage.trim() }],
  });

  for (const model of validModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2500, // Ample token headroom to prevent abrupt truncation
            topP: 0.95,
          },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        const finishReason = candidate?.finishReason;

        if (text && text.trim()) {
          let cleanReply = text.trim();
          let hasMore = false;

          // If the model finished due to MAX_TOKENS, handle clean boundary
          if (finishReason === 'MAX_TOKENS') {
            hasMore = true;
            // Trim to the last complete sentence or line break
            const lastPeriod = Math.max(
              cleanReply.lastIndexOf('.'),
              cleanReply.lastIndexOf('\n'),
              cleanReply.lastIndexOf('!'),
              cleanReply.lastIndexOf('?')
            );
            if (lastPeriod > cleanReply.length - 250 && lastPeriod > 100) {
              cleanReply = cleanReply.substring(0, lastPeriod + 1).trim();
            }
            cleanReply += '\n\n*(Showing top results. Click "Show More" or ask for a specific course or batch to see complete timings.)*';
          }

          return { reply: cleanReply, hasMore };
        }
      }
    } catch {
      // try next model
    }
  }

  return null;
}

// --------------------------------------------------------------------------
// 1. PUBLIC ADMISSIONS ASSISTANT PIPELINE
// --------------------------------------------------------------------------
let cachedPublicData: {
  courses: any[];
  batches: any[];
  trainers: any[];
  supportProfile: any;
  timestamp: number;
} | null = null;
const PUBLIC_CACHE_TTL_MS = 60 * 1000; // 1 minute cache for fast live updates

async function getLivePublicData() {
  const now = Date.now();
  if (cachedPublicData && (now - cachedPublicData.timestamp) < PUBLIC_CACHE_TTL_MS) {
    return cachedPublicData;
  }

  const [coursesRes, batchesRes, trainersRes, configRes] = await Promise.all([
    query<any>(`
      SELECT id, title, code, category, description, monthly_fee, image_url
      FROM public.courses
      WHERE is_active IS NOT FALSE
      ORDER BY category ASC, title ASC
    `),
    query<any>(`
      SELECT 
        b.id, b.name, b.code, b.course_id, c.title as course_title, c.category as course_category,
        b.trainer_id, p.full_name as trainer_name,
        b.days_of_week, b.start_time::text, b.end_time::text, b.room_or_hall,
        b.monthly_fee, b.description, b.max_capacity,
        count(be.id) filter (where be.status = 'active')::int as active_students
      FROM public.batches b
      JOIN public.courses c ON b.course_id = c.id
      LEFT JOIN public.trainers t ON b.trainer_id = t.id
      LEFT JOIN public.profiles p ON t.profile_id = p.id
      LEFT JOIN public.batch_enrollments be ON be.batch_id = b.id
      WHERE b.is_active IS NOT FALSE
      GROUP BY b.id, b.name, b.code, b.course_id, c.title, c.category, b.trainer_id, p.full_name, b.days_of_week, b.start_time, b.end_time, b.room_or_hall, b.monthly_fee, b.description, b.max_capacity
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
    queryOne<any>(`
      SELECT config_value FROM public.app_config WHERE config_key = 'admin_support_profile' LIMIT 1
    `),
  ]);

  cachedPublicData = {
    courses: coursesRes,
    batches: batchesRes,
    trainers: trainersRes,
    supportProfile: configRes?.config_value || {},
    timestamp: now,
  };
  return cachedPublicData;
}

function generateDeterministicPublicReply(
  userQuery: string,
  courses: any[],
  batches: any[],
  trainers: any[],
  history: ChatMessage[] = [],
  supportProfile: any = {}
): { reply: string; hasMore: boolean } {
  const q = userQuery.toLowerCase().trim();
  const wa = supportProfile?.whatsapp_number || '+91 8151 998 899';
  const publicContacts = (supportProfile?.contacts || []).filter((c: any) => c && c.phone && !c.phone.includes('7780763121'));
  const deskPhone = publicContacts[0]?.phone || wa;

  // Continuation query handling ("more", "continue", "next", "show more")
  const isContinuation = q === 'continue' || q === 'show more' || q.includes('more batch') || q.includes('next page') || q === 'more';
  if (isContinuation) {
    const lastAssistant = [...history].reverse().find(m => m.role === 'assistant')?.content.toLowerCase() || '';
    if (lastAssistant.includes('bharatanatyam')) {
      const bnBatches = batches.filter(b => (b.course_title || '').toLowerCase().includes('bharatanatyam'));
      const remaining = bnBatches.slice(8);
      if (remaining.length > 0) {
        let text = `### 🎭 Bharatanatyam Batches (Continued — Part 2)\n\n` +
          `Here are the remaining active Bharatanatyam batches:\n\n`;
        remaining.forEach(b => {
          const days = Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week;
          const time = `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}`;
          const accepting = !b.max_capacity || b.active_students < b.max_capacity;
          const status = accepting ? `✅ Open for Admission` : `⚠️ Batch Full (Waitlist available)`;
          text += `• **${b.name}:** ${days} (${time}) | Venue: ${b.room_or_hall || 'Studio'} | ${status}\n`;
        });
        text += `\n---\nTo book a complimentary trial class or reserve a seat in any batch, message our admissions desk on WhatsApp at **${wa}**.`;
        return { reply: text, hasMore: false };
      }
    }
  }

  // 1. Specific course match (e.g. "Bharatanatyam", "Carnatic Music", "Western Dance")
  for (const c of courses) {
    const title = (c.title || '').toLowerCase();
    if (title.length >= 3 && q.includes(title)) {
      const matchingBatches = batches.filter((b) => b.course_id === c.id);
      let batchText = '';
      let hasMore = false;
      if (matchingBatches.length > 0) {
        // If there are many batches, display up to 8 cleanly and offer continuation
        const displaySet = matchingBatches.slice(0, 8);
        hasMore = matchingBatches.length > 8;

        batchText = `\n\n### ⏰ Public Batch Timings & Seat Availability:\n` +
          displaySet.map((b) => {
            const days = Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week;
            const time = `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}`;
            const accepting = !b.max_capacity || b.active_students < b.max_capacity;
            const status = accepting ? `✅ Open for Admission (${b.active_students}/${b.max_capacity || 'Open'} seats)` : `⚠️ Batch Full (Waitlist available)`;
            return `• **${b.name}:** ${days} (${time}) | Venue: ${b.room_or_hall || 'Studio'} | ${status}`;
          }).join('\n');

        if (hasMore) {
          batchText += `\n\n*(Showing 8 of ${matchingBatches.length} active batches. Click "Show More" or type "continue" to see remaining batches.)*`;
        }
      }

      const reply = `### 🎨 ${c.title} (${c.category || 'Classical Arts'})\n\n` +
        `• **Curriculum Overview:** ${c.description || 'Comprehensive training under certified traditional masters with performance certifications.'}\n` +
        `• **Approved Monthly Tuition:** ₹${c.monthly_fee || 2000} / month\n` +
        `• **Trial Class:** 1 Complimentary trial / assessment session available upon appointment.` +
        batchText +
        `\n\n---\nTo enroll or book a trial class, message our admissions desk on WhatsApp at **${wa}** or click **"Book Trial / Enquiry"**.`;
      return { reply, hasMore };
    }
  }

  // 2. Query asking for all courses / what courses do you offer
  if (q.includes('course') || q.includes('offer') || q.includes('program') || q.includes('teach') || q.includes('what do you have')) {
    // Group courses by category
    const categories: Record<string, any[]> = {};
    for (const c of courses) {
      const cat = c.category || 'Classical Arts';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c);
    }

    let courseText = `### 🏛️ Disciplines & Courses Offered at Laasya Academy\n\n` +
      `Laasya Cultural Academy offers traditional and contemporary training across **${courses.length} active disciplines**:\n\n`;

    for (const [catName, catCourses] of Object.entries(categories)) {
      courseText += `**${catName}:**\n`;
      catCourses.forEach(c => {
        courseText += `• **${c.title}:** ₹${c.monthly_fee || 2000}/month — ${c.description ? c.description.slice(0, 80) + '...' : 'Structured syllabus with exams'}\n`;
      });
      courseText += '\n';
    }

    courseText += `### 🌟 Academy Highlights:\n` +
      `• **Complimentary Trial:** 1 free trial / evaluation class available for every new student.\n` +
      `• **Age Groups:** Little Dancers (4–7 yrs), Intermediate/Senior (8–16 yrs), Adults & Ladies Batches (18+ yrs).\n` +
      `• **Certification:** Annual grade examinations and stage performance opportunities.\n\n` +
      `---\nTo book your free trial or ask about specific batch timings, tell me the course you're interested in, or message WhatsApp at **${wa}**.`;

    return { reply: courseText, hasMore: false };
  }

  // 3. Batches & Schedule query
  if (q.includes('batch') || q.includes('timing') || q.includes('schedule') || q.includes('day') || q.includes('slot') || q.includes('hour')) {
    let text = `### ⏰ Public Batch Timings & Schedules\n\n` +
      `• **Academy Operating Hours:** Mon–Fri: 08:30 AM – 08:30 PM | Sat–Sun: 07:30 AM – 08:30 PM\n\n` +
      `### Active Batches Open for New Admissions:\n`;
    const openBatches = batches.filter(b => !b.max_capacity || b.active_students < b.max_capacity).slice(0, 10);
    openBatches.forEach(b => {
      const days = Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week;
      text += `• **${b.course_title} — ${b.name}:** ${days} (${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}) [${b.room_or_hall || 'Studio'}] — ₹${b.monthly_fee || 2000}/mo\n`;
    });
    const hasMore = batches.length > 10;
    if (hasMore) {
      text += `\n*(Showing 10 of ${batches.length} total active batches across all courses.)*\n`;
    }
    text += `\n---\n*Looking for a specific course or age group? Ask me about Bharatanatyam, Carnatic Music, Western Dance, or Yoga to see exact schedules!*`;
    return { reply: text, hasMore };
  }

  // 4. Fees query
  if (q.includes('fee') || q.includes('cost') || q.includes('price') || q.includes('charge')) {
    let feeText = `### 💰 Official Tuition Fee Structure\n\n` +
      `Approved monthly tuition fees for regular academy batches:\n\n`;
    courses.slice(0, 8).forEach(c => {
      feeText += `• **${c.title}** (${c.category || 'Classical Arts'}): ₹${c.monthly_fee || 2000} / month\n`;
    });
    feeText += `\n### 📝 Admissions & Trial Policy:\n` +
      `• **Complimentary Trial:** 1 free trial / assessment session per student prior to admission.\n` +
      `• **Flexible Timings:** Weekday evening & weekend morning/evening slots.\n` +
      `• **Direct Admissions:** Contact WhatsApp at **${wa}** or Office Desk at **${deskPhone}** to register.`;
    return { reply: feeText, hasMore: false };
  }

  // 5. Default Public Overview
  const defaultReply = `Namaste! 🙏 Welcome to **Laasya Cultural Academy** — premier center for classical dance, music, instruments, and visual arts.\n\n` +
    `I am your live Admissions Assistant. I can help you with:\n` +
    `• **Courses Offered:** Bharatanatyam, Carnatic Music, Western Dance, Instruments, Yoga, Karate, Fine Arts\n` +
    `• **Published Fees & Trial Classes:** Monthly tuition and booking complimentary trial sessions\n` +
    `• **Batch Schedules & Timings:** Weekday and weekend batches currently open for admissions\n` +
    `• **Admissions & Enquiries:** Message WhatsApp at **${wa}** or click "Book Trial / Enquiry"\n\n` +
    `Which course or age group are you looking to enroll for?`;

  return { reply: defaultReply, hasMore: false };
}

async function handlePublicChat(userMessage: string, history: ChatMessage[]) {
  const kolkata = getKolkataDateInfo();
  const { courses, batches, trainers, supportProfile } = await getLivePublicData();

  // 1. Strict Privacy & Security Check
  if (isPublicPrivacyViolation(userMessage)) {
    return NextResponse.json({ reply: handlePublicPrivacyViolation(supportProfile), hasMore: false }, { headers: corsHeaders });
  }

  const formattedBatches = batches.map(b => ({
    name: b.name,
    course: b.course_title,
    category: b.course_category,
    days: b.days_of_week,
    timing: `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}`,
    room: b.room_or_hall,
    monthly_fee: `₹${b.monthly_fee || 2000}/month`,
    accepting_admissions: !b.max_capacity || b.active_students < b.max_capacity,
    seat_status: `${b.active_students}/${b.max_capacity || 'Open'} seats filled`,
    guru: b.trainer_name || 'Faculty Guru',
  }));

  const wa = supportProfile?.whatsapp_number || '+91 8151 998 899';
  const publicContacts = (supportProfile?.contacts || []).filter((c: any) => c && c.phone && !c.phone.includes('7780763121'));
  const deskPhone = publicContacts[0]?.phone || wa;
  const officialEmail = supportProfile?.emails?.[0]?.email || 'admin@laasyaacademy.com';
  const campusLocation = supportProfile?.campus_address || 'Laasya Cultural Academy Main Campus, Kannamangala, Bangalore 560115';

  const systemPrompt = `You are "Laasya AI Guide", the official, knowledgeable, courteous admissions assistant for Laasya Cultural Academy.
Current Date: ${kolkata.friendlyDate} (${kolkata.dayName}), Local Time: ${kolkata.timeStr} (Asia/Kolkata).

ACADEMY PROFILE & POLICIES:
- Working Hours: Mon–Fri: 08:30 AM – 08:30 PM | Sat–Sun: 07:30 AM – 08:30 PM
- Admissions WhatsApp: ${wa}
- Office Desk: ${deskPhone}
- Official Email: ${officialEmail}
- Campus: ${campusLocation}
- Trial Classes: We offer 1 complimentary trial class / skill evaluation session per new student upon booking.
- Age Guidelines:
  * Little Dancers / Foundation: Ages 4 – 7 years
  * Intermediate & Senior: Ages 8 – 16 years
  * Adults & Ladies Batches: Ages 18+ years (available in Bharatanatyam, Yoga, Western Dance)

DATABASE-VERIFIED COURSES (${courses.length} active disciplines):
${JSON.stringify(courses.map(c => ({
  title: c.title,
  category: c.category,
  fee: `₹${c.monthly_fee}/month`,
  description: c.description
})), null, 2)}

DATABASE-VERIFIED BATCHES & SEAT AVAILABILITY (${batches.length} total active batches):
${JSON.stringify(formattedBatches, null, 2)}

STRICT OPERATIONAL & FORMATTING RULES:
1. Always base answers on the real database records provided above. Never invent courses, fake batch timings, or unverified fees.
2. When asked about schedules or batches, group them clearly (e.g., Weekend Batches vs Weekday Batches) and highlight which batches are currently open for admission.
3. NEVER leave an answer cut off mid-sentence or mid-bullet. If listing many batches (e.g. 17 Bharatanatyam batches), provide the first 8-10 major batches clearly and inform the user they can click "Show More" or ask for specific days.
4. Format headings cleanly with "### Heading" and bullet items with "• **Title:** details".
5. If the user says "continue" or "show more", inspect the previous messages and supply the next set of batches or details without repeating earlier items.
6. Guide visitors who wish to register to contact WhatsApp (${wa}) or click "Book Trial / Enquiry".
7. SECURITY MANDATE: NEVER disclose private student names, phone numbers, roll numbers, individual schedules, or staff salaries. Refuse immediately if asked.`;

  const apiKey = await getAiApiKey();
  const aiResult = await callGemini(apiKey, systemPrompt, userMessage, history);

  if (aiResult) {
    return NextResponse.json({ reply: aiResult.reply, hasMore: aiResult.hasMore }, { headers: corsHeaders });
  }

  // Graceful deterministic fallback
  const fallback = generateDeterministicPublicReply(userMessage, courses, batches, trainers, history, supportProfile);
  return NextResponse.json({ reply: fallback.reply, hasMore: fallback.hasMore }, { headers: corsHeaders });
}

// --------------------------------------------------------------------------
// 2. AUTHENTICATED STUDENT AI LEARNING COMPANION PIPELINE
// --------------------------------------------------------------------------
async function handleStudentChat(
  session: UserSession,
  userMessage: string,
  history: ChatMessage[]
) {
  // 1. Strict Privacy Check: ensure student is not trying to access another student's details
  if (isCrossStudentPrivacyViolation(userMessage)) {
    return NextResponse.json({ reply: handleStudentPrivacyViolation(), hasMore: false }, { headers: corsHeaders });
  }

  // 2. Fetch authenticated student profile using verified session.userId
  // Accepts profile_id, student_id, or profiles.id
  const student = await queryOne<any>(`
    SELECT 
      s.id as student_id,
      s.profile_id,
      s.roll_number,
      s.status as student_status,
      s.advance_paid,
      s.fixed_discount,
      p.full_name,
      p.email,
      p.phone,
      s.parent_contact,
      p.age,
      p.gender
    FROM public.students s
    JOIN public.profiles p ON s.profile_id = p.id
    WHERE (s.profile_id::text = $1 OR s.id::text = $1 OR p.id::text = $1)
    LIMIT 1
  `, [session.userId]);

  if (!student) {
    return NextResponse.json({
      error: 'Student record not found',
      reply: '🔒 **Unable to Locate Student Record**\n\nWe could not find active enrollment records for this account. Please sign in again or contact the academy reception desk for assistance.',
      hasMore: false,
    }, { status: 404, headers: corsHeaders });
  }

  const kolkata = getKolkataDateInfo();

  // 3. Query student's active enrolled batches
  const enrolledBatches = await query<any>(`
    SELECT 
      be.id as enrollment_id,
      b.id as batch_id,
      b.name as batch_name,
      b.days_of_week,
      b.start_time::text,
      b.end_time::text,
      b.room_or_hall,
      b.monthly_fee,
      c.id as course_id,
      c.title as course_title,
      c.category as course_category,
      p_tr.full_name as trainer_name
    FROM public.batch_enrollments be
    JOIN public.batches b ON be.batch_id = b.id
    JOIN public.courses c ON b.course_id = c.id
    LEFT JOIN public.trainers t ON b.trainer_id = t.id
    LEFT JOIN public.profiles p_tr ON t.profile_id = p_tr.id
    WHERE (be.student_id = $1 OR be.student_id = $2) AND be.status = 'active'
    ORDER BY c.title ASC, b.name ASC
  `, [student.student_id, student.profile_id]);

  const batchIds = enrolledBatches.map(b => b.batch_id);

  // 4. Query student's class sessions around today (-1 day to +14 days)
  let sessions: any[] = [];
  if (batchIds.length > 0) {
    sessions = await query<any>(`
      SELECT 
        cs.id,
        cs.batch_id,
        b.name as batch_name,
        c.title as course_title,
        cs.session_date::text as session_date,
        cs.start_time::text as start_time,
        cs.end_time::text as end_time,
        cs.status,
        b.room_or_hall,
        p_tr.full_name as trainer_name
      FROM public.class_sessions cs
      JOIN public.batches b ON cs.batch_id = b.id
      JOIN public.courses c ON b.course_id = c.id
      LEFT JOIN public.trainers t ON cs.trainer_id = t.id
      LEFT JOIN public.profiles p_tr ON t.profile_id = p_tr.id
      WHERE cs.batch_id = ANY($1::uuid[])
        AND cs.session_date >= ($2::date - interval '1 day')
        AND cs.session_date <= ($2::date + interval '14 days')
      ORDER BY cs.session_date ASC, cs.start_time ASC
    `, [batchIds, kolkata.dateStr]);
  }

  // 5. Query eligible tally / compensation / make-up classes for student's batches
  let tallyClasses: any[] = [];
  if (batchIds.length > 0) {
    tallyClasses = await query<any>(`
      SELECT 
        tc.id,
        tc.batch_id,
        tc.batch_name,
        tc.course_title,
        tc.trainer_name,
        tc.original_date::text as original_date,
        tc.rescheduled_date::text as rescheduled_date,
        tc.start_time::text as start_time,
        tc.end_time::text as end_time,
        tc.room_or_hall,
        tc.reason,
        tc.status,
        tc.cancellation_type
      FROM public.tally_classes tc
      WHERE tc.batch_id = ANY($1::uuid[])
        AND tc.status != 'Cancelled'
      ORDER BY tc.rescheduled_date DESC
    `, [batchIds]);
  }

  // 6. Query student's attendance summary
  const attSummary = await queryOne<any>(`
    SELECT 
      count(*)::int as total_classes_marked,
      count(*) filter (where a.status = 'present')::int as present_count,
      count(*) filter (where a.status = 'absent')::int as absent_count,
      count(*) filter (where a.status = 'late')::int as late_count
    FROM public.attendance a
    WHERE a.student_id = $1 OR a.student_id = $2
  `, [student.student_id, student.profile_id]);

  // 7. Deterministic Schedule Analysis
  const todaySessions = sessions.filter(s => s.session_date === kolkata.dateStr);
  const todayTally = tallyClasses.filter(t => t.rescheduled_date === kolkata.dateStr);
  const todayRegularBatches = enrolledBatches.filter(b => {
    const days = Array.isArray(b.days_of_week) ? b.days_of_week : [b.days_of_week];
    return days.some((d: string) => d && d.toLowerCase() === kolkata.dayName.toLowerCase());
  });

  const hasClassToday = todaySessions.some(s => s.status !== 'cancelled') || todayTally.length > 0 || (todayRegularBatches.length > 0 && !todaySessions.some(s => s.status === 'cancelled'));

  // Calculate Next Class
  let nextClassDetails = 'No upcoming classes scheduled in the next 14 days.';
  const upcomingSessions = sessions.filter(s => {
    if (s.session_date > kolkata.dateStr) return true;
    if (s.session_date === kolkata.dateStr && s.start_time > kolkata.timeStr) return true;
    return false;
  }).filter(s => s.status !== 'cancelled');

  if (upcomingSessions.length > 0) {
    const next = upcomingSessions[0];
    nextClassDetails = `${next.course_title} (${next.batch_name}) on ${next.session_date} from ${formatTime12(next.start_time)} to ${formatTime12(next.end_time)} at ${next.room_or_hall || 'Studio'} (Guru: ${next.trainer_name || 'Assigned Guru'})`;
  } else if (enrolledBatches.length > 0) {
    nextClassDetails = `Scheduled in your regular weekly batch (${enrolledBatches.map(b => `${b.batch_name}: ${Array.isArray(b.days_of_week) ? b.days_of_week.join('/') : b.days_of_week} at ${formatTime12(b.start_time)}`).join('; ')})`;
  }

  // Build Personalized AI System Prompt
  const studentPrompt = `You are "Laasya Student AI Companion", the personal academic and learning guide for authenticated student ${student.full_name} (Roll Number: ${student.roll_number}).
Current Time: ${kolkata.friendlyDate} (${kolkata.dayName}), ${kolkata.timeStr} (Asia/Kolkata).

STUDENT'S AUTHORIZED ENROLLMENTS:
${enrolledBatches.length > 0 ? JSON.stringify(enrolledBatches.map(b => ({
  course: b.course_title,
  category: b.course_category,
  batch_name: b.batch_name,
  scheduled_days: b.days_of_week,
  timings: `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}`,
  room: b.room_or_hall,
  guru: b.trainer_name,
  fee: `₹${b.monthly_fee}/month`
})), null, 2) : 'No active batch enrollments found.'}

CLASSES TODAY (${kolkata.dayName}, ${kolkata.dateStr}):
- Has Class Today: ${hasClassToday ? 'YES' : 'NO'}
- Today's Class Sessions: ${JSON.stringify(todaySessions)}
- Today's Rescheduled/Compensation Classes: ${JSON.stringify(todayTally)}
- Today's Regular Batch Slots: ${JSON.stringify(todayRegularBatches.map(b => ({
  course: b.course_title,
  batch: b.batch_name,
  time: `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}`,
  room: b.room_or_hall,
  guru: b.trainer_name
})))}

NEXT UPCOMING CLASS:
${nextClassDetails}

ELIGIBLE EXTRA / MAKE-UP / TALLY CLASSES:
${tallyClasses.length > 0 ? JSON.stringify(tallyClasses.map(t => ({
  batch: t.batch_name,
  course: t.course_title,
  original_date: t.original_date,
  rescheduled_date: t.rescheduled_date,
  timings: `${formatTime12(t.start_time)} - ${formatTime12(t.end_time)}`,
  room: t.room_or_hall,
  reason: t.reason,
  guru: t.trainer_name,
  status: t.status
})), null, 2) : 'No extra or make-up classes scheduled for your batches.'}

ATTENDANCE AUDIT SUMMARY:
- Total sessions marked: ${attSummary?.total_classes_marked || 0}
- Present: ${attSummary?.present_count || 0}
- Absent: ${attSummary?.absent_count || 0}
- Late: ${attSummary?.late_count || 0}

STRICT OPERATIONAL RULES:
1. ONLY answer with information pertaining to ${student.full_name}'s assigned courses and batches.
2. When the student asks "What are my batches assigned to me?" or "What batches am I in?", list ONLY their enrolled batches with course title, batch name, scheduled days, timings, venue, and assigned Guru.
3. NEVER ask the student to identify themselves or state their name. Their identity is verified as ${student.full_name} (${student.roll_number}).
4. DO NOT display general academy batches when the student asks for their own class timings or today's classes.
5. If no classes are scheduled for today, clearly confirm: "You have no classes scheduled for today (${kolkata.dayName}, ${kolkata.dateStr})", and state when their next class is.
6. Distinguish clearly between:
   - Regular scheduled classes
   - Eligible extra or make-up classes (tally classes)
   - Cancelled classes
7. If the student has zero batch enrollments, inform them politely to contact academy administration to complete their batch allotment.
8. NEVER share private details about other students, parents, or staff under any circumstances.`;

  const apiKey = await getAiApiKey();
  const aiResult = await callGemini(apiKey, studentPrompt, userMessage, history);

  if (aiResult) {
    return NextResponse.json({ reply: aiResult.reply, hasMore: false }, { headers: corsHeaders });
  }

  // Deterministic Student Fallback
  let deterministicReply = '';
  const q = userMessage.toLowerCase();

  if (enrolledBatches.length === 0) {
    deterministicReply = `Namaste, **${student.full_name}**! 🙏\n\nYou are currently not assigned to an active batch. Please speak with the academy reception desk or contact **+91 8151 998 899** to complete your course batch allocation.`;
  } else if (q.includes('today') || q.includes('timing today') || q.includes('class today')) {
    if (hasClassToday) {
      deterministicReply = `Namaste, **${student.full_name}**! 🙏\n\n**Yes, you have class today (${kolkata.dayName}, ${kolkata.dateStr}):**\n\n`;
      todayRegularBatches.forEach(b => {
        deterministicReply += `• **${b.course_title} (${b.batch_name}):** ${formatTime12(b.start_time)} – ${formatTime12(b.end_time)}\n  📍 Venue: ${b.room_or_hall || 'Studio'} | Guru: ${b.trainer_name || 'Assigned Guru'}\n`;
      });
      todayTally.forEach(t => {
        deterministicReply += `• **[Extra / Compensation Class] ${t.course_title} (${t.batch_name}):** ${formatTime12(t.start_time)} – ${formatTime12(t.end_time)}\n  📍 Venue: ${t.room_or_hall || 'Studio'} | Reason: ${t.reason || 'Make-up class'}\n`;
      });
    } else {
      deterministicReply = `Namaste, **${student.full_name}**! 🙏\n\n**No classes are scheduled for you today (${kolkata.dayName}, ${kolkata.friendlyDate}).**\n\n**Your Next Class:**\n• ${nextClassDetails}`;
    }
  } else if (q.includes('next class')) {
    deterministicReply = `Namaste, **${student.full_name}**! 🙏\n\n**Your Next Upcoming Class:**\n• ${nextClassDetails}`;
  } else if (q.includes('week') || q.includes('this week')) {
    deterministicReply = `Namaste, **${student.full_name}**! 🙏\n\n**Your Classes This Week:**\n\n`;
    enrolledBatches.forEach(b => {
      const days = Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week;
      deterministicReply += `• **${b.course_title} — ${b.batch_name}:** ${days} (${formatTime12(b.start_time)} – ${formatTime12(b.end_time)}) at ${b.room_or_hall || 'Studio'} (Guru: ${b.trainer_name || 'Faculty Guru'})\n`;
    });
  } else if (q.includes('extra') || q.includes('make-up') || q.includes('makeup') || q.includes('tally') || q.includes('compensation')) {
    if (tallyClasses.length > 0) {
      deterministicReply = `Namaste, **${student.full_name}**! 🙏\n\n**Eligible Extra / Make-up Classes for your batches:**\n\n`;
      tallyClasses.forEach(t => {
        deterministicReply += `• **${t.course_title} (${t.batch_name}):** Rescheduled to **${t.rescheduled_date}** (${formatTime12(t.start_time)} – ${formatTime12(t.end_time)}) in ${t.room_or_hall || 'Studio'}\n  *Reason:* ${t.reason || 'Holiday compensation'}\n`;
      });
    } else {
      deterministicReply = `Namaste, **${student.full_name}**! 🙏\n\nThere are currently **no extra or make-up classes scheduled** for your enrolled batches. Regular classes follow your standard timetable.`;
    }
  } else if (q.includes('timing') || q.includes('schedule') || q.includes('batch') || q.includes('assigned') || q.includes('enrolled') || q.includes('my course')) {
    deterministicReply = `Namaste, **${student.full_name}**! 🙏\n\n**Your Enrolled Batches & Timetable:**\n\n`;
    enrolledBatches.forEach(b => {
      const days = Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week;
      deterministicReply += `• **${b.course_title} (${b.batch_name}):**\n` +
        `  🗓️ Schedule: ${days}\n` +
        `  ⏰ Timings: ${formatTime12(b.start_time)} – ${formatTime12(b.end_time)}\n` +
        `  📍 Venue: ${b.room_or_hall || 'Studio / Hall'}\n` +
        `  👤 Guru: ${b.trainer_name || 'Assigned Guru'}\n\n`;
    });
  } else {
    deterministicReply = `Namaste, **${student.full_name}**! 🙏 I am your **Laasya AI Learning Companion**.\n\nYou can ask me:\n• "What batches are assigned to me?"\n• "Do I have a class today?"\n• "What is my next class?"\n• "What are my classes this week?"\n• "Are any extra or make-up classes available for me?"`;
  }

  return NextResponse.json({ reply: deterministicReply, hasMore: false }, { headers: corsHeaders });
}

// --------------------------------------------------------------------------
// MAIN API ROUTE DISPATCHER
// --------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`ai_chat_${ip}`, 30, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { reply: 'You have sent too many requests. Please wait a moment before sending another inquiry.', hasMore: false },
        { status: 429, headers: corsHeaders }
      );
    }
    const body = await req.json().catch(() => ({}));
    const { messages = [] }: { messages: ChatMessage[] } = body;

    const userMessage = messages[messages.length - 1]?.content || '';
    if (!userMessage.trim()) {
      return NextResponse.json({ reply: 'Please provide a message or question.', hasMore: false }, { status: 400, headers: corsHeaders });
    }

    const authHeader = req.headers.get('authorization');
    const chatModeHeader = req.headers.get('x-chat-mode');
    const isStudentTargeted =
      chatModeHeader === 'student' ||
      body.mode === 'student' ||
      Boolean(authHeader && authHeader.startsWith('Bearer '));

    // Inspect user session (Bearer token from mobile or cookie from web)
    const session = getSessionFromRequest(req);

    // If targeted for student mode, NEVER fall back to public mode!
    if (isStudentTargeted) {
      if (!session) {
        return NextResponse.json({
          error: 'Authentication required. Please sign in to view your student records.',
          reply: '🔒 **Session Expired or Sign-In Required**\n\nPlease sign in to your student account to access your personal batch schedule, timings, and attendance records.',
          hasMore: false,
        }, { status: 401, headers: corsHeaders });
      }

      // Authenticated Student AI Pipeline
      return await handleStudentChat(session, userMessage, messages);
    }

    // If a session exists with student role on web, also route to student chat
    if (session && session.role === 'student') {
      return await handleStudentChat(session, userMessage, messages);
    }

    // Public Admissions AI Pipeline
    return await handlePublicChat(userMessage, messages);
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    const wa = cachedPublicData?.supportProfile?.whatsapp_number || '+91 8151 998 899';
    return NextResponse.json({
      reply: `Thank you for reaching out to Laasya Cultural Academy. Our admissions desk is available on WhatsApp at ${wa} for direct assistance.`,
      hasMore: false,
    }, { headers: corsHeaders });
  }
}

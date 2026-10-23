import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAiApiKey } from '@/lib/ai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// --------------------------------------------------------------------------
// 1. PRIVACY & SECURITY GUARD
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
    t.includes('student contact') ||
    t.includes('guru phone') ||
    t.includes('guru mobile') ||
    t.includes('guru contact') ||
    t.includes('trainer phone') ||
    t.includes('trainer mobile') ||
    t.includes('trainer contact') ||
    t.includes('faculty phone') ||
    t.includes('faculty contact') ||
    t.includes('revenue') ||
    t.includes('erp revenue') ||
    t.includes('profit') ||
    t.includes('total collection') ||
    t.includes('net earnings') ||
    t.includes('salary of guru') ||
    t.includes('guru salary') ||
    t.includes('payroll')
  );
}

function handleConfidentialQuery(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('revenue') || t.includes('erp') || t.includes('profit') || t.includes('collection') || t.includes('salary') || t.includes('payroll')) {
    return `🔒 **Confidentiality Notice:**\n\nAcademy financial reports, staff payroll, and ERP revenue metrics are strictly confidential and restricted to authorized Academy leadership.\n\nFor fee structures and course enrollments, please refer to the course listings or contact academy admissions.`;
  }
  if (t.includes('guru') || t.includes('trainer') || t.includes('faculty')) {
    return `🔒 **Privacy Notice:**\n\nPersonal contact numbers and private details of our revered Gurus are strictly confidential to ensure their privacy and safety.\n\nAll official communications, masterclass schedules, and appointments can be arranged directly through our Academy Admissions Desk:\n• **WhatsApp & Phone:** +91 8151 998 899\n• **Academy Email:** info@laasyaacademy.com`;
  }
  return `🔒 **Privacy Notice:**\n\nStudent and parent personal contact numbers, residential addresses, and private records are strictly confidential and protected under academy privacy guidelines.\n\nFor official student inquiries, please visit the academy reception in person.`;
}

// --------------------------------------------------------------------------
// 2. DYNAMIC DATABASE ACADEMY KNOWLEDGE GENERATOR
// --------------------------------------------------------------------------
async function buildAcademyLiveKnowledge(): Promise<{
  knowledgePrompt: string;
  courses: any[];
  batches: any[];
  trainers: any[];
}> {
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

    prompt += `\nSTRICT CONFIDENTIALITY MANDATE:\n`;
    prompt += `1. NEVER disclose any student or parent phone numbers, emails, roll numbers, or personal addresses.\n`;
    prompt += `2. NEVER disclose any Guru's personal phone number or email (only refer to public admission desk +91 8151 998 899).\n`;
    prompt += `3. NEVER disclose academy ERP revenue, total collections, profits, or staff payroll.\n`;
    prompt += `4. Answer course curricula, batches, timings, mudras, vocal techniques, practice routines, and exam rules thoroughly and politely.\n`;

    return { knowledgePrompt: prompt, courses, batches, trainers };
  } catch (err) {
    console.error('Failed to query DB for AI knowledge:', err);
    return { knowledgePrompt: '', courses: [], batches: [], trainers: [] };
  }
}

// --------------------------------------------------------------------------
// 3. INTELLIGENT RULE-BASED FALLBACK ENGINE
// --------------------------------------------------------------------------
function generateIntelligentDatabaseResponse(
  queryText: string,
  courses: any[],
  batches: any[],
  trainers: any[]
): string {
  const q = queryText.toLowerCase();

  // Confidentiality Check
  if (containsConfidentialKeywords(q)) {
    return handleConfidentialQuery(q);
  }

  // 1. Search for specific Guru
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

  // 2. Search for specific Course
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

  // 3. Batches / Timings Query
  if (q.includes('batch') || q.includes('timing') || q.includes('time') || q.includes('schedule') || q.includes('hour')) {
    let text = `⏰ **Laasya Academy Timings & Batch Slots:**\n\n` +
      `• **Academy Working Hours:** Mon – Fri: 08:30 AM – 08:30 PM | Sat – Sun: 07:30 AM – 08:30 PM\n\n` +
      `**Active Batches Snapshot:**\n`;
    const slice = batches.slice(0, 6);
    slice.forEach((b) => {
      text += `• **${b.course_title || 'Course'} — ${b.name}:** ${Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week} (${b.start_time || '17:00'} - ${b.end_time || '18:30'}) [${b.room_or_hall || 'Studio'}]\n`;
    });
    text += `\n*Looking for a specific course or weekend slot? Let me know which art form you are interested in!*`;
    return text;
  }

  // 4. Fees Query
  if (q.includes('fee') || q.includes('cost') || q.includes('price') || q.includes('charges')) {
    return `💰 **Fee Structure & Enrollment at Laasya Academy:**\n\n` +
      `• Most classical dance, music, fine arts, and karate batches range between **₹1,500 – ₹3,500 per month** depending on frequency and level.\n` +
      `• One-time registration applies for new disciples.\n` +
      `• Digital receipts are automatically generated and delivered in the Student App.\n\n` +
      `For exact fees for any specific batch, please click **"Send Enquiry"** on the course page or WhatsApp our admissions desk at **+91 8151 998 899**.`;
  }

  // 5. Practice / Dance / Mudra / Technique Query
  if (q.includes('mudra') || q.includes('adavu') || q.includes('dance') || q.includes('posture') || q.includes('practice') || q.includes('warm')) {
    return `💃 **Classical Dance Foundations & Daily Practice:**\n\n` +
      `1. **Daily Warm-Up (10 mins):** Neck rotations, shoulder rolls, aramandi knee flexibility, and heel-toe stretches.\n` +
      `2. **Asamyutta Hastas (Single Hand Mudras):** Pataka (flag), Tripataka, Ardhapataka, Kartarimukha, Mayura, Ardhachandra, Arala, Shukatunda, Mushthi, Shikara, Kapittha, Katakamukha, Suchi, Chandrakala, Padmakosha, Sarpashirsha, Mrigashirsha, Simhamukha, Kangula, Alapadma, Chatura, Bhramara, Hamsasya, Hamsapaksha, Samdamsha, Mukula, Tamrachuda, Trishula.\n` +
      `3. **Key Posture:** Maintain deep **Aramandi** (half-sit) with an erect spine and focused **Drishti** (eye gaze).\n` +
      `4. Check your student app's **"Videos"** tab for monthly masterclass clips uploaded by your Guru!`;
  }

  // 6. Music / Raga / Carnatic Query
  if (q.includes('carnatic') || q.includes('vocal') || q.includes('raga') || q.includes('swara') || q.includes('shruti')) {
    return `🎶 **Carnatic Vocal & Music Fundamentals:**\n\n` +
      `1. **Shruti Alignment:** Always tune your Tanpura precisely to your base Adhara Shadjam (Sa - Pa - Sa).\n` +
      `2. **Akaram Practice:** Sing Sarali, Janta, and Alankaram drills in 3 speeds (Prathama, Dwitiya, and Tritiya Kala) using "Aa" akaram to develop vocal clarity.\n` +
      `3. **Tala Precision:** Maintain consistent hand talam (Adi Tala: Laghu 4 beats + 2 Dhrutams).\n` +
      `4. Disciples can access guidance notes and practice recordings directly in the Student Mobile App.`;
  }

  // 7. General Welcome / Overview
  return `Namaste! 🙏 Welcome to **Laasya Cultural Academy** — Bangalore's premier institution for authentic classical arts, music, dance, visual arts, and fitness.\n\n` +
    `How may I assist you today? You can ask me about:\n` +
    `• **Courses:** Bharatanatyam, Kuchipudi, Carnatic Vocal, Violin, Keyboard, Karate, Drawing, Chess, Yoga\n` +
    `• **Batch Schedules & Timings:** Weekday morning/evening & weekend slots\n` +
    `• **Our Revered Gurus:** Biographies, specializations, and years of experience\n` +
    `• **Student Mobile App:** Live attendance alerts, monthly performance video vault, and digital receipts\n` +
    `• **Admissions:** Send enquiry or WhatsApp us at **+91 8151 998 899**`;
}

// --------------------------------------------------------------------------
// 4. API POST HANDLER
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

    // Fetch live academy database data
    const { knowledgePrompt, courses, batches, trainers } = await buildAcademyLiveKnowledge();

    const apiKey = await getAiApiKey();

    if (apiKey && apiKey.trim().length > 10) {
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
      
      for (const modelName of candidateModels) {
        try {
          const conversationParts = messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));

          const contents = [
            {
              role: 'user',
              parts: [{ text: `SYSTEM CONTEXT & KNOWLEDGE BASE:\n${knowledgePrompt}\n\nSTRICT INSTRUCTIONS: Always be polite, warm, and structured. NEVER reveal student phone numbers, guru personal contact numbers, or academy ERP revenue. Answer the user respectfully.` }],
            },
            {
              role: 'model',
              parts: [{ text: 'Namaste! I am the Laasya AI Assistant. I will assist students, parents, and prospective disciples with detailed, accurate, and courteous information while strictly respecting privacy guidelines.' }],
            },
            ...conversationParts,
          ];

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
            signal: AbortSignal.timeout(6000),
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply && reply.trim()) {
              return NextResponse.json({ reply: reply.trim() });
            }
          }
        } catch {
          // If a model times out or network fails, try fallback or next model
        }
      }
    }

    // Intelligent Database Knowledge Engine Fallback
    const reply = generateIntelligentDatabaseResponse(userMessage, courses, batches, trainers);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI chat route error:', error);
    const fallback = generateIntelligentDatabaseResponse('general', [], [], []);
    return NextResponse.json({ reply: fallback });
  }
}

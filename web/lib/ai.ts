import { query, queryOne } from './db';

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];
const GEMINI_MODEL = GEMINI_MODELS[0];

export async function getAiApiKey(): Promise<string> {
  try {
    const row = await queryOne<{ value: string }>(
      `SELECT value FROM system_settings WHERE key = 'gemini_api_key' LIMIT 1`
    );
    if (row?.value && row.value.trim().length > 0) {
      return row.value.trim();
    }
  } catch (err) {
    console.warn('Could not read AI key from system_settings, using fallback:', err);
  }
  return process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
}

export async function setAiApiKey(newKey: string): Promise<void> {
  const trimmed = newKey.trim();
  if (!trimmed) {
    throw new Error('API Key cannot be empty');
  }
  await query(
    `CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  );
  await query(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES ('gemini_api_key', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [trimmed]
  );
}

export async function testAiConnection(keyToTest?: string): Promise<{ success: boolean; message: string; model: string }> {
  const activeKey = keyToTest?.trim() || (await getAiApiKey());
  
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(activeKey)}`;
    const body = {
      contents: [
        {
          parts: [{ text: 'Ping test for Laasya Classical Academy. Reply only with OK.' }]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const json = await response.json();
        const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
          success: true,
          message: reply.trim() || 'Connection verified successfully',
          model: model,
        };
      }
      lastError = `HTTP ${response.status}`;
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  throw new Error(`Google Gemini connection failed across models: ${lastError}`);
}

export async function enhanceTextWithAi(
  text: string,
  context: string = 'general text'
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    return text;
  }

  const apiKey = await getAiApiKey();

  let contextGuidance = '';
  if (context.includes('headline')) {
    contextGuidance = 'This is an app banner headline. Make it catchy, punchy, professional, and inspiring while keeping it concise.';
  } else if (context.includes('promo') || context.includes('details')) {
    contextGuidance = 'This is an app promotional banner description. Make it appealing, informative, and persuasive with flawless grammar.';
  } else if (context.includes('subject') || context.includes('title')) {
    contextGuidance = 'This is an announcement notice subject. Make it clear, formal, and attention-grabbing.';
  } else if (context.includes('message') || context.includes('content') || context.includes('announcement')) {
    contextGuidance = 'This is an announcement message body for students, gurus, and parents. Ensure respectful, warm, professional, and culturally appropriate academy tone.';
  } else if (context.includes('course')) {
    contextGuidance = 'This is a classical arts course description. Highlight curriculum, discipline, artistic heritage, and learning outcomes elegantly.';
  } else if (context.includes('bio') || context.includes('guru')) {
    contextGuidance = 'This is a revered classical Guru biography and credentials description. Make it respectful, prestigious, and articulate.';
  } else if (context.includes('video')) {
    contextGuidance = 'This is an educational practice video description for students. Make it structured, clear, and encouraging.';
  }

  const prompt = `You are a professional copywriter and linguistic editor for Laasya Classical Arts Academy (an academy of Bharatanatyam, Carnatic Vocal, Veena, Violin, Yoga, and classical arts).

Task: Enhance and polish the following user-written text for ${context}.

Context Guidance:
${contextGuidance}

Strict Guidelines:
1. Fix all spelling, grammatical, and typographical errors.
2. Use correct punctuation, capitalization, and paragraph spacing.
3. Improve sentence structure and vocabulary to sound articulate, polished, and dignified.
4. STRICTLY PRESERVE all dates, times, phone numbers, contact info, prices, syllabus names, student/guru names, room names, and URLs exactly as provided.
5. DO NOT invent fake facts or remove original details.
6. OUTPUT FORMAT: Return ONLY the enhanced final text. Do NOT wrap in quotation marks, and do NOT include any introductory or concluding conversational commentary.

Original Text to Enhance:
${trimmed}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.95
    }
  };

  let lastError = '';
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const maxAttempts = model === 'gemini-3.6-flash' ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          let candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          candidateText = candidateText.trim();

          // Strip accidental outer quotes if Gemini wraps them
          if (
            (candidateText.startsWith('"') && candidateText.endsWith('"')) ||
            (candidateText.startsWith("'") && candidateText.endsWith("'"))
          ) {
            candidateText = candidateText.slice(1, -1).trim();
          }

          if (candidateText.length > 0) {
            return candidateText;
          }
        } else {
          const errText = await response.text();
          lastError = `${model} HTTP ${response.status}: ${errText.slice(0, 100)}`;
          if (response.status === 503 && attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, 1200));
            continue;
          }
        }
      } catch (err: any) {
        lastError = `${model}: ${err?.message || String(err)}`;
      }
    }
  }

  console.warn('AI enhancement falling back to linguistic formatter:', lastError);
  return fallbackFormatText(trimmed, context);
}

function fallbackFormatText(text: string, _context: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  if (!/[.!?]$/.test(cleaned) && !cleaned.includes('\n')) {
    cleaned += '.';
  }
  return cleaned;
}

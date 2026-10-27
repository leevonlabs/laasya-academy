import { NextRequest, NextResponse } from 'next/server';
import { enhanceTextWithAi } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const user = await getCurrentUser();

    // Rate limiting: 30 req/min for authenticated users, 12 req/min for anonymous/mobile
    const rateLimitKey = user ? `user:${user.userId}` : `ip:${ip}`;
    const maxRequests = user ? 30 : 12;
    const rateCheck = checkRateLimit(rateLimitKey, maxRequests, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many AI enhancement requests. Please wait ${Math.ceil(rateCheck.resetInMs / 1000)} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': Math.ceil(rateCheck.resetInMs / 1000).toString(),
          },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { text, context } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text is required for AI enhancement' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (text.length > 3000) {
      return NextResponse.json(
        { success: false, error: 'Text is too long for AI enhancement (maximum 3,000 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const enhanced = await enhanceTextWithAi(text, context || 'general');
    return NextResponse.json(
      {
        success: true,
        enhancedText: enhanced,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('AI enhance endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enhance text with AI' },
      { status: 500, headers: corsHeaders }
    );
  }
}

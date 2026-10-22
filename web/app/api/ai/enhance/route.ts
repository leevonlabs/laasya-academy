import { NextRequest, NextResponse } from 'next/server';
import { enhanceTextWithAi } from '@/lib/ai';

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
    const body = await req.json();
    const { text, context } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text is required for AI enhancement' },
        { status: 400, headers: corsHeaders }
      );
    }

    const enhanced = await enhanceTextWithAi(text, context || 'general');
    return NextResponse.json({
      success: true,
      enhancedText: enhanced
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('AI enhance endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enhance text with AI' },
      { status: 500, headers: corsHeaders }
    );
  }
}

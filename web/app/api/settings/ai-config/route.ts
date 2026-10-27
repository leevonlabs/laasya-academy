import { NextRequest, NextResponse } from 'next/server';
import { getAiApiKey, setAiApiKey, testAiConnection } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function maskApiKey(key: string): string {
  if (!key || key.length < 10) return '••••••••';
  const start = key.slice(0, 6);
  const end = key.slice(-5);
  return `${start}${'•'.repeat(Math.max(key.length - 11, 8))}${end}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ success: false, error: 'Unauthorized: Owner access required' }, { status: 403 });
  }

  try {
    const rawKey = await getAiApiKey();
    return NextResponse.json({
      success: true,
      apiKeyMasked: maskApiKey(rawKey),
      model: 'gemini-3.8-flash',
      isConfigured: Boolean(rawKey && rawKey.trim().length > 0)
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch AI configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ success: false, error: 'Unauthorized: Owner access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { apiKey } = body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'API Key cannot be blank' },
        { status: 400 }
      );
    }

    // Optional quick test verification
    await testAiConnection(apiKey.trim());
    await setAiApiKey(apiKey.trim());

    return NextResponse.json({
      success: true,
      message: 'AI API Key updated and connection verified successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update AI API key' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ success: false, error: 'Unauthorized: Owner access required' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey } = body;
    const testResult = await testAiConnection(apiKey);
    return NextResponse.json(testResult);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'AI Connection Test Failed' },
      { status: 400 }
    );
  }
}

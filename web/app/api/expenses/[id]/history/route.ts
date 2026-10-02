import { NextRequest, NextResponse } from 'next/server';
import { getExpenseAuditLogs } from '@/lib/expenses';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const history = await getExpenseAuditLogs(id);

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error('Error fetching expense history:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

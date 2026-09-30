import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRooms, createRoom } from '@/lib/academy';

export async function GET() {
  try {
    const rooms = await getRooms();
    return NextResponse.json({ rooms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, capacity } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }
    const room = await createRoom(name.trim(), capacity ? Number(capacity) : 25);
    return NextResponse.json({ room });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

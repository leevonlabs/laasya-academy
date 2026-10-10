import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRooms, createRoom, updateRoom, deleteRoom } from '@/lib/academy';

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

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, capacity } = body;
    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Room name cannot be empty' }, { status: 400 });
    }
    const room = await updateRoom(id, name.trim(), capacity !== undefined ? Number(capacity) : undefined);
    return NextResponse.json({ room, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // no body
      }
    }
    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    await deleteRoom(id);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

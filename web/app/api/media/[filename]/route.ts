import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename || filename.includes('..')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    // 1. First check if file exists in public/uploads on disk
    const localPath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Fetch from media_assets table in database
    const row = await queryOne<{ data: Buffer; mime_type: string }>(
      'SELECT data, mime_type FROM public.media_assets WHERE filename = $1 OR id = $1 LIMIT 1',
      [filename]
    );

    if (!row || !row.data) {
      return new NextResponse('Media not found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(row.data), {
      headers: {
        'Content-Type': row.mime_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving media asset:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

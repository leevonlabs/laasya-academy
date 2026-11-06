import { query } from './db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Persists an uploaded Base64 image either to disk or to the media_assets table.
 * Returns a static URL (e.g. /uploads/announcements/notice_xxx.jpg or /api/media/notice_xxx.jpg).
 * NEVER returns raw Base64 data, ensuring database tables remain clean and tiny.
 */
export async function saveBase64Media(
  dataUrl?: string | null,
  folder: 'announcements' | 'avatars' | 'courses' | 'holidays' = 'announcements'
): Promise<string | null> {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const trimmed = dataUrl.trim();
  if (!trimmed.startsWith('data:')) {
    return trimmed; // Already a clean URL
  }

  try {
    const match = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,([\s\S]+)$/);
    if (!match) return null;

    const mime = match[1];
    const base64Data = match[2].replace(/\s+/g, '');
    const buffer = Buffer.from(base64Data, 'base64');
    // Safety guard: reject oversized payloads exceeding 5 MB to prevent database bloat
    if (buffer.length > 5 * 1024 * 1024) {
      console.warn('Rejected oversized media upload: ' + buffer.length + ' bytes exceeds 5 MB limit');
      return null;
    }
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 12);
    const prefix = folder === 'avatars' ? 'avatar' : folder === 'courses' ? 'course' : folder === 'holidays' ? 'holiday' : 'notice';
    const filename = `${prefix}_${hash}.${ext}`;

    // 1. Try writing to local public/uploads directory (works locally & during build)
    let wroteToDisk = false;
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, buffer);
      }
      wroteToDisk = true;
    } catch {
      // Vercel serverless environment has read-only filesystem
      wroteToDisk = false;
    }

    // 2. Persist binary to media_assets in PostgreSQL for resilient cross-deployment Vercel serving
    try {
      await query(`
        INSERT INTO public.media_assets (id, filename, mime_type, data, size_bytes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING;
      `, [filename, filename, mime, buffer, buffer.length]);
    } catch (dbErr) {
      console.warn('media_assets insert notice:', dbErr);
    }

    if (wroteToDisk) {
      return `/uploads/${folder}/${filename}`;
    }

    return `/api/media/${filename}`;
  } catch (err) {
    console.error('Failed to process base64 media:', err);
    return null;
  }
}

/**
 * Automatically reclaims storage space in Supabase Free plan by purging
 * media_assets that are no longer referenced in profiles, courses, or announcements.
 */
export async function pruneOrphanedMedia(): Promise<number> {
  try {
    const res = await query<{ count: string }>(`
      WITH deleted AS (
        DELETE FROM public.media_assets
        WHERE id NOT IN (
          SELECT regexp_replace(COALESCE(avatar_url, ''), '^.*/', '') FROM public.profiles WHERE avatar_url IS NOT NULL
          UNION
          SELECT regexp_replace(COALESCE(image_url, ''), '^.*/', '') FROM public.courses WHERE image_url IS NOT NULL
          UNION
          SELECT regexp_replace(COALESCE(image_url, ''), '^.*/', '') FROM public.announcements WHERE image_url IS NOT NULL
          UNION
          SELECT regexp_replace(COALESCE(avatar_url, ''), '^.*/', '') FROM public.trainers WHERE avatar_url IS NOT NULL
          UNION
          SELECT regexp_replace(COALESCE(avatar_url, ''), '^.*/', '') FROM public.students WHERE avatar_url IS NOT NULL
        )
        AND created_at < NOW() - INTERVAL '1 day'
        RETURNING id
      )
      SELECT COUNT(*)::text as count FROM deleted;
    `);
    const count = parseInt(res[0]?.count || '0', 10);
    return count;
  } catch (err) {
    console.error('Failed to prune orphaned media:', err);
    return 0;
  }
}

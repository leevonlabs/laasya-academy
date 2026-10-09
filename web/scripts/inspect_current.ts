import { query, getDbPool } from '../lib/db';

async function main() {
  try {
    const courses = await query('SELECT count(*)::int as count FROM public.courses');
    const batches = await query('SELECT count(*)::int as count FROM public.batches');
    const trainers = await query('SELECT count(*)::int as count FROM public.trainers');
    const students = await query('SELECT count(*)::int as count FROM public.students');
    const rooms = await query('SELECT id, name, capacity FROM public.rooms ORDER BY name');

    console.log('Courses count:', courses[0].count);
    console.log('Batches count:', batches[0].count);
    console.log('Trainers count:', trainers[0].count);
    console.log('Students count:', students[0].count);
    console.log('Rooms:', rooms);
  } catch (err) {
    console.error('Inspect error:', err);
  } finally {
    const p = getDbPool();
    await p.end();
    process.exit(0);
  }
}

main();

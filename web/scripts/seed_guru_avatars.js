const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sharp = require('sharp');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const GURU_THEMES = [
  { bg1: '#6E0B3B', bg2: '#3D021E', accent: '#F9E33A', stroke: '#EBB128' }, // Classical Maroon & Gold
  { bg1: '#0F3E6D', bg2: '#061D36', accent: '#64B5F6', stroke: '#90CAF9' }, // Royal Peacock & Azure
  { bg1: '#145A32', bg2: '#092916', accent: '#A5D6A7', stroke: '#81C784' }, // Temple Emerald
  { bg1: '#7D3C98', bg2: '#4A154B', accent: '#E1BEE7', stroke: '#CE93D8' }, // Classical Violet
  { bg1: '#A04000', bg2: '#562300', accent: '#FAD7A0', stroke: '#F5B041' }, // Terracotta Ochre
  { bg1: '#78281F', bg2: '#43120C', accent: '#F5B7B1', stroke: '#E6B0AA' }, // Deep Crimson
  { bg1: '#117864', bg2: '#07372D', accent: '#A3E4D7', stroke: '#76D7C4' }, // Teal Jade
];

async function generateGuruAvatarBase64(name, idx) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2 
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
  const theme = GURU_THEMES[idx % GURU_THEMES.length];
  const width = 420;
  const height = 420;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg_${idx}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${theme.bg1}" />
        <stop offset="100%" stop-color="${theme.bg2}" />
      </radialGradient>
      <linearGradient id="acc_${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.accent}" />
        <stop offset="100%" stop-color="${theme.stroke}" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg_${idx})" />
    <circle cx="210" cy="210" r="198" stroke="url(#acc_${idx})" stroke-width="4" fill="none" opacity="0.9" />
    <circle cx="210" cy="210" r="176" stroke="#FFF2F8" stroke-width="1.8" stroke-dasharray="6,4" fill="none" opacity="0.6" />
    <circle cx="210" cy="210" r="148" stroke="url(#acc_${idx})" stroke-width="1.2" fill="none" opacity="0.75" />
  `;

  for (let i = 0; i < 48; i++) {
    const angle = (i * 7.5) * Math.PI / 180;
    const x1 = 210 + Math.cos(angle) * 95;
    const y1 = 210 + Math.sin(angle) * 95;
    const x2 = 210 + Math.cos(angle) * 174;
    const y2 = 210 + Math.sin(angle) * 174;
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${theme.accent}" stroke-width="1.4" opacity="0.4" />`;
    svg += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="3" fill="#FFF2F8" opacity="0.7" />`;
  }

  svg += `
    <circle cx="210" cy="210" r="80" fill="${theme.bg2}" stroke="url(#acc_${idx})" stroke-width="5" />
    <circle cx="210" cy="210" r="74" stroke="#FFF2F8" stroke-width="1.2" fill="none" opacity="0.5" />
    <text x="210" y="222" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="54" font-weight="900" fill="${theme.accent}" text-anchor="middle">${initials}</text>
    <text x="210" y="254" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF" letter-spacing="3" text-anchor="middle" opacity="0.95">GURU</text>
  </svg>`;

  const jpegBuf = await sharp(Buffer.from(svg))
    .jpeg({ quality: 92 })
    .toBuffer();

  return `data:image/jpeg;base64,${jpegBuf.toString('base64')}`;
}

async function run() {
  try {
    const res = await pool.query(`
      SELECT t.id as trainer_id, t.profile_id, p.full_name
      FROM public.trainers t
      JOIN public.profiles p ON t.profile_id = p.id
      ORDER BY p.full_name ASC
    `);

    console.log(`Found ${res.rows.length} trainers. Generating authentic portraits...`);

    for (let i = 0; i < res.rows.length; i++) {
      const t = res.rows[i];
      const avatarDataUrl = await generateGuruAvatarBase64(t.full_name, i);
      
      await pool.query(`UPDATE public.trainers SET avatar_url = $1 WHERE id = $2`, [avatarDataUrl, t.trainer_id]);
      await pool.query(`UPDATE public.profiles SET avatar_url = $1 WHERE id = $2`, [avatarDataUrl, t.profile_id]);
      console.log(`✓ Seeded portrait for Guru: ${t.full_name}`);
    }

    console.log('Successfully seeded all Guru portraits in DB!');
  } catch (err) {
    console.error('Error seeding guru avatars:', err);
  } finally {
    await pool.end();
  }
}

run();

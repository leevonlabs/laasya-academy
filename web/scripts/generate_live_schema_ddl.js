const fs = require('fs');
const path = require('path');
const { Pool } = require('../node_modules/pg');

let dbUrl = '';
const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
for (const line of env.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function generateDDL() {
  console.log('--- Generating Complete Live Schema DDL ---');
  let ddl = `-- ==============================================================================
-- LAASYA CULTURAL ACADEMY (లాస్య సాంస్కృతిక అకాడమి)
-- COMPLETE DATABASE LIVE SCHEMA DDL
-- Generated: ${new Date().toISOString()}
-- Source Project: bhpqzrcohjigkkpmcdsy
-- Target: New Supabase Project Migration
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

`;

  try {
    // 1. Extensions
    // (already in header)

    // 2. Public Tables and Columns
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    ddl += `-- ==============================================================================\n`;
    ddl += `-- 2. TABLES DEFINITIONS\n`;
    ddl += `-- ==============================================================================\n\n`;

    for (const t of tables) {
      console.log(`Extracting DDL for table: ${t}...`);
      const colRes = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          udt_name,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t]);

      ddl += `CREATE TABLE IF NOT EXISTS public."${t}" (\n`;
      const colDefs = [];
      for (const col of colRes.rows) {
        let typeStr = col.data_type;
        if (typeStr === 'USER-DEFINED') {
          typeStr = col.udt_name;
        } else if (typeStr === 'ARRAY') {
          typeStr = `${col.udt_name.replace(/^_/, '')}[]`;
        } else if (col.character_maximum_length) {
          typeStr = `${typeStr}(${col.character_maximum_length})`;
        }

        let def = `  "${col.column_name}" ${typeStr}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default !== null) def += ` DEFAULT ${col.column_default}`;
        colDefs.push(def);
      }
      ddl += colDefs.join(',\n');
      ddl += `\n);\n\n`;
    }

    // 3. Functions (placed after tables so SQL functions can resolve table references)
    console.log('Extracting custom functions...');
    const funcsRes = await pool.query(`
      SELECT p.proname, pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
    `);

    ddl += `-- ==============================================================================\n`;
    ddl += `-- 3. CUSTOM FUNCTIONS\n`;
    ddl += `-- ==============================================================================\n\n`;

    for (const f of funcsRes.rows) {
      ddl += `${f.def};\n\n`;
    }

    // 3. Constraints (Primary keys, foreign keys, unique, checks)
    ddl += `-- ==============================================================================\n`;
    ddl += `-- 4. CONSTRAINTS (PKs, FKs, UNIQUE, CHECKS)\n`;
    ddl += `-- ==============================================================================\n\n`;

    const constraintsRes = await pool.query(`
      SELECT 
        conrelid::regclass::text as table_name,
        conname as constraint_name,
        contype,
        pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY 
        CASE contype 
          WHEN 'p' THEN 1 
          WHEN 'u' THEN 2 
          WHEN 'c' THEN 3 
          WHEN 'f' THEN 4 
          ELSE 5 
        END,
        conname;
    `);

    for (const c of constraintsRes.rows) {
      ddl += `DO $$ BEGIN\n`;
      ddl += `  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${c.constraint_name}' AND connamespace = 'public'::regnamespace) THEN\n`;
      ddl += `    ALTER TABLE ${c.table_name} ADD CONSTRAINT "${c.constraint_name}" ${c.def};\n`;
      ddl += `  END IF;\n`;
      ddl += `END $$;\n\n`;
    }

    // 4. Indexes (excluding primary and unique constraint indexes already handled)
    ddl += `-- ==============================================================================\n`;
    ddl += `-- 5. INDEXES\n`;
    ddl += `-- ==============================================================================\n\n`;

    const indexesRes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname NOT IN (
          SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace
        )
      ORDER BY tablename, indexname;
    `);

    for (const idx of indexesRes.rows) {
      ddl += `${idx.indexdef};\n`;
    }
    ddl += `\n`;

    // 5. Triggers
    ddl += `-- ==============================================================================\n`;
    ddl += `-- 6. TRIGGERS\n`;
    ddl += `-- ==============================================================================\n\n`;

    const triggersRes = await pool.query(`
      SELECT 
        tgrelid::regclass::text as table_name,
        tgname as trigger_name,
        pg_get_triggerdef(oid) as def
      FROM pg_trigger
      WHERE NOT tgisinternal
        AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace)
      ORDER BY table_name, trigger_name;
    `);

    for (const trg of triggersRes.rows) {
      ddl += `DROP TRIGGER IF EXISTS "${trg.trigger_name}" ON ${trg.table_name};\n`;
      ddl += `${trg.def};\n\n`;
    }

    // 6. RLS Enable & Policies
    ddl += `-- ==============================================================================\n`;
    ddl += `-- 7. ROW LEVEL SECURITY & POLICIES\n`;
    ddl += `-- ==============================================================================\n\n`;

    const rlsRes = await pool.query(`
      SELECT c.relname as table_name, c.relrowsecurity as rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname;
    `);

    for (const r of rlsRes.rows) {
      if (r.rls_enabled) {
        ddl += `ALTER TABLE public."${r.table_name}" ENABLE ROW LEVEL SECURITY;\n`;
      }
    }
    ddl += `\n`;

    const policiesRes = await pool.query(`
      SELECT 
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    for (const p of policiesRes.rows) {
      ddl += `DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}";\n`;
      let polSql = `CREATE POLICY "${p.policyname}" ON public."${p.tablename}"`;
      if (p.permissive === 'RESTRICTIVE') polSql += ` AS RESTRICTIVE`;
      if (p.cmd) polSql += ` FOR ${p.cmd}`;
      if (p.roles) {
        const rolesFormatted = Array.isArray(p.roles) 
          ? p.roles.join(', ') 
          : String(p.roles).replace(/[{}]/g, '').trim();
        if (rolesFormatted && rolesFormatted !== 'public') {
          polSql += ` TO ${rolesFormatted}`;
        }
      }
      if (p.qual) polSql += ` USING (${p.qual})`;
      if (p.with_check) polSql += ` WITH CHECK (${p.with_check})`;
      ddl += `${polSql};\n\n`;
    }

    // 7. Realtime Publications
    ddl += `-- ==============================================================================\n`;
    ddl += `-- 8. REALTIME PUBLICATIONS\n`;
    ddl += `-- ==============================================================================\n\n`;

    const pubRes = await pool.query(`
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
      ORDER BY tablename;
    `);

    for (const pub of pubRes.rows) {
      ddl += `DO $$ BEGIN\n`;
      ddl += `  IF NOT EXISTS (\n`;
      ddl += `    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = '${pub.tablename}'\n`;
      ddl += `  ) THEN\n`;
      ddl += `    ALTER PUBLICATION supabase_realtime ADD TABLE public."${pub.tablename}";\n`;
      ddl += `  END IF;\n`;
      ddl += `END $$;\n`;
    }
    ddl += `\n`;

    // 8. Storage Buckets
    ddl += `-- ==============================================================================\n`;
    ddl += `-- 9. STORAGE BUCKETS\n`;
    ddl += `-- ==============================================================================\n\n`;
    try {
      const bucketsRes = await pool.query(`SELECT id, name, public FROM storage.buckets;`);
      for (const b of bucketsRes.rows) {
        ddl += `INSERT INTO storage.buckets (id, name, public)\n`;
        ddl += `VALUES ('${b.id}', '${b.name}', ${b.public})\n`;
        ddl += `ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;\n\n`;
      }
    } catch (_) {}

    const outPath = path.join(__dirname, '../../backups/laasya_complete_live_schema.sql');
    fs.writeFileSync(outPath, ddl, 'utf8');
    console.log('Complete live schema DDL successfully generated at:', outPath);
    console.log(`Schema file size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);

  } catch (err) {
    console.error('DDL generation failed:', err);
  } finally {
    await pool.end();
  }
}

generateDDL();

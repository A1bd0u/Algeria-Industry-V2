import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function run() {
  const url = process.env.SUPABASE_URL.replace('/rest/v1', '').replace(/\/$/, '') + '/pg-meta/default/query';
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260709160000_create_audit_logs.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log("Applying migration to:", url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

run().catch(err => {
  console.error("Migration failed:", err);
});

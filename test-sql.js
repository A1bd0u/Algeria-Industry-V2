import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.SUPABASE_URL.replace('/rest/v1', '').replace(/\/$/, '') + '/pg-meta/default/query';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: 'SELECT 1;' })
  });
  const text = await res.text();
  console.log(res.status, text);
}
run();

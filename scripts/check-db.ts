import { getSupabase } from '../server/db/supabaseClient';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = getSupabase();
  
  console.log("Listing all public tables...");
  const { data, error } = await supabase.from('users').select('id').limit(1);
  console.log("Can query users:", { success: !error, error: error?.message });

  const tables = [
    'users', 'companies', 'products', 'tenders', 'rfqs', 'messages',
    'kyc_requests', 'kyc_documents', 'transactions', 'favorites',
    'ads', 'articles', 'events', 'audit_logs', 'catalogues', 'reviews', 'notifications'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table '${table}':`, error ? `NOT FOUND / ERROR: ${error.message}` : 'EXISTS');
  }
}

run().catch(console.error);

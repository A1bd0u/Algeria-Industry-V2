import { getSupabase } from './server/db/supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = getSupabase();
async function run() {
  const { data, error } = await supabase.from('transactions').select('*').limit(1);
  console.log(error ? error.message : "Success");
}
run();

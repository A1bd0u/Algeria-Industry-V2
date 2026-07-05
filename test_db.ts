import { getSupabase } from './server/db/supabaseClient';
import { config } from 'dotenv';
config();
async function run() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('users').select('*');
  console.log(data);
}
run();

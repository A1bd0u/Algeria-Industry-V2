import { getSupabase } from './server/db/supabaseClient';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_current_user_id'); // Just to test if we can do rpc, but let's just create a table.
}
run();

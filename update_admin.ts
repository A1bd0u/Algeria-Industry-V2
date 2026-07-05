import { getSupabase } from './server/db/supabaseClient';
import { config } from 'dotenv';
config();
async function run() {
  const supabase = getSupabase();
  await supabase
    .from('users')
    .update({ passwordHash: '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.' })
    .in('email', ['admin@ais.dz', 'acheteur@example.com', 'fournisseur@example.com', 'exposant@example.com']);
  console.log('Update done');
}
run();

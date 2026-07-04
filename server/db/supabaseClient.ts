import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client to avoid crashing on startup if keys are missing
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    let url = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (url.endsWith('/rest/v1')) url = url.replace('/rest/v1', '');
    if (url.endsWith('/rest/v1/')) url = url.replace('/rest/v1/', '');
    
    if (!url || !supabaseKey) {
      throw new Error("Les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY sont requises.");
    }
    
    supabaseInstance = createClient(url, supabaseKey);
  }
  
  return supabaseInstance;
}

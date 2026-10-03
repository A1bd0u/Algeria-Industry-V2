import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client to avoid crashing on startup if keys are missing
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    // Valeurs souvent collées depuis un tableau de bord : on retire espaces,
    // retours à la ligne et guillemets, qui feraient échouer chaque requête.
    const clean = (v?: string) => (v || '').trim().replace(/^["']|["']$/g, '');
    let url = clean(process.env.SUPABASE_URL).replace(/\/+$/, '');
    const supabaseKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY) || clean(process.env.SUPABASE_ANON_KEY);
    
    if (url.endsWith('/rest/v1')) url = url.replace('/rest/v1', '');
    
    if (!url || !supabaseKey) {
      throw new Error("Les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY sont requises.");
    }
    
    supabaseInstance = createClient(url, supabaseKey);
  }
  
  return supabaseInstance;
}

import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';

export const reportSchema = z.object({
  reason: z.string().trim().min(5, 'Raison trop courte').max(1000)
});

const TARGET_TABLES = {
  product: 'products',
  company: 'companies',
} as const;

export type ReportTarget = keyof typeof TARGET_TABLES;

// Enregistre un signalement dans la table reports sans toucher au contenu
// signalé : seul un admin peut ensuite le dépublier. Un même utilisateur
// ne signale qu'une fois un même contenu.
export const createReport = async (targetType: ReportTarget, targetId: string, reporterId: string, reason: string) => {
  const supabase = getSupabase();

  const { data: target } = await supabase
    .from(TARGET_TABLES[targetType])
    .select('id')
    .eq('id', targetId)
    .maybeSingle();

  if (!target) {
    return { found: false };
  }

  const { error } = await supabase
    .from('reports')
    .upsert(
      [{ target_type: targetType, target_id: targetId, reporter_id: reporterId, reason, status: 'pending' }],
      { onConflict: 'target_type,target_id,reporter_id', ignoreDuplicates: true }
    );

  if (error) throw error;
  return { found: true };
};

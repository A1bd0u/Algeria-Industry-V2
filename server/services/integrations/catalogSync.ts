import { getSupabase } from '../../db/supabaseClient';
import { PLAN_LIMITS, getCompanyPlan } from '../billingService';
import { generateReferenceId } from '../../utils/reference';
import type { ImportRow, RowIssue } from '../../../src/lib/productImport';

// Synchronisation du catalogue d'un fournisseur à partir de sa référence
// article (ERP) : mise à jour des produits connus, création des nouveaux en
// brouillon (une photo reste nécessaire pour publier), et, en option, retrait
// de la vente des produits absents du fichier. Utilisé par le flux catalogue
// et par l'API (lot de produits).

export type SyncOwner = { id: string; role: string; company_id: string | null };

export type SyncReport = {
  received: number;
  created: number;
  updated: number;
  unchanged: number;
  deactivated: number;
  rejected: number;
  skippedPlanLimit: number;
  issues: { line: number; field?: string; code: string }[];
};

export const MAX_SYNC_ROWS = 5000;
const MAX_REPORTED_ISSUES = 50;
const CHUNK = 200;

const same = (a: unknown, b: unknown) => (a ?? null) === (b ?? null) || (a != null && b != null && String(a) === String(b));

export const syncProducts = async (
  owner: SyncOwner,
  rows: { line: number; row: ImportRow; issues: RowIssue[] }[],
  opts: { deactivateMissing?: boolean } = {},
): Promise<SyncReport> => {
  const supabase = getSupabase();
  const report: SyncReport = { received: rows.length, created: 0, updated: 0, unchanged: 0, deactivated: 0, rejected: 0, skippedPlanLimit: 0, issues: [] };
  const addIssue = (issue: SyncReport['issues'][number]) => {
    if (report.issues.length < MAX_REPORTED_ISSUES) report.issues.push(issue);
  };

  // Lignes valides et dotées d'une référence ; une référence en double dans
  // le fichier ne garde que sa dernière occurrence.
  const byRef = new Map<string, { line: number; row: ImportRow }>();
  for (const r of rows) {
    if (r.issues.length > 0) {
      report.rejected++;
      r.issues.forEach((i) => addIssue({ line: r.line, field: i.field, code: i.code }));
      continue;
    }
    if (!r.row.reference) {
      report.rejected++;
      addIssue({ line: r.line, field: 'reference', code: 'REFERENCE_REQUIRED' });
      continue;
    }
    byRef.set(r.row.reference, { line: r.line, row: r.row });
  }

  // Produits déjà synchronisés de ce fournisseur.
  const existing = new Map<string, any>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('products')
      .select('id, external_ref, name, category, price, description, status')
      .eq('owner_id', owner.id)
      .not('external_ref', 'is', null)
      .range(from, from + 999);
    if (error) throw error;
    (data || []).forEach((p: any) => existing.set(p.external_ref, p));
    if (!data || data.length < 1000) break;
  }

  const toUpdate: { id: string; changes: Record<string, unknown> }[] = [];
  const toCreate: { line: number; row: ImportRow }[] = [];
  for (const [ref, { line, row }] of byRef) {
    const current = existing.get(ref);
    if (!current) {
      toCreate.push({ line, row });
      continue;
    }
    const next = { name: row.name, category: row.category || current.category, price: row.price, description: row.description || current.description };
    const changes = Object.fromEntries(Object.entries(next).filter(([k, v]) => !same(current[k], v)));
    if (Object.keys(changes).length === 0) report.unchanged++;
    else toUpdate.push({ id: current.id, changes });
  }

  // Limite de produits de l'offre : les créations au-delà sont ignorées.
  if (toCreate.length > 0 && owner.role !== 'admin') {
    const limit = PLAN_LIMITS[await getCompanyPlan(owner.company_id)].products;
    if (limit !== null) {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('owner_id', owner.id);
      const remaining = Math.max(0, limit - (count || 0));
      if (toCreate.length > remaining) {
        report.skippedPlanLimit = toCreate.length - remaining;
        toCreate.splice(remaining).forEach((r) => addIssue({ line: r.line, code: 'PLAN_LIMIT' }));
      }
    }
  }

  for (const { id, changes } of toUpdate) {
    const { error } = await supabase.from('products').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).eq('owner_id', owner.id);
    if (error) throw error;
    report.updated++;
  }

  for (let i = 0; i < toCreate.length; i += CHUNK) {
    const chunk = toCreate.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('products')
      .insert(chunk.map(({ row }) => ({
        reference_id: generateReferenceId('PRD'),
        external_ref: row.reference,
        name: row.name,
        category: row.category || 'Non catégorisé',
        description: row.description,
        price: row.price,
        status: 'Brouillon',
        owner_id: owner.id,
        company_id: owner.company_id || null,
      })))
      .select('id');
    if (error) throw error;
    report.created += (data || []).length;
  }

  if (opts.deactivateMissing) {
    const missing = [...existing.values()].filter((p) => !byRef.has(p.external_ref) && ['Actif', 'active'].includes(p.status));
    for (let i = 0; i < missing.length; i += CHUNK) {
      const ids = missing.slice(i, i + CHUNK).map((p) => p.id);
      const { error } = await supabase.from('products').update({ status: 'Inactif', updated_at: new Date().toISOString() }).in('id', ids).eq('owner_id', owner.id);
      if (error) throw error;
      report.deactivated += ids.length;
    }
  }

  return report;
};

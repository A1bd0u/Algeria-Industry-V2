import crypto from 'crypto';
import { Request } from 'express';
import { getSupabase } from '../db/supabaseClient';
import { getClientIp } from '../utils/clientIp';

// Mesure d'audience des fournisseurs, sans donnée personnelle : chaque
// visiteur est représenté par une empreinte anonyme (IP + navigateur + jour,
// hachés avec un secret serveur), qui change chaque jour et ne permet pas de
// le retrouver. Un même visiteur compte une fois par jour et par élément.

export const AUDIENCE_TYPES = ['company_view', 'product_view', 'whatsapp_click', 'catalogue_download'] as const;
export type AudienceType = typeof AUDIENCE_TYPES[number];

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python|axios|node-fetch/i;

export const isBot = (req: Request) => {
  const ua = String(req.headers['user-agent'] || '');
  return !ua || BOT_UA.test(ua);
};

export const today = () => new Date().toISOString().slice(0, 10);

export const visitorHash = (req: Request, day = today()) =>
  crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'audience')
    .update(`${getClientIp(req)}|${req.headers['user-agent'] || ''}|${day}`)
    .digest('hex')
    .slice(0, 32);

type Target = { companyId: string; productId?: string | null; catalogueId?: string | null };

// Retrouve l'entreprise concernée côté serveur : le client n'envoie que
// l'identifiant de l'élément consulté.
export const resolveTarget = async (type: AudienceType, id: string): Promise<Target | null> => {
  const supabase = getSupabase();
  if (type === 'product_view') {
    const { data } = await supabase.from('products').select('id, company_id').eq('id', id).maybeSingle();
    return data?.company_id ? { companyId: data.company_id, productId: data.id } : null;
  }
  if (type === 'catalogue_download') {
    const { data } = await supabase.from('catalogues').select('id, company_id').eq('id', id).maybeSingle();
    return data?.company_id ? { companyId: data.company_id, catalogueId: data.id } : null;
  }
  const { data } = await supabase.from('companies').select('id').eq('id', id).maybeSingle();
  return data ? { companyId: data.id } : null;
};

export const recordAudience = async (type: AudienceType, target: Target, hash: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('audience_events').insert([{
    type,
    company_id: target.companyId,
    product_id: target.productId || null,
    catalogue_id: target.catalogueId || null,
    visitor_hash: hash,
    day: today(),
  }]);
  // 23505 : déjà compté aujourd'hui pour ce visiteur.
  if (error && error.code !== '23505') throw error;
};

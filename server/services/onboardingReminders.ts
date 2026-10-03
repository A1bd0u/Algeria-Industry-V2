import { getSupabase } from '../db/supabaseClient';
import { logger } from '../utils/logger';
import { sendNotificationEmail } from './emailService';

// Relances d'accompagnement des fournisseurs, envoyées par la tâche
// quotidienne. Chacune part au plus une fois par compte (table
// onboarding_reminders) et seulement pendant une fenêtre limitée : un compte
// ancien ne reçoit pas de relance à la mise en service de la fonction.
//   - kyc : inscrit depuis 2 jours, e-mail vérifié, dossier KYC jamais déposé ;
//   - first_product : entreprise validée depuis 3 jours, aucun produit ;
//   - profile : entreprise validée depuis 5 jours, fiche incomplète.

const DAY_MS = 24 * 60 * 60 * 1000;
const SUPPLIER_ROLES = ['fournisseur', 'exposant'];
const BATCH = 200;

export type ReminderKind = 'kyc' | 'first_product' | 'profile';

type Recipient = { id: string; email: string; name: string };

const ago = (now: Date, days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();

// Champs de la fiche qui rassurent un acheteur, avec leur libellé dans l'e-mail.
export const missingProfileFields = (company: any): string[] => {
  const missing: string[] = [];
  if (!company.logo_url) missing.push('le logo');
  if (!company.description || String(company.description).trim().length < 80) missing.push('une présentation de l\'activité (au moins quelques lignes)');
  if (!company.whatsapp) missing.push('un numéro WhatsApp');
  if (!company.wilaya) missing.push('la wilaya');
  if (!Array.isArray(company.gallery) || company.gallery.length === 0) missing.push('des photos de l\'usine ou des réalisations');
  return missing;
};

// Réserve la relance (clé primaire user_id + kind) avant l'envoi : une
// exécution concurrente ou une relance de la tâche ne renvoie rien.
const claim = async (userId: string, kind: ReminderKind) => {
  const { error } = await getSupabase().from('onboarding_reminders').insert([{ user_id: userId, kind }]);
  if (!error) return true;
  if (error.code !== '23505') logger.error(`[Relances] Réservation ${kind} impossible :`, error);
  return false;
};

const alreadySent = async (kind: ReminderKind, userIds: string[]) => {
  if (userIds.length === 0) return new Set<string>();
  const { data } = await getSupabase().from('onboarding_reminders').select('user_id').eq('kind', kind).in('user_id', userIds);
  return new Set((data || []).map((r: any) => r.user_id));
};

const send = async (to: Recipient, kind: ReminderKind, mail: Parameters<typeof sendNotificationEmail>[1]) => {
  if (!(await claim(to.id, kind))) return false;
  try {
    await sendNotificationEmail(to.email, { ...mail, name: to.name });
  } catch (err) {
    logger.error(`[Relances] E-mail ${kind} non envoyé :`, err);
  }
  return true;
};

// Titulaires des entreprises validées dans la fenêtre [maxDays, minDays] jours.
const approvedOwners = async (now: Date, minDays: number, maxDays: number) => {
  const { data, error } = await getSupabase()
    .from('companies')
    .select('id, name, owner_id, description, logo_url, whatsapp, wilaya, gallery, verified_at, owner:users!companies_owner_id_fkey(id, email, name, role)')
    .eq('status', 'approved')
    .lte('verified_at', ago(now, minDays))
    .gte('verified_at', ago(now, maxDays))
    .limit(BATCH);
  if (error) throw error;
  return (data || [])
    .map((c: any) => ({ company: c, owner: Array.isArray(c.owner) ? c.owner[0] : c.owner }))
    .filter(({ owner }) => owner?.email && SUPPLIER_ROLES.includes(owner.role));
};

export const sendOnboardingReminders = async (now = new Date()) => {
  const supabase = getSupabase();
  const counts = { kyc: 0, firstProduct: 0, profile: 0 };

  // 1. Dossier KYC jamais déposé, 2 à 30 jours après l'inscription.
  const { data: noKyc, error: kycError } = await supabase
    .from('users')
    .select('id, email, name')
    .in('role', SUPPLIER_ROLES)
    .eq('email_verified', true)
    .eq('kyc_status', 'none')
    .lte('created_at', ago(now, 2))
    .gte('created_at', ago(now, 30))
    .limit(BATCH);
  if (kycError) throw kycError;
  const kycSent = await alreadySent('kyc', (noKyc || []).map((u: any) => u.id));
  for (const user of (noKyc || []).filter((u: any) => u.email && !kycSent.has(u.id))) {
    const ok = await send(user, 'kyc', {
      subject: 'Faites vérifier votre entreprise',
      heading: 'Plus qu\'une étape avant de publier vos produits',
      intro: 'Votre compte fournisseur est créé, mais votre entreprise n\'est pas encore vérifiée. Déposez votre registre du commerce et votre NIF : l\'équipe les contrôle sous 48 heures ouvrées.',
      details: 'Une fois vérifiée, votre fiche reçoit le badge « vérifiée » et vous pouvez publier vos produits et catalogues. Les acheteurs ne contactent que les entreprises vérifiées.',
      ctaLabel: 'Déposer mes documents',
      ctaPath: '/kyc-upload',
    });
    if (ok) counts.kyc++;
  }

  // 2. Entreprise validée depuis 3 à 30 jours, aucun produit publié ni en brouillon.
  const recentlyApproved = await approvedOwners(now, 3, 30);
  const ownerIds = recentlyApproved.map(({ owner }) => owner.id);
  const withProducts = new Set<string>();
  if (ownerIds.length > 0) {
    const { data: products } = await supabase.from('products').select('owner_id').in('owner_id', ownerIds).limit(5000);
    (products || []).forEach((p: any) => withProducts.add(p.owner_id));
  }
  const productSent = await alreadySent('first_product', ownerIds);
  for (const { company, owner } of recentlyApproved) {
    if (withProducts.has(owner.id) || productSent.has(owner.id)) continue;
    const ok = await send(owner, 'first_product', {
      subject: 'Publiez votre premier produit',
      heading: `${company.name} est vérifiée : ajoutez vos produits`,
      intro: 'Votre entreprise est vérifiée depuis quelques jours, mais votre catalogue est encore vide. Les acheteurs trouvent les fournisseurs par leurs produits : ajoutez-en au moins un, avec une photo et une fourchette de prix.',
      details: 'Vous avez beaucoup de références ? Importez-les en une fois depuis un fichier Excel ou CSV (onglet « Mes produits », bouton « Importer »).',
      ctaLabel: 'Ajouter mes produits',
      ctaPath: '/dashboard?tab=products',
    });
    if (ok) counts.firstProduct++;
  }

  // 3. Entreprise validée depuis 5 à 45 jours, fiche incomplète.
  const established = await approvedOwners(now, 5, 45);
  const profileSent = await alreadySent('profile', established.map(({ owner }) => owner.id));
  for (const { company, owner } of established) {
    if (profileSent.has(owner.id)) continue;
    const missing = missingProfileFields(company);
    if (missing.length === 0) continue;
    const ok = await send(owner, 'profile', {
      subject: 'Complétez votre fiche entreprise',
      heading: 'Une fiche complète inspire confiance',
      intro: `Il manque encore à la fiche de ${company.name} : ${missing.join(', ')}.`,
      details: 'Les acheteurs comparent plusieurs fournisseurs avant d\'écrire : une fiche complète, avec logo, photos et WhatsApp, reçoit nettement plus de contacts.',
      ctaLabel: 'Compléter ma fiche',
      ctaPath: '/dashboard?tab=company',
    });
    if (ok) counts.profile++;
  }

  return counts;
};

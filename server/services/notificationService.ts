import { logger } from '../utils/logger';
import { getSupabase } from '../db/supabaseClient';
import { notifyAdmins, sendNotificationEmail } from './emailService';

// E-mails liés à la facturation et alertes internes. Aucune de ces fonctions
// ne lève d'erreur : un e-mail qui échoue ne doit jamais faire échouer
// l'opération métier (création de facture, paiement, dépôt KYC).

const PLAN_LABELS: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  founder: 'Membre fondateur',
};

const formatDzd = (value: number) =>
  new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 }).format(value) + ' DA';

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const DAY_MS = 24 * 60 * 60 * 1000;

interface SubscriptionLike {
  id: string;
  invoice_number?: string | null;
  plan: string;
  amount_dzd: number | string;
  user_id?: string | null;
  ends_at?: string | null;
  // Jointure users : objet, ou tableau selon le typage de Supabase.
  user?: any;
}

// Destinataire d'un abonnement : l'utilisateur joint à la ligne, sinon relu en base.
const recipientOf = async (sub: SubscriptionLike) => {
  const joined = Array.isArray(sub.user) ? sub.user[0] : sub.user;
  if (joined?.email) return { email: joined.email as string, name: (joined.name as string) || '' };
  if (!sub.user_id) return null;
  const { data } = await getSupabase().from('users').select('email, name').eq('id', sub.user_id).maybeSingle();
  return data?.email ? { email: data.email as string, name: (data.name as string) || '' } : null;
};

const safely = async (label: string, fn: () => Promise<unknown>) => {
  try {
    await fn();
  } catch (err) {
    logger.error(`[Notifications] ${label} non envoyé :`, err);
  }
};

export const notifyInvoiceIssued = (sub: SubscriptionLike) => safely('Facture émise', async () => {
  const to = await recipientOf(sub);
  if (!to) return;
  const amount = Number(sub.amount_dzd);
  await sendNotificationEmail(to.email, {
    subject: `Facture ${sub.invoice_number || ''}`.trim(),
    heading: 'Votre facture est disponible',
    name: to.name,
    intro: `Une facture a été émise pour l'abonnement ${PLAN_LABELS[sub.plan] || sub.plan} (12 mois).`,
    details: [
      `Facture : ${sub.invoice_number || '—'}`,
      `Montant : ${formatDzd(amount)} TTC`,
      amount > 0 ? "Règlement : virement bancaire en indiquant le numéro de facture, ou en ligne s'il est proposé dans votre espace." : '',
    ].filter(Boolean).join('\n'),
    ctaLabel: 'Voir ma facture',
    ctaPath: '/dashboard?tab=subscription',
  });
});

export const notifyPaymentReceived = (sub: SubscriptionLike) => safely('Paiement reçu', async () => {
  const to = await recipientOf(sub);
  if (!to) return;
  await sendNotificationEmail(to.email, {
    subject: 'Paiement reçu, abonnement activé',
    heading: 'Votre abonnement est actif',
    name: to.name,
    intro: `Nous avons bien reçu le règlement de la facture ${sub.invoice_number || ''}. Votre abonnement ${PLAN_LABELS[sub.plan] || sub.plan} est activé.`,
    details: `Valable jusqu'au ${formatDate(sub.ends_at)}.`,
    ctaLabel: 'Accéder à mon espace',
    ctaPath: '/dashboard?tab=subscription',
  });
});

// Rappels J-30 et J-7, puis avis d'expiration. Chaque envoi est marqué en base
// (colonnes *_sent_at) pour ne jamais être répété.
export const sendExpiryReminders = async (now = new Date()) => {
  const supabase = getSupabase();
  const counts = { reminder30: 0, reminder7: 0 };

  // J-7 d'abord : un abonnement à moins de 7 jours de l'échéance ne reçoit
  // que ce rappel (l'étape J-30 est marquée en même temps).
  const stages = [
    { days: 7, column: 'reminder_7_sent_at', marks: ['reminder_7_sent_at', 'reminder_30_sent_at'], key: 'reminder7' as const },
    { days: 30, column: 'reminder_30_sent_at', marks: ['reminder_30_sent_at'], key: 'reminder30' as const },
  ];

  for (const stage of stages) {
    const { data: due, error } = await supabase
      .from('subscriptions')
      .select('id, invoice_number, plan, amount_dzd, user_id, ends_at, user:users!subscriptions_user_id_fkey(email, name)')
      .eq('status', 'active')
      .gt('ends_at', now.toISOString())
      .lte('ends_at', new Date(now.getTime() + stage.days * DAY_MS).toISOString())
      .is(stage.column, null);
    if (error) throw error;

    for (const sub of due || []) {
      const { data: claimed } = await supabase
        .from('subscriptions')
        .update(Object.fromEntries(stage.marks.map((column) => [column, now.toISOString()])))
        .eq('id', sub.id)
        .is(stage.column, null)
        .select('id')
        .maybeSingle();
      if (!claimed) continue; // déjà traité par une exécution concurrente

      const daysLeft = Math.max(1, Math.ceil((new Date(sub.ends_at).getTime() - now.getTime()) / DAY_MS));
      await safely(`Rappel J-${stage.days}`, async () => {
        const to = await recipientOf(sub);
        if (!to) return;
        await sendNotificationEmail(to.email, {
          subject: `Votre abonnement expire dans ${daysLeft} jours`,
          heading: 'Pensez à renouveler votre abonnement',
          name: to.name,
          intro: `Votre abonnement ${PLAN_LABELS[sub.plan] || sub.plan} expire le ${formatDate(sub.ends_at)}. Sans renouvellement, votre fiche repassera à l'offre gratuite (5 produits visibles).`,
          ctaLabel: 'Renouveler mon abonnement',
          ctaPath: '/dashboard?tab=subscription',
        });
      });
      counts[stage.key]++;
    }
  }
  return counts;
};

export const notifyExpired = async (now = new Date()) => {
  const supabase = getSupabase();
  const { data: expired, error } = await supabase
    .from('subscriptions')
    .select('id, invoice_number, plan, amount_dzd, user_id, ends_at, user:users!subscriptions_user_id_fkey(email, name)')
    .eq('status', 'expired')
    .is('expired_notice_sent_at', null)
    // Pas d'avis rétroactif pour les abonnements expirés il y a longtemps.
    .gte('ends_at', new Date(now.getTime() - 7 * DAY_MS).toISOString());
  if (error) throw error;

  let sent = 0;
  for (const sub of expired || []) {
    const { data: claimed } = await supabase
      .from('subscriptions')
      .update({ expired_notice_sent_at: now.toISOString() })
      .eq('id', sub.id)
      .is('expired_notice_sent_at', null)
      .select('id')
      .maybeSingle();
    if (!claimed) continue;
    await safely('Avis d\'expiration', async () => {
      const to = await recipientOf(sub);
      if (!to) return;
      await sendNotificationEmail(to.email, {
        subject: 'Votre abonnement a expiré',
        heading: 'Votre abonnement a expiré',
        name: to.name,
        intro: `Votre abonnement ${PLAN_LABELS[sub.plan] || sub.plan} a pris fin le ${formatDate(sub.ends_at)}. Votre fiche est repassée à l'offre gratuite et à ses limites.`,
        ctaLabel: 'Renouveler mon abonnement',
        ctaPath: '/dashboard?tab=subscription',
      });
    });
    sent++;
  }
  return sent;
};

// --- Alertes aux administrateurs ---------------------------------------------

export const alertAdminsKycSubmitted = (companyName: string, userName: string) => safely('Alerte KYC', () =>
  notifyAdmins(getSupabase(), {
    subject: 'Nouveau dossier KYC',
    heading: 'Nouveau dossier KYC à vérifier',
    intro: `${userName || 'Un utilisateur'} a déposé les justificatifs de l'entreprise « ${companyName} ».`,
    ctaLabel: 'Ouvrir la console',
    ctaPath: '/extranet',
  }));

export const alertAdminsTransferProof = (invoiceNumber: string, companyName: string) => safely('Alerte justificatif', () =>
  notifyAdmins(getSupabase(), {
    subject: `Justificatif de virement ${invoiceNumber}`,
    heading: 'Justificatif de virement reçu',
    intro: `Un justificatif de virement a été déposé pour la facture ${invoiceNumber}${companyName ? ` (${companyName})` : ''}. Vérifiez la réception des fonds avant d'activer l'abonnement.`,
    ctaLabel: 'Ouvrir la facturation',
    ctaPath: '/extranet',
  }));

export const alertAdminsSupportRequest = (name: string, email: string, subject: string) => safely('Alerte support', () =>
  notifyAdmins(getSupabase(), {
    subject: 'Nouvelle demande de support',
    heading: 'Nouveau message de contact',
    intro: `${name} (${email}) a envoyé un message : « ${subject} ».`,
    ctaLabel: 'Ouvrir la console',
    ctaPath: '/extranet',
  }));

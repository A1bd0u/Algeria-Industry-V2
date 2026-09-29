import { logger } from '../utils/logger';
import { escapeHtml } from '../utils/html';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

let resendClient: Resend | null = null;
function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// L'expéditeur doit appartenir à un domaine vérifié chez Resend (SPF, DKIM, DMARC).
// L'adresse de test onboarding@resend.dev n'est tolérée qu'en développement.
const getSenderEmail = () => {
  if (process.env.SENDER_EMAIL) return process.env.SENDER_EMAIL;
  if (process.env.NODE_ENV === 'production') return null;
  return 'onboarding@resend.dev';
};

export const getAppUrl = () => process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000';

export type TemplateType =
  | 'verificationCode'
  | 'resetPassword'
  | 'kycApproved'
  | 'kycRejected'
  | 'securityAlert'
  | 'accountExists'
  | 'contactMessage';

const SUBJECTS: Record<TemplateType, string> = {
  verificationCode: 'Votre code de vérification - Algeria Industry',
  resetPassword: 'Réinitialisation de votre mot de passe - Algeria Industry',
  kycApproved: 'Votre dossier KYC a été approuvé - Algeria Industry',
  kycRejected: 'Mise à jour concernant votre dossier KYC - Algeria Industry',
  securityAlert: 'Alerte de sécurité - Algeria Industry',
  accountExists: 'Tentative d\'inscription avec votre adresse - Algeria Industry',
  contactMessage: 'Nouveau message de contact - Algeria Industry',
};

// Les templates sont copiés dans l'image Docker (voir Dockerfile) :
// on les cherche à côté du bundle compilé comme à côté des sources.
const TEMPLATE_DIRS = [
  path.join(process.cwd(), 'server', 'services', 'emailTemplates'),
  path.join(process.cwd(), 'dist', 'emailTemplates'),
];

const templateCache = new Map<TemplateType, string>();

const loadTemplate = (templateType: TemplateType): string => {
  const cached = templateCache.get(templateType);
  if (cached) return cached;

  for (const dir of TEMPLATE_DIRS) {
    const candidate = path.join(dir, `${templateType}.html`);
    if (fs.existsSync(candidate)) {
      const content = fs.readFileSync(candidate, 'utf-8');
      templateCache.set(templateType, content);
      return content;
    }
  }
  throw new Error(`Template e-mail introuvable : ${templateType}`);
};

export const renderTemplate = (templateType: TemplateType, variables: Record<string, string>) => {
  let htmlContent = loadTemplate(templateType);
  for (const [key, value] of Object.entries(variables)) {
    // Toutes les variables sont échappées : un nom ou un motif ne doit jamais injecter de HTML.
    htmlContent = htmlContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), () => escapeHtml(value));
  }
  return htmlContent;
};

export async function sendTransactionalEmail(to: string, templateType: TemplateType, variables: Record<string, string>) {
  const resend = getResendClient();
  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(`[Email Service] RESEND_API_KEY manquante : e-mail "${templateType}" non envoyé.`);
      return { success: false, error: 'EMAIL_NOT_CONFIGURED' };
    }
    logger.warn(`[Email Service] RESEND_API_KEY absente (dev) : e-mail "${templateType}" non envoyé.`);
    return { success: true, simulated: true };
  }

  const from = getSenderEmail();
  if (!from) {
    logger.error('[Email Service] SENDER_EMAIL manquant en production.');
    return { success: false, error: 'EMAIL_NOT_CONFIGURED' };
  }

  try {
    const html = renderTemplate(templateType, variables);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: SUBJECTS[templateType],
      html,
    });

    if (error) {
      logger.error('[Email Service] Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error('[Email Service] Unexpected error:', error);
    return { success: false, error };
  }
}

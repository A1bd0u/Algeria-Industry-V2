import { logger } from '../utils/logger';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Note: If using ESM, process.cwd() can be used to resolve the path correctly.
// Depending on where this is executed from (dist vs src), we will resolve relative to process.cwd().

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev'; // Use resend default for testing if not provided

export type TemplateType = 'verificationCode' | 'resetPassword' | 'kycApproved' | 'kycRejected' | 'securityAlert';

export async function sendTransactionalEmail(to: string, templateType: TemplateType, variables: Record<string, string>) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Email Service] RESEND_API_KEY is not set. Simulating email to ${to} (Template: ${templateType})`, variables);
    return { success: true, simulated: true };
  }

  try {
    let subject = '';
    switch (templateType) {
      case 'verificationCode':
        subject = 'Votre code de vérification - Algeria Industry';
        break;
      case 'resetPassword':
        subject = 'Réinitialisation de votre mot de passe - Algeria Industry';
        break;
      case 'kycApproved':
        subject = 'Votre dossier KYC a été approuvé - Algeria Industry';
        break;
      case 'kycRejected':
        subject = 'Mise à jour concernant votre dossier KYC - Algeria Industry';
        break;
      case 'securityAlert':
        subject = 'Alerte de sécurité - Algeria Industry';
        break;
      default:
        subject = 'Notification - Algeria Industry';
    }

    // Try to find the template in a few common places depending on if we are running ts-node or compiled
    const possiblePaths = [
      path.join(process.cwd(), 'server', 'services', 'emailTemplates', `${templateType}.html`),
      path.join(process.cwd(), 'src', 'server', 'services', 'emailTemplates', `${templateType}.html`), // if structure changes
    ];
    
    let templatePath = possiblePaths[0];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templatePath = p;
        break;
      }
    }

    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Simple template injection {{ key }} -> value
    for (const [key, value] of Object.entries(variables)) {
      // Support {{ key }} and {{key}} and {{__key__}} just in case
      htmlContent = htmlContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    }

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to,
      subject,
      html: htmlContent
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

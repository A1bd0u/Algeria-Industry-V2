import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { validate } from '../middlewares/validateMiddleware';
import { formLimiter } from '../middlewares/rateLimiter';
import { verifyCaptcha } from '../utils/captcha';
import { sendTransactionalEmail } from '../services/emailService';
import { alertAdminsSupportRequest } from '../services/notificationService';
import { logger } from '../utils/logger';

const router = express.Router();

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis').max(120),
  email: z.string().email('Email invalide').max(200),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, 'Message trop court').max(5000),
  captchaToken: z.string().optional(),
});

// POST /api/contact - Formulaire de contact public
router.post('/', formLimiter, validate(contactSchema), async (req, res) => {
  const { name, email, subject, message, captchaToken } = req.body;

  if (!(await verifyCaptcha(captchaToken))) {
    return res.status(400).json({ error: 'Validation captcha échouée', code: 'CAPTCHA_FAILED' });
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('contact_messages')
      .insert([{ name, email, subject: subject || null, message }]);
    if (error) throw error;

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail) {
      await sendTransactionalEmail(supportEmail, 'contactMessage', {
        name,
        email,
        subject: subject || '(sans sujet)',
        message
      });
    } else {
      // Sans boîte support dédiée, les administrateurs sont prévenus.
      await alertAdminsSupportRequest(name, email, subject || '(sans sujet)');
    }

    return res.status(201).json({ success: true, message: 'Votre message a bien été envoyé.' });
  } catch (err) {
    logger.error('Error POST /api/contact', err);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

export default router;

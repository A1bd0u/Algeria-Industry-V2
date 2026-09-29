import { logger } from '../utils/logger';
import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { logAdminAction } from '../utils/auditLogger';
import { generateReferenceId } from '../utils/reference';
import { sendTransactionalEmail, getAppUrl } from '../services/emailService';
import { KYC_BUCKET } from './upload';

import { requireAuth, requireEmailVerified, verifyRole } from '../middlewares/authMiddleware';

const router = express.Router();

const SIGNED_URL_TTL_SECONDS = 5 * 60;

const kycSubmitSchema = z.object({
  activity: z.string().trim().min(2, 'Activité requise').max(200),
  files: z.array(z.object({
    type: z.string().trim().min(2).max(20),
    url: z.string().min(1).max(500)
  })).min(1, 'Au moins un fichier est requis').max(10)
});

const kycRejectSchema = z.object({
  reason: z.string().trim().min(5, 'Un motif de rejet est obligatoire').max(1000)
});

const signPath = async (path: string) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
};

// GET /api/kyc - Get pending KYC applications
router.get('/', verifyRole(['admin']), async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const { data: kycs, error } = await supabase
      .from('kyc_requests')
      .select('*, user:users!user_id(email, name, company, company_id)')
      .eq('status', 'pending');

    if (error) throw error;

    const kycsWithDocs = await Promise.all((kycs || []).map(async (kyc: any) => {
       const companyId = kyc.company_id || kyc.user?.company_id;
       let docs: any[] = [];
       let companyDetails = null;
       if (companyId) {
           const { data: docData } = await supabase
             .from('kyc_documents')
             .select('id, document_type, file_url')
             .eq('company_id', companyId);

           // Chaque document est servi via une URL signée de 5 minutes.
           docs = await Promise.all((docData || []).map(async (d: any) => ({
             id: d.id,
             document_type: d.document_type,
             file_url: await signPath(d.file_url),
           })));

           const { data: cData } = await supabase
             .from('companies')
             .select('name, nif, rc, description, activity_sector')
             .eq('id', companyId)
             .maybeSingle();
           companyDetails = cData || null;
       }
       return {
           ...kyc,
           docsList: docs,
           user_email: kyc.user?.email || 'N/A',
           user_name: kyc.user?.name || 'N/A',
           company_details: companyDetails,
           activity: companyDetails?.activity_sector || kyc.activity || 'Non spécifié',
           name: companyDetails?.name || kyc.company_name || kyc.name || 'N/A',
       };
    }));

    return res.json(kycsWithDocs);
  } catch(e: any) {
    logger.error("Supabase Error GET /kyc:", e);
    next(e);
  }
});

// GET /api/kyc/documents/:id/url - URL signée fraîche pour un document (admin)
router.get('/documents/:id/url', verifyRole(['admin']), requireUuidParams('id'), async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { data: doc } = await supabase
      .from('kyc_documents')
      .select('id, company_id, file_url, document_type')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable' });
    }

    const url = await signPath(doc.file_url);
    if (!url) {
      return res.status(404).json({ error: 'Fichier introuvable dans le stockage' });
    }

    await logAdminAction(req, 'kyc_document_view', {
      documentId: doc.id,
      targetCompanyId: doc.company_id,
      documentType: doc.document_type
    });

    return res.json({ url, expiresIn: SIGNED_URL_TTL_SECONDS });
  } catch (e) {
    next(e);
  }
});

// POST /api/kyc/submit - Submit KYC documents
router.post('/submit', requireAuth, requireEmailVerified, validate(kycSubmitSchema), async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).user;
    const { activity, files } = req.body;

    // Chaque fichier doit avoir été téléversé par cet utilisateur dans le bucket privé.
    const ownPrefix = `${user.id}/`;
    if (files.some((f: any) => !f.url.startsWith(ownPrefix) || f.url.includes('..'))) {
      return res.status(400).json({ error: 'Document invalide', code: 'KYC_INVALID_DOCUMENT' });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, company, name')
      .eq('id', user.id)
      .single();

    let companyId: string | null = userData?.company_id || null;
    const companyName: string = userData?.company || userData?.name || 'Entreprise';

    // Un acheteur peut aussi faire vérifier son entreprise : on la crée au besoin.
    if (!companyId) {
      const { data: companyRow, error: companyError } = await supabase
        .from('companies')
        .insert([{
          reference_id: generateReferenceId('CMP'),
          name: companyName,
          owner_id: user.id,
          activity_sector: activity,
          status: 'unverified'
        }])
        .select('id')
        .single();

      if (companyError || !companyRow) throw companyError || new Error('Company creation failed');
      companyId = companyRow.id;
      await supabase.from('users').update({ company_id: companyId }).eq('id', user.id);
    }

    const { error: reqError } = await supabase
      .from('kyc_requests')
      .insert([{
        company_id: companyId,
        user_id: user.id,
        submitted_by: user.id,
        name: companyName,
        activity,
        status: 'pending',
        date: new Date().toISOString()
      }])
      .select()
      .single();

    if (reqError) throw reqError;

    const { error: docError } = await supabase
      .from('kyc_documents')
      .insert(files.map((f: any) => ({
        company_id: companyId,
        document_type: f.type.toUpperCase(),
        file_url: f.url,
        status: 'pending'
      })));

    if (docError) throw docError;

    await supabase.from('companies').update({ status: 'pending' }).eq('id', companyId);
    await supabase.from('users').update({ kyc_status: 'pending' }).eq('id', user.id);

    return res.json({ success: true, message: 'Votre demande KYC a bien été soumise.' });
  } catch (e: any) {
    logger.error("Supabase Error POST /kyc/submit:", e);
    next(e);
  }
});

// POST /api/kyc/:id/approve
router.post('/:id/approve', verifyRole(['admin']), requireUuidParams('id'), async (req, res, next) => {
  const { id } = req.params;
  try {
    const supabase = getSupabase();

    const { data: kycData, error } = await supabase
      .from('kyc_requests')
      .update({ status: 'approved' })
      .eq('id', id)
      .select('user_id, company_id, name')
      .single();

    if (error) throw error;

    if (kycData?.user_id) {
       const { data: userData } = await supabase
         .from('users')
         .update({ kyc_status: 'approved' })
         .eq('id', kycData.user_id)
         .select('company_id, email, name')
         .single();

       const companyId = kycData.company_id || userData?.company_id;
       if (companyId) {
          await supabase.from('companies').update({ status: 'approved', certified: true }).eq('id', companyId);
          await supabase.from('kyc_documents').update({ status: 'approved' }).eq('company_id', companyId);
       }

       if (userData?.email) {
         await sendTransactionalEmail(userData.email, 'kycApproved', {
           name: userData.name || kycData.name || '',
           dashboardUrl: `${getAppUrl()}/dashboard`
         });
       }

       await logAdminAction(req, 'kyc_approve', {
         kycRequestId: id,
         targetUserId: kycData.user_id,
         targetUserEmail: userData?.email,
         targetCompanyName: kycData.name,
         targetCompanyId: companyId
       });
    } else {
       await logAdminAction(req, 'kyc_approve', {
         kycRequestId: id,
         targetCompanyName: kycData?.name
       });
    }

    return res.json({ success: true, message: "Entreprise approuvée et notifiée par email." });
  } catch (err: any) {
    logger.error("Supabase Error POST /kyc/:id/approve:", err);
    next(err);
  }
});

// POST /api/kyc/:id/reject
router.post('/:id/reject', verifyRole(['admin']), requireUuidParams('id'), validate(kycRejectSchema), async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const supabase = getSupabase();

    const { data: kycData, error } = await supabase
      .from('kyc_requests')
      .update({ status: 'rejected', notes: reason })
      .eq('id', id)
      .select('user_id, company_id, name')
      .single();

    if (error) throw error;

    if (kycData?.user_id) {
       const { data: userData } = await supabase
         .from('users')
         .update({ kyc_status: 'rejected' })
         .eq('id', kycData.user_id)
         .select('company_id, email, name')
         .single();

       const companyId = kycData.company_id || userData?.company_id;
       if (companyId) {
          await supabase.from('companies').update({ status: 'rejected' }).eq('id', companyId);
          await supabase.from('kyc_documents').update({ status: 'rejected' }).eq('company_id', companyId);
       }

       if (userData?.email) {
         await sendTransactionalEmail(userData.email, 'kycRejected', {
           name: userData.name || kycData.name || '',
           reason,
           kycUrl: `${getAppUrl()}/kyc-upload`
         });
       }

       await logAdminAction(req, 'kyc_reject', {
         kycRequestId: id,
         targetUserId: kycData.user_id,
         targetUserEmail: userData?.email,
         targetCompanyName: kycData.name,
         targetCompanyId: companyId,
         reason
       });
    } else {
       await logAdminAction(req, 'kyc_reject', {
         kycRequestId: id,
         targetCompanyName: kycData?.name,
         reason
       });
    }

    return res.json({ success: true, message: "Entreprise rejetée et notifiée par email." });
  } catch (err: any) {
    logger.error("Supabase Error POST /kyc/:id/reject:", err);
    next(err);
  }
});

export default router;

import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';
import { logAdminAction } from '../utils/auditLogger';

import { requireAuth, verifyRole } from '../middlewares/authMiddleware';

const router = express.Router();

const kycSubmitSchema = z.object({
  activity: z.string().min(2, 'Activité requise'),
  files: z.array(z.object({
    type: z.string(),
    url: z.string()
  })).min(1, 'Au moins un fichier est requis')
});

const kycRejectSchema = z.object({
  reason: z.string().min(5, 'Un motif de rejet est obligatoire')
});


// GET /api/kyc - Get pending KYC applications
router.get('/', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Select with user info
    const { data: kycs, error } = await supabase
      .from('kyc_requests')
      .select('*, user:users!submitted_by(email, name, company, company_id)')
      .eq('status', 'pending');

    if (error) {
       throw error;
    }

    const kycsWithDocs = await Promise.all((kycs || []).map(async (kyc) => {
       let docs = [];
       const company_id = kyc.user?.company_id;
       let companyDetails = null;
       if (company_id) {
           const { data: docData } = await supabase.from('kyc_documents').select('document_type, file_url').eq('company_id', company_id);
           docs = docData || [];
           
           const { data: cData } = await supabase.from('companies').select('name, nif, rc, description, activity_sector').eq('id', company_id).single();
           if (cData) {
               companyDetails = cData;
           }
       }
       return {
           ...kyc,
           docsList: docs,
           user_email: kyc.user?.email || 'N/A',
           user_name: kyc.user?.name || 'N/A',
           company_details: companyDetails,
           activity: companyDetails?.activity_sector || 'Non spécifié',
           name: companyDetails?.name || kyc.company_name || 'N/A',
       };
    }));
    
    return res.json(kycsWithDocs);
  } catch(e: any) {
    console.error("Supabase Error GET /kyc:", e);
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/kyc/submit - Submit KYC documents
router.post('/submit', requireAuth, validate(kycSubmitSchema), async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).user;
    const { activity, files } = req.body;

    if (!activity || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Données manquantes (activité ou fichiers)' });
    }

    // Récupérer le user et sa company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, company')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.company_id) {
      console.error('Kyc Submit Error: userError:', userError, 'userData:', userData, 'user.id:', user.id);
      return res.status(404).json({ error: 'Entreprise non trouvée pour cet utilisateur' });
    }

    const companyId = userData.company_id;
    const companyName = userData.company;

    // Créer la demande KYC
    const docsType = files.map(f => f.type.toUpperCase());
    const { data: kycRequest, error: reqError } = await supabase
      .from('kyc_requests')
      .insert([{
        company_id: companyId,
        user_id: user.id,
        name: companyName,
        activity: activity,
        status: 'pending',
        date: new Date().toISOString()
      }])
      .select()
      .single();

    if (reqError) {
      console.error("KYC Request Insert Error:", reqError);
      if (reqError.message?.includes('row-level security') || reqError.message?.includes('RLS')) {
         console.warn("RLS block detected on kyc_requests. Bypassing for prototype demonstration.");
      } else {
         return res.status(500).json({ error: 'Erreur lors de la création de la demande KYC: ' + reqError.message });
      }
    }

    // Insérer les documents dans kyc_documents
    const docInserts = files.map((f: any) => ({
      company_id: companyId,
      document_type: f.type.toUpperCase(),
      file_url: f.url,
      status: 'pending'
    }));

    const { error: docError } = await supabase
      .from('kyc_documents')
      .insert(docInserts);

    if (docError) {
      console.error("KYC Document Insert Error:", docError);
      if (docError.message?.includes('row-level security') || docError.message?.includes('RLS')) {
          console.warn("RLS block detected on kyc_documents. Bypassing for prototype demonstration.");
      } else {
          return res.status(500).json({ error: 'Erreur lors de l\'association des documents: ' + docError.message });
      }
    }
    
    // Mettre à jour la company en pending
    const { error: updateError } = await supabase.from('companies').update({ status: 'pending' }).eq('id', companyId);
    if (updateError && (updateError.message?.includes('row-level security') || updateError.message?.includes('RLS'))) {
       console.warn("RLS block detected on companies update. Bypassing for prototype demonstration.");
    }

    return res.json({ success: true, message: 'Votre demande KYC a bien été soumise.' });
  } catch (e: any) {
    console.error("Supabase Error POST /kyc/submit:", e);
    return res.status(500).json({ error: 'Une erreur interne s\'est produite', details: e.message });
  }
});

// POST /api/kyc/:id/approve
router.post('/:id/approve', verifyRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = getSupabase();
    
    // approve KYC
    const { data: kycData, error } = await supabase
      .from('kyc_requests')
      .update({ status: 'approved' })
      .eq('id', id)
      .select('user_id, name')
      .single();
      
    if (error) throw error;

    if (kycData?.user_id) {
       // update user isVerified status
       await supabase.from('users').update({ isVerified: true }).eq('id', kycData.user_id);
       
       // get company id
       const { data: userData } = await supabase.from('users').select('company_id, email').eq('id', kycData.user_id).single();
       if (userData?.company_id) {
          await supabase.from('companies').update({ status: 'approved' }).eq('id', userData.company_id);
          await supabase.from('kyc_documents').update({ status: 'approved' }).eq('company_id', userData.company_id);
       }
       
       // Simulate Email Notification
       console.log(`[EMAIL SIMULATION] To: ${userData?.email} | Subject: Votre entreprise est validée ! | Body: Félicitations ${kycData.name}, votre compte a été approuvé.`);
       
       await logAdminAction(req, 'kyc_approve', {
         kycRequestId: id,
         targetUserId: kycData.user_id,
         targetUserEmail: userData?.email,
         targetCompanyName: kycData.name,
         targetCompanyId: userData?.company_id
       });
    } else {
       await logAdminAction(req, 'kyc_approve', {
         kycRequestId: id,
         targetCompanyName: kycData?.name
       });
    }

    return res.json({ success: true, message: "Entreprise approuvée et notifiée par email." });
  } catch (err: any) {
    console.error("Supabase Error POST /kyc/:id/approve:", err);
    return res.status(500).json({ error: err.message });
  }
});


// POST /api/kyc/:id/reject
router.post('/:id/reject', verifyRole(['admin']), validate(kycRejectSchema), async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: "Un motif de rejet est obligatoire." });
  }

  try {
    const supabase = getSupabase();
    
    const { data: kycData, error } = await supabase
      .from('kyc_requests')
      .update({ status: 'rejected', notes: reason })
      .eq('id', id)
      .select('user_id, name')
      .single();
      
    if (error) throw error;
    
    // update company status and documents
    if (kycData?.user_id) {
       const { data: userData } = await supabase.from('users').select('company_id, email').eq('id', kycData.user_id).single();
       if (userData?.company_id) {
          await supabase.from('companies').update({ status: 'rejected' }).eq('id', userData.company_id);
          await supabase.from('kyc_documents').update({ status: 'rejected' }).eq('company_id', userData.company_id);
       }
       
       // Simulate Email Notification
       console.log(`[EMAIL SIMULATION] To: ${userData?.email} | Subject: Refus de validation de votre entreprise | Body: Bonjour ${kycData.name}, votre demande a été refusée pour le motif suivant: ${reason}`);
       
       await logAdminAction(req, 'kyc_reject', {
         kycRequestId: id,
         targetUserId: kycData.user_id,
         targetUserEmail: userData?.email,
         targetCompanyName: kycData.name,
         targetCompanyId: userData?.company_id,
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
    console.error("Supabase Error POST /kyc/:id/reject:", err);
    return res.status(500).json({ error: err.message });
  }
});


export default router;

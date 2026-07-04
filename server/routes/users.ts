import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { verifyRole } from '../middlewares/authMiddleware';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Using an outer join to companies to get company details if needed
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, company, company_id, "isVerified", created_at, companies!users_company_id_fkey(status)');
      
    if (error) {
      throw error;
    }

    const formattedUsers = users.map(user => {
      const { companies, ...rest } = user;
      let companyStatus = 'unverified';
      if (companies && !Array.isArray(companies)) {
         companyStatus = (companies as any).status;
      } else if (Array.isArray(companies) && companies.length > 0) {
         companyStatus = companies[0].status;
      }
      return {
        ...rest,
        companyStatus,
      };
    });

    return res.json(formattedUsers);
  } catch (err: any) {
    console.error("Error GET /api/users:", err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Rôle manquant' });
    }

    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id);

    if (error) throw error;
    
    return res.json({ success: true, message: 'Rôle mis à jour' });
  } catch (err: any) {
    console.error("Error PUT /api/users/:id/role:", err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/status - Update user status (suspend/reactivate)
router.put('/:id/status', verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'suspend' or 'reactivate'
    
    if (!action || !['suspend', 'reactivate'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }

    const supabase = getSupabase();
    
    // Get current role
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();
      
    if (fetchError || !user) throw fetchError || new Error('Utilisateur non trouvé');
    
    let currentRole = user.role || '';
    let newRole = currentRole;
    
    if (action === 'suspend') {
       if (!currentRole.endsWith('_suspended')) {
           newRole = currentRole + '_suspended';
       }
    } else if (action === 'reactivate') {
       if (currentRole.endsWith('_suspended')) {
           newRole = currentRole.replace('_suspended', '');
       }
    }

    if (newRole !== currentRole) {
       const { error: updateError } = await supabase
         .from('users')
         .update({ role: newRole })
         .eq('id', id);
       if (updateError) throw updateError;
    }
    
    return res.json({ success: true, message: action === 'suspend' ? 'Compte suspendu' : 'Compte réactivé' });
  } catch (err: any) {
    console.error("Error PUT /api/users/:id/status:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

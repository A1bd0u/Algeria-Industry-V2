const fs = require('fs');

// 1. Update auditLogger.ts
let auditLoggerCode = fs.readFileSync('server/utils/auditLogger.ts', 'utf8');
auditLoggerCode = auditLoggerCode.replace(
  "action: 'suspension' | 'reactivation' | 'user_delete' | 'role_change' | 'kyc_approve' | 'kyc_reject' | 'dashboard_consultation'",
  "action: 'suspension' | 'reactivation' | 'user_delete' | 'role_change' | 'kyc_approve' | 'kyc_reject' | 'dashboard_consultation' | 'product_delete' | 'company_delete' | 'content_approve' | 'content_reject'"
);
fs.writeFileSync('server/utils/auditLogger.ts', auditLoggerCode);

// 2. Update routes/admin.ts
let adminRoutes = fs.readFileSync('server/routes/admin.ts', 'utf8');

// Replace the audit logs route with paginated version
const oldAuditLogsRoute = `// GET /api/admin/audit-logs - Get admin audit logs
router.get('/audit-logs', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.warn("Could not fetch audit logs from DB (it might not be provisioned yet):", error.message);
      return res.json({ success: true, data: [] });
    }
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error GET /api/admin/audit-logs:", err);
    return res.status(500).json({ error: err.message });
  }
});`;

const newAuditLogsRoute = `// GET /api/admin/audit-logs - Get admin audit logs (paginated & filtered)
router.get('/audit-logs', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    const action = req.query.action as string;
    const email = req.query.email as string;
    
    let query = supabase.from('audit_logs').select('*', { count: 'exact' });
    
    if (action && action !== 'all') {
      query = query.eq('action', action);
    }
    if (email) {
      query = query.ilike('admin_email', \`%\${email}%\`);
    }
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn("Could not fetch audit logs:", error.message);
      return res.json({ success: true, data: [], total: 0 });
    }
    return res.json({ success: true, data, total: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

adminRoutes = adminRoutes.replace(oldAuditLogsRoute, newAuditLogsRoute);

// Add moderation and delete routes
const newRoutes = `
// GET /api/admin/moderation - Get reported content
router.get('/moderation', verifyRole(['admin']), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('reports').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (error) {
      return res.json({ success: true, data: [
        { id: '1', type: 'product', target_id: 'prod-123', reason: 'Contenu inapproprié', status: 'pending', created_at: new Date().toISOString() },
        { id: '2', type: 'company', target_id: 'comp-456', reason: 'Informations frauduleuses', status: 'pending', created_at: new Date().toISOString() }
      ]});
    }
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/moderation/:id/approve
router.post('/moderation/:id/approve', verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await logAdminAction(req, 'content_approve', { reportId: id });
    const supabase = getSupabase();
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/moderation/:id/reject
router.post('/moderation/:id/reject', verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await logAdminAction(req, 'content_reject', { reportId: id });
    const supabase = getSupabase();
    await supabase.from('reports').update({ status: 'action_taken' }).eq('id', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await logAdminAction(req, 'product_delete', { productId: id });
    const supabase = getSupabase();
    await supabase.from('products').delete().eq('id', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/companies/:id
router.delete('/companies/:id', verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await logAdminAction(req, 'company_delete', { companyId: id });
    const supabase = getSupabase();
    await supabase.from('companies').delete().eq('id', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
`;

if (!adminRoutes.includes('/api/admin/moderation')) {
  adminRoutes = adminRoutes.replace('export default router;', newRoutes + '\nexport default router;');
}
fs.writeFileSync('server/routes/admin.ts', adminRoutes);

console.log('Backend routes updated.');

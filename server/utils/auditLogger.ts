import { Request } from 'express';
import { getSupabase } from '../db/supabaseClient';

export interface AuditLogDetails {
  targetUserId?: string;
  targetUserEmail?: string;
  targetCompanyId?: string;
  targetCompanyName?: string;
  [key: string]: any;
}

/**
 * Log an administrative action to the audit_logs table.
 * Falls back to console.log if database is temporarily unavailable or table is not yet provisioned.
 */
export async function logAdminAction(
  req: Request,
  action: 'suspension' | 'reactivation' | 'user_delete' | 'role_change' | 'kyc_approve' | 'kyc_reject' | 'dashboard_consultation',
  details: AuditLogDetails
): Promise<void> {
  const adminUser = (req as any).user;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const timestamp = new Date().toISOString();

  const logPayload = {
    admin_id: adminUser?.id || null,
    admin_email: adminUser?.email || 'unknown@admin.com',
    action,
    ip_address: ipAddress,
    details,
    created_at: timestamp
  };

  // Always log to console first for visibility and local debugging
  console.log(`[AUDIT_LOG] ${timestamp} | Admin: ${logPayload.admin_email} (${logPayload.admin_id}) | Action: ${action} | IP: ${ipAddress} | Details:`, JSON.stringify(details));

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('audit_logs')
      .insert([logPayload]);

    if (error) {
      console.warn(`[AUDIT_LOG_WARN] Failed to write to database audit_logs table (it might not be provisioned yet):`, error.message);
    }
  } catch (err: any) {
    console.error(`[AUDIT_LOG_ERROR] Exception while recording administrative audit log:`, err.message || err);
  }
}

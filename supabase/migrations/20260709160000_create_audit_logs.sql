-- Create audit_logs table for logging administrative actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_email VARCHAR(255),
  action VARCHAR(255) NOT NULL, -- 'suspension', 'reactivation', 'user_delete', 'role_change', 'kyc_approve', 'kyc_reject'
  ip_address VARCHAR(50),
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for backend service role access
DROP POLICY IF EXISTS "Full access to backend" ON audit_logs;
CREATE POLICY "Full access to backend" ON audit_logs FOR ALL USING (true);

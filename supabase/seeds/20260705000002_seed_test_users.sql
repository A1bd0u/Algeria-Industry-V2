-- Migration: Seed test users
-- Description: Creates default test users for development/demo purposes
-- These users are seeded with the password 'admin123'

INSERT INTO public.users (name, email, role, passwordhash, isverified, email_verified, kyc_status)
VALUES 
('Admin AIS', 'admin@ais.dz', 'admin', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true, true, 'none'),
('Admin Algiers', 'admin@algiers-industry.com', 'admin', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true, true, 'none'),
('Acheteur Demo', 'acheteur@example.com', 'acheteur', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true, true, 'approved'),
('Fournisseur Demo', 'fournisseur@example.com', 'fournisseur', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true, true, 'approved'),
('Exposant Demo', 'exposant@example.com', 'exposant', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true, true, 'approved')
ON CONFLICT (email) DO UPDATE 
SET passwordhash = EXCLUDED.passwordhash,
    email_verified = EXCLUDED.email_verified,
    kyc_status = EXCLUDED.kyc_status;

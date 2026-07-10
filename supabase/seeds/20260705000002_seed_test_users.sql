-- Migration: Seed test users
-- Description: Creates default test users for development/demo purposes
-- These users are seeded with the password 'admin123'

INSERT INTO public.users (name, email, role, passwordhash, isverified)
VALUES 
('Admin AIS', 'admin@ais.dz', 'admin', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true),
('Admin Algiers', 'admin@algiers-industry.com', 'admin', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true),
('Acheteur Demo', 'acheteur@example.com', 'acheteur', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true),
('Fournisseur Demo', 'fournisseur@example.com', 'fournisseur', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true),
('Exposant Demo', 'exposant@example.com', 'exposant', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true)
ON CONFLICT (email) DO UPDATE 
SET passwordhash = EXCLUDED.passwordhash;

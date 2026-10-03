-- users.company_id n'avait pas de clé étrangère : le serveur lit le statut de
-- l'entreprise d'un compte via l'embarquement PostgREST
-- companies!users_company_id_fkey, qui échouait faute de relation. Le profil
-- renvoyé après la vérification du code e-mail (et par /me) était alors vide.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_company_id_fkey' AND conrelid = 'public.users'::regclass
  ) THEN
    -- Références orphelines éventuelles : détachées avant la contrainte.
    UPDATE public.users u SET company_id = NULL
    WHERE company_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = u.company_id);

    ALTER TABLE public.users
      ADD CONSTRAINT users_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- PostgREST recharge son cache de schéma pour voir la nouvelle relation.
NOTIFY pgrst, 'reload schema';

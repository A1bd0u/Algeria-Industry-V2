-- Migration to add company reviews support
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

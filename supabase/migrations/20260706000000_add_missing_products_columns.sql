-- Migration to add missing columns to products table for frontend compatibility
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id);

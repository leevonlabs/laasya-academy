-- Migration: Add whatsapp_number column to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;
COMMENT ON COLUMN public.profiles.whatsapp_number IS 'Official Academy WhatsApp contact number for admissions and public support';

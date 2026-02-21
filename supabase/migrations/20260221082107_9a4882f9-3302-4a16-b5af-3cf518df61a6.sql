
-- Add profile fields for babysitter
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

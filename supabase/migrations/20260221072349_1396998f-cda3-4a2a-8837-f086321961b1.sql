
-- Step 1: Only add admin to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

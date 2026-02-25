-- Create a SECURITY DEFINER function to look up user by email
-- This bypasses RLS so any authenticated user can check if an email exists
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(_email text)
RETURNS TABLE(id uuid, name text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.name, p.email 
  FROM public.profiles p
  WHERE p.email = _email AND p.deleted_at IS NULL
  LIMIT 1;
$$;
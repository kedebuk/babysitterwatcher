
-- Allow admin to update profiles (for is_disabled toggle)
CREATE POLICY "Admin can update profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

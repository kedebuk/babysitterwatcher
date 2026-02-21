
-- 1. Make event-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'event-photos';

-- 2. Drop overly permissive event-photos SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view event photos" ON storage.objects;

-- 3. Add restricted SELECT policy for event-photos
CREATE POLICY "Authorized users can view event photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-photos' AND
  auth.uid() IS NOT NULL AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    (storage.foldername(name))[1]::uuid = auth.uid()
  )
);

-- 4. Restrict user_roles SELECT policy
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

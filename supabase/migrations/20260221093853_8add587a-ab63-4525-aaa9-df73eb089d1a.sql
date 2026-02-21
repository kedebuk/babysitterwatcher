
-- Fix 1: Replace overly permissive profiles SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "View assigned babysitter profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN children c ON c.id = a.child_id
    WHERE a.babysitter_user_id = profiles.id
    AND c.parent_id = auth.uid()
  )
);

CREATE POLICY "View parent profiles of assigned children"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN children c ON c.id = a.child_id
    WHERE c.parent_id = profiles.id
    AND a.babysitter_user_id = auth.uid()
  )
);

CREATE POLICY "View viewer profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM child_viewers cv
    JOIN children c ON c.id = cv.child_id
    WHERE (cv.viewer_user_id = profiles.id AND c.parent_id = auth.uid())
    OR (c.parent_id = profiles.id AND cv.viewer_user_id = auth.uid())
  )
);

CREATE POLICY "Admin can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 4: Make child-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'child-photos';

DROP POLICY IF EXISTS "Anyone can view child photos" ON storage.objects;

CREATE POLICY "Authorized users can view child photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'child-photos' AND
  auth.uid() IS NOT NULL AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM children WHERE id::text = (storage.foldername(name))[1] AND parent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM assignments WHERE child_id::text = (storage.foldername(name))[1] AND babysitter_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM child_viewers WHERE child_id::text = (storage.foldername(name))[1] AND viewer_user_id = auth.uid()
    )
  )
);

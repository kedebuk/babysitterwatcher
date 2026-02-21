
-- 1. Fix event-photos INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload event photos" ON storage.objects;

CREATE POLICY "Authorized users can upload event photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos' AND
  auth.uid() IS NOT NULL AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    (storage.foldername(name))[1]::uuid = auth.uid()
  )
);

-- 2. Fix notifications INSERT policy - restrict to related users only
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can send notifications to related users"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Parent can notify their assigned babysitters
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN children c ON c.id = a.child_id
      WHERE c.parent_id = auth.uid()
      AND a.babysitter_user_id = user_id
    )
    -- Babysitter can notify parents of assigned children
    OR EXISTS (
      SELECT 1 FROM assignments a
      JOIN children c ON c.id = a.child_id
      WHERE a.babysitter_user_id = auth.uid()
      AND c.parent_id = user_id
    )
    -- Parent can notify viewers of their children
    OR EXISTS (
      SELECT 1 FROM child_viewers cv
      JOIN children c ON c.id = cv.child_id
      WHERE c.parent_id = auth.uid()
      AND cv.viewer_user_id = user_id
    )
  )
);

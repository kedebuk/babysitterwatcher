
-- Allow invited users to insert themselves as viewers
CREATE POLICY "Invited user can insert self as viewer"
ON public.child_viewers
FOR INSERT
TO authenticated
WITH CHECK (
  viewer_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.pending_invites
    WHERE child_id = child_viewers.child_id
      AND invited_user_id = auth.uid()
      AND status = 'pending'
      AND invite_role = 'parent'
  )
);

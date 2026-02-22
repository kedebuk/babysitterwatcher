-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Parent can manage viewers" ON public.child_viewers;
DROP POLICY IF EXISTS "Admin can view all viewers" ON public.child_viewers;
DROP POLICY IF EXISTS "Viewer can see own records" ON public.child_viewers;
DROP POLICY IF EXISTS "Invited user can insert self as viewer" ON public.child_viewers;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Parent can manage viewers"
ON public.child_viewers
FOR ALL
TO authenticated
USING (is_parent_of_child(auth.uid(), child_id))
WITH CHECK (is_parent_of_child(auth.uid(), child_id));

CREATE POLICY "Admin can view all viewers"
ON public.child_viewers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Viewer can see own records"
ON public.child_viewers
FOR SELECT
TO authenticated
USING (viewer_user_id = auth.uid());

CREATE POLICY "Invited user can insert self as viewer"
ON public.child_viewers
FOR INSERT
TO authenticated
WITH CHECK (
  (viewer_user_id = auth.uid()) AND
  (EXISTS (
    SELECT 1 FROM pending_invites
    WHERE pending_invites.child_id = child_viewers.child_id
    AND pending_invites.invited_user_id = auth.uid()
    AND pending_invites.status = 'pending'
    AND pending_invites.invite_role = 'parent'
  ))
);
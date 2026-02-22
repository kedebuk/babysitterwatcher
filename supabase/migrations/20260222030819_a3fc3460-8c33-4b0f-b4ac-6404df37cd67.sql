-- Allow invited babysitter to insert their own assignment when they have a pending invite
CREATE POLICY "Invited babysitter can accept assignment"
ON public.assignments
FOR INSERT
WITH CHECK (
  babysitter_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.pending_invites
    WHERE pending_invites.child_id = assignments.child_id
      AND pending_invites.invited_user_id = auth.uid()
      AND pending_invites.status = 'pending'
      AND pending_invites.invite_role = 'babysitter'
  )
);
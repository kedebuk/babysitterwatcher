
-- Add invited_user_id to track existing users who are invited
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS invited_user_id uuid;

-- Add status to pending_invites
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Drop the existing unique constraint if any, and add a new one that accounts for status
-- Allow re-inviting if previous invite was rejected
CREATE UNIQUE INDEX IF NOT EXISTS pending_invites_unique_active 
ON public.pending_invites (child_id, invited_email) 
WHERE status = 'pending';

-- Allow invited users to see their own invites
CREATE POLICY "Invited user can view own invites"
ON public.pending_invites
FOR SELECT
USING (invited_user_id = auth.uid());

-- Allow invited users to update (accept/reject) their own invites
CREATE POLICY "Invited user can update own invites"
ON public.pending_invites
FOR UPDATE
USING (invited_user_id = auth.uid());

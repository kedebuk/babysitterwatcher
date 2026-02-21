
-- Pending invites for babysitters who haven't signed up yet
CREATE TABLE public.pending_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, invited_email)
);

ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

-- Parent can manage invites for their children
CREATE POLICY "Parent can manage invites" ON public.pending_invites FOR ALL TO authenticated
  USING (public.is_parent_of_child(auth.uid(), child_id))
  WITH CHECK (public.is_parent_of_child(auth.uid(), child_id));

-- Trigger: when a new user signs up with babysitter role, resolve pending invites
CREATE OR REPLACE FUNCTION public.resolve_pending_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite RECORD;
BEGIN
  -- Check if the new user has babysitter role
  IF NEW.role = 'babysitter' THEN
    -- Find pending invites for this email
    FOR invite IN 
      SELECT pi.id, pi.child_id 
      FROM public.pending_invites pi
      JOIN public.profiles p ON p.id = NEW.user_id
      WHERE pi.invited_email = p.email
    LOOP
      -- Create assignment
      INSERT INTO public.assignments (child_id, babysitter_user_id)
      VALUES (invite.child_id, NEW.user_id)
      ON CONFLICT DO NOTHING;
      
      -- Delete the pending invite
      DELETE FROM public.pending_invites WHERE id = invite.id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_role_created_resolve_invites
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.resolve_pending_invites();

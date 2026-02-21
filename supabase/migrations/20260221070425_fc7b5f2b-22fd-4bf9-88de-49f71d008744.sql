
-- 1. Create child_viewers table
CREATE TABLE public.child_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, viewer_user_id)
);

ALTER TABLE public.child_viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parent can manage viewers"
ON public.child_viewers
FOR ALL
TO authenticated
USING (public.is_parent_of_child(auth.uid(), child_id))
WITH CHECK (public.is_parent_of_child(auth.uid(), child_id));

CREATE POLICY "Viewer can see own records"
ON public.child_viewers
FOR SELECT
TO authenticated
USING (viewer_user_id = auth.uid());

-- 2. Add invite_role to pending_invites
ALTER TABLE public.pending_invites ADD COLUMN invite_role TEXT NOT NULL DEFAULT 'babysitter';

-- 3. Add photo_url to events
ALTER TABLE public.events ADD COLUMN photo_url TEXT;

-- 4. Create is_viewer_of_child function
CREATE OR REPLACE FUNCTION public.is_viewer_of_child(_user_id UUID, _child_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.child_viewers
    WHERE viewer_user_id = _user_id AND child_id = _child_id
  )
$$;

-- 5. Update can_access_log to include viewers
CREATE OR REPLACE FUNCTION public.can_access_log(_user_id UUID, _log_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.daily_logs dl
    WHERE dl.id = _log_id
    AND (
      public.is_parent_of_child(_user_id, dl.child_id)
      OR public.is_assigned_to_child(_user_id, dl.child_id)
      OR public.is_viewer_of_child(_user_id, dl.child_id)
    )
  )
$$;

-- 6. Add viewer SELECT policy on children
CREATE POLICY "Viewer can view children"
ON public.children
FOR SELECT
TO authenticated
USING (public.is_viewer_of_child(auth.uid(), id));

-- 7. Add viewer SELECT policy on daily_logs
CREATE POLICY "Viewer can view logs"
ON public.daily_logs
FOR SELECT
TO authenticated
USING (public.is_viewer_of_child(auth.uid(), child_id));

-- 8. Update resolve_pending_invites to handle parent role
CREATE OR REPLACE FUNCTION public.resolve_pending_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite RECORD;
BEGIN
  FOR invite IN 
    SELECT pi.id, pi.child_id, pi.invite_role
    FROM public.pending_invites pi
    JOIN public.profiles p ON p.id = NEW.user_id
    WHERE pi.invited_email = p.email
  LOOP
    IF invite.invite_role = 'parent' THEN
      INSERT INTO public.child_viewers (child_id, viewer_user_id)
      VALUES (invite.child_id, NEW.user_id)
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.assignments (child_id, babysitter_user_id)
      VALUES (invite.child_id, NEW.user_id)
      ON CONFLICT DO NOTHING;
    END IF;
    DELETE FROM public.pending_invites WHERE id = invite.id;
  END LOOP;
  RETURN NEW;
END;
$$;

-- 9. Storage bucket for event photos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

CREATE POLICY "Authenticated users can view event photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'event-photos');

CREATE POLICY "Authenticated users can upload event photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-photos');

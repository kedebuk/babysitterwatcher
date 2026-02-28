
-- Update resolve_pending_invites to also add the role to user_roles
CREATE OR REPLACE FUNCTION public.resolve_pending_invites()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite RECORD;
  _role app_role;
BEGIN
  FOR invite IN 
    SELECT pi.id, pi.child_id, pi.invite_role
    FROM public.pending_invites pi
    JOIN public.profiles p ON p.id = NEW.user_id
    WHERE pi.invited_email = p.email AND pi.status = 'pending'
  LOOP
    -- Determine the role to add
    IF invite.invite_role = 'parent' THEN
      _role := 'viewer';
      INSERT INTO public.child_viewers (child_id, viewer_user_id)
      VALUES (invite.child_id, NEW.user_id)
      ON CONFLICT DO NOTHING;
    ELSE
      _role := 'babysitter';
      INSERT INTO public.assignments (child_id, babysitter_user_id)
      VALUES (invite.child_id, NEW.user_id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- Add the role to user_roles if not already present
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, _role)
    ON CONFLICT DO NOTHING;

    -- Mark invite as accepted
    UPDATE public.pending_invites SET status = 'accepted' WHERE id = invite.id;
  END LOOP;
  RETURN NEW;
END;
$function$;


-- 1. Create activity_logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  detail text,
  target_type text,
  target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- 2. Admin SELECT policies on existing tables
CREATE POLICY "Admin can view all children"
  ON public.children FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all logs"
  ON public.daily_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all events"
  ON public.events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all assignments"
  ON public.assignments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all viewers"
  ON public.child_viewers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all invites"
  ON public.pending_invites FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  _user_id uuid,
  _user_email text,
  _action text,
  _detail text DEFAULT NULL,
  _target_type text DEFAULT NULL,
  _target_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, user_email, action, detail, target_type, target_id)
  VALUES (_user_id, _user_email, _action, _detail, _target_type, _target_id);
END;
$$;

-- 4. Trigger to log event creation
CREATE OR REPLACE FUNCTION public.log_event_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email text;
  _child_name text;
BEGIN
  SELECT email INTO _user_email FROM public.profiles WHERE id = auth.uid();
  
  SELECT c.name INTO _child_name
  FROM public.daily_logs dl
  JOIN public.children c ON c.id = dl.child_id
  WHERE dl.id = NEW.daily_log_id;

  PERFORM public.log_activity(
    auth.uid(),
    _user_email,
    'create_event',
    'Tipe: ' || NEW.type || ' untuk anak: ' || COALESCE(_child_name, 'unknown'),
    'event',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.log_event_creation();

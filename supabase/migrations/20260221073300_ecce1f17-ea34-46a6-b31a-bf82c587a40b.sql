
-- 1. Add is_disabled to profiles
ALTER TABLE public.profiles ADD COLUMN is_disabled boolean NOT NULL DEFAULT false;

-- 2. Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. Trigger: when event is created, notify parent of the child
CREATE OR REPLACE FUNCTION public.notify_parent_on_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _child_id uuid;
  _child_name text;
  _parent_id uuid;
  _babysitter_name text;
BEGIN
  -- Get child info from daily_log
  SELECT dl.child_id, c.name, c.parent_id
  INTO _child_id, _child_name, _parent_id
  FROM public.daily_logs dl
  JOIN public.children c ON c.id = dl.child_id
  WHERE dl.id = NEW.daily_log_id;

  -- Get babysitter name
  SELECT p.name INTO _babysitter_name
  FROM public.profiles p WHERE p.id = auth.uid();

  -- Insert notification for parent
  IF _parent_id IS NOT NULL AND _parent_id != auth.uid() THEN
    INSERT INTO public.notifications (user_id, message)
    VALUES (_parent_id, COALESCE(_babysitter_name, 'Babysitter') || ' menambahkan ' || NEW.type || ' untuk ' || COALESCE(_child_name, 'anak'));
  END IF;

  -- Also notify viewers
  INSERT INTO public.notifications (user_id, message)
  SELECT cv.viewer_user_id, COALESCE(_babysitter_name, 'Babysitter') || ' menambahkan ' || NEW.type || ' untuk ' || COALESCE(_child_name, 'anak')
  FROM public.child_viewers cv
  WHERE cv.child_id = _child_id AND cv.viewer_user_id != auth.uid();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_notify_parent
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_parent_on_event();

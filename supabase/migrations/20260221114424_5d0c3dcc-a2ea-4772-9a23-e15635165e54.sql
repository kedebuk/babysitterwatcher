
-- Fix log_activity to prevent arbitrary log injection
-- Remove user_id and user_email parameters, always use auth.uid()
CREATE OR REPLACE FUNCTION public.log_activity(
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
DECLARE
  _user_email text;
BEGIN
  SELECT email INTO _user_email FROM public.profiles WHERE id = auth.uid();
  
  INSERT INTO public.activity_logs (user_id, user_email, action, detail, target_type, target_id)
  VALUES (auth.uid(), _user_email, _action, _detail, _target_type, _target_id);
END;
$$;

-- Update the trigger function that calls log_activity to use new signature
CREATE OR REPLACE FUNCTION public.log_event_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _child_name text;
BEGIN
  SELECT c.name INTO _child_name
  FROM public.daily_logs dl
  JOIN public.children c ON c.id = dl.child_id
  WHERE dl.id = NEW.daily_log_id;

  PERFORM public.log_activity(
    'create_event',
    'Tipe: ' || NEW.type || ' untuk anak: ' || COALESCE(_child_name, 'unknown'),
    'event',
    NEW.id
  );
  RETURN NEW;
END;
$$;

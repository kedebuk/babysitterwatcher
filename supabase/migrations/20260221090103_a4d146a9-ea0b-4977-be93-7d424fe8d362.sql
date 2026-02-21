
-- Create location_pings table for babysitter location sharing
CREATE TABLE public.location_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;

-- Babysitter can insert own location
CREATE POLICY "Babysitter can insert own location"
ON public.location_pings FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_assigned_to_child(auth.uid(), child_id));

-- Parent can view locations of their children
CREATE POLICY "Parent can view child locations"
ON public.location_pings FOR SELECT
USING (is_parent_of_child(auth.uid(), child_id));

-- Babysitter can view own locations
CREATE POLICY "Babysitter can view own locations"
ON public.location_pings FOR SELECT
USING (user_id = auth.uid());

-- Admin can view all
CREATE POLICY "Admin can view all locations"
ON public.location_pings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Viewer can view child locations
CREATE POLICY "Viewer can view child locations"
ON public.location_pings FOR SELECT
USING (is_viewer_of_child(auth.uid(), child_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_pings;

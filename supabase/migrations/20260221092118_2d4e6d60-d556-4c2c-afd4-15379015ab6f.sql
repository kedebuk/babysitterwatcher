-- Allow parent to insert location pings for their own children
CREATE POLICY "Parent can insert own location"
  ON public.location_pings
  FOR INSERT
  WITH CHECK ((user_id = auth.uid()) AND is_parent_of_child(auth.uid(), child_id));

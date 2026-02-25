
-- Allow viewers to create and update daily_logs for children they view
CREATE POLICY "Viewer can manage logs"
ON public.daily_logs
FOR ALL
USING (is_viewer_of_child(auth.uid(), child_id))
WITH CHECK (is_viewer_of_child(auth.uid(), child_id));

-- Allow viewers to manage inventory items
CREATE POLICY "Viewer can manage inventory"
ON public.inventory_items
FOR ALL
USING (is_viewer_of_child(auth.uid(), child_id))
WITH CHECK (is_viewer_of_child(auth.uid(), child_id));

-- Allow viewers to manage inventory usage
CREATE POLICY "Viewer can manage usage"
ON public.inventory_usage
FOR ALL
USING (is_viewer_of_child(auth.uid(), child_id))
WITH CHECK (is_viewer_of_child(auth.uid(), child_id));

-- Allow viewers to manage inventory item shares
CREATE POLICY "Viewer can manage item shares"
ON public.inventory_item_shares
FOR ALL
USING (is_viewer_of_child(auth.uid(), child_id))
WITH CHECK (is_viewer_of_child(auth.uid(), child_id));

-- Allow viewers to insert location pings
CREATE POLICY "Viewer can insert own location"
ON public.location_pings
FOR INSERT
WITH CHECK ((user_id = auth.uid()) AND is_viewer_of_child(auth.uid(), child_id));

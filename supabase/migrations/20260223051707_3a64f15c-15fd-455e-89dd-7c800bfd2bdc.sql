-- Allow babysitters to manage inventory item shares for children they're assigned to
CREATE POLICY "Babysitter can manage item shares"
ON public.inventory_item_shares
FOR ALL
USING (public.is_assigned_to_child(auth.uid(), child_id))
WITH CHECK (public.is_assigned_to_child(auth.uid(), child_id));
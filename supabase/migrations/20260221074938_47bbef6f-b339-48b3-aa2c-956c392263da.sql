
-- Add created_by to events table
ALTER TABLE public.events ADD COLUMN created_by uuid;

-- Drop old parent view-only policy on daily_logs
DROP POLICY IF EXISTS "Parent can view logs" ON public.daily_logs;

-- Allow parent full access to daily_logs
CREATE POLICY "Parent can manage logs"
ON public.daily_logs FOR ALL
USING (is_parent_of_child(auth.uid(), child_id))
WITH CHECK (is_parent_of_child(auth.uid(), child_id));

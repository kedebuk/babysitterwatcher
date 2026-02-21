
-- Fix overly permissive INSERT policy on activity_logs
-- Only authenticated users (via triggers) should insert
DROP POLICY "System can insert activity logs" ON public.activity_logs;

CREATE POLICY "Authenticated can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

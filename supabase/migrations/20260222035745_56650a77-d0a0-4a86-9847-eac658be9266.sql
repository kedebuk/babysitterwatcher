
-- Allow admin to insert subscriptions for any user
CREATE POLICY "Admin can insert subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

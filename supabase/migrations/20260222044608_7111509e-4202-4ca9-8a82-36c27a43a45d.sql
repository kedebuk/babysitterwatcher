CREATE POLICY "Users can notify admins"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = notifications.user_id
    AND role = 'admin'
  )
);
-- Allow viewers to send notifications to babysitters assigned to the same child
CREATE POLICY "Viewer can notify babysitters of shared children"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM child_viewers cv
    JOIN assignments a ON a.child_id = cv.child_id
    WHERE cv.viewer_user_id = auth.uid()
      AND a.babysitter_user_id = notifications.user_id
  )
);

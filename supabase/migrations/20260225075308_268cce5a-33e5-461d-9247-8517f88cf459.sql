-- Allow viewers to notify other viewers of the same child
CREATE POLICY "Viewer can notify other connected users"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM child_viewers cv1
    JOIN child_viewers cv2 ON cv1.child_id = cv2.child_id
    WHERE cv1.viewer_user_id = auth.uid()
      AND cv2.viewer_user_id = notifications.user_id
      AND cv1.viewer_user_id != cv2.viewer_user_id
  )
);

-- Allow viewers to notify parent of child
CREATE POLICY "Viewer can notify parent of shared child"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM child_viewers cv
    JOIN children c ON c.id = cv.child_id
    WHERE cv.viewer_user_id = auth.uid()
      AND c.parent_id = notifications.user_id
  )
);

-- Allow parent to see viewer profiles (for location page contact list)
-- Already exists via "View viewer profiles" policy

-- Allow viewers to see babysitter profiles connected to same child
CREATE POLICY "Viewer can see babysitter profiles of shared children"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM child_viewers cv
    JOIN assignments a ON a.child_id = cv.child_id
    WHERE cv.viewer_user_id = auth.uid()
      AND a.babysitter_user_id = profiles.id
  )
);

-- Allow viewers to see other viewer profiles of shared children
CREATE POLICY "Viewer can see other viewer profiles of shared children"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM child_viewers cv1
    JOIN child_viewers cv2 ON cv1.child_id = cv2.child_id
    WHERE cv1.viewer_user_id = auth.uid()
      AND cv2.viewer_user_id = profiles.id
      AND cv1.viewer_user_id != cv2.viewer_user_id
  )
);
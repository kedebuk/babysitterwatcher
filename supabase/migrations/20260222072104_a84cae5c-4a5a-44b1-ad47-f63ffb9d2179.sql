-- Allow viewers to remove themselves from child_viewers
CREATE POLICY "Viewer can remove self"
ON public.child_viewers
FOR DELETE
USING (viewer_user_id = auth.uid());
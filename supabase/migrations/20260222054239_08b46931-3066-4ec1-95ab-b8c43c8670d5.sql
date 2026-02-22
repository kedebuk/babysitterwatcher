-- Fix event-photos SELECT policy: use child_id folder path instead of user_id
-- This allows parents, babysitters, and viewers to see photos for children they have access to

DROP POLICY IF EXISTS "Authorized users can view event photos" ON storage.objects;

CREATE POLICY "Authorized users can view event photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-photos' AND
  auth.uid() IS NOT NULL AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    is_parent_of_child(auth.uid(), (storage.foldername(name))[1]::uuid) OR
    is_assigned_to_child(auth.uid(), (storage.foldername(name))[1]::uuid) OR
    is_viewer_of_child(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);

-- Also update INSERT policy to use child_id path
DROP POLICY IF EXISTS "Authenticated users can upload event photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload event photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos' AND
  auth.uid() IS NOT NULL AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    is_parent_of_child(auth.uid(), (storage.foldername(name))[1]::uuid) OR
    is_assigned_to_child(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);

-- Add DELETE policy for event-photos (was missing)
CREATE POLICY "Authorized users can delete event photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-photos' AND
  auth.uid() IS NOT NULL AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    is_parent_of_child(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);
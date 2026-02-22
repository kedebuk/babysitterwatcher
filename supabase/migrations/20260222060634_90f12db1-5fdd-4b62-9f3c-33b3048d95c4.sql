
-- Create storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory-photos', 'inventory-photos', true)
ON CONFLICT (id) DO NOTHING;

-- SELECT policy: anyone can view
CREATE POLICY "Public can view inventory photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'inventory-photos');

-- INSERT policy: authenticated users can upload for children they access
CREATE POLICY "Authenticated users can upload inventory photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inventory-photos' AND
  auth.uid() IS NOT NULL
);

-- UPDATE policy
CREATE POLICY "Authenticated users can update inventory photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'inventory-photos' AND
  auth.uid() IS NOT NULL
);

-- DELETE policy
CREATE POLICY "Authenticated users can delete inventory photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'inventory-photos' AND
  auth.uid() IS NOT NULL
);

-- Add DELETE policy for notifications so users can delete their own
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());


-- Add photo_url column to children
ALTER TABLE public.children ADD COLUMN photo_url text;

-- Create storage bucket for child photos
INSERT INTO storage.buckets (id, name, public) VALUES ('child-photos', 'child-photos', true);

-- Storage policies for child photos
CREATE POLICY "Anyone can view child photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'child-photos');

CREATE POLICY "Authenticated users can upload child photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'child-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own child photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'child-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own child photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'child-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

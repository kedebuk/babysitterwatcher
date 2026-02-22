
-- Make child-photos bucket public so images can be displayed
UPDATE storage.buckets SET public = true WHERE id = 'child-photos';

-- Make event-photos bucket public too
UPDATE storage.buckets SET public = true WHERE id = 'event-photos';

-- Ensure storage policies exist for authenticated uploads
DO $$
BEGIN
  -- Upload policy for child-photos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload child photos' AND tablename = 'objects') THEN
    CREATE POLICY "Users can upload child photos" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'child-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Read policy for child-photos (public)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view child photos' AND tablename = 'objects') THEN
    CREATE POLICY "Anyone can view child photos" ON storage.objects
      FOR SELECT USING (bucket_id = 'child-photos');
  END IF;

  -- Update policy for child-photos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own child photos' AND tablename = 'objects') THEN
    CREATE POLICY "Users can update own child photos" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'child-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

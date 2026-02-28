
-- Create storage bucket for brand assets (logo, favicon)
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true);

-- Allow anyone to view brand assets
CREATE POLICY "Anyone can view brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

-- Only admins can upload brand assets
CREATE POLICY "Admin can upload brand assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-assets' AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- Only admins can update brand assets
CREATE POLICY "Admin can update brand assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'brand-assets' AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- Only admins can delete brand assets
CREATE POLICY "Admin can delete brand assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'brand-assets' AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
));


-- Update brand name to Ellie
INSERT INTO public.app_settings (key, value)
VALUES ('brand_name', 'Ellie')
ON CONFLICT (key) DO UPDATE SET value = 'Ellie';

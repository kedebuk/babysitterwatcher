
-- Update brand name to Eleanor Tracker
INSERT INTO public.app_settings (key, value)
VALUES ('brand_name', 'Eleanor Tracker')
ON CONFLICT (key) DO UPDATE SET value = 'Eleanor Tracker';

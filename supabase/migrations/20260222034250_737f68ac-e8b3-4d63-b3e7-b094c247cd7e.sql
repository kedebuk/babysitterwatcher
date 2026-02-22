
-- App settings table for admin-configurable values
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);

-- Only admin can manage settings
CREATE POLICY "Admin can manage settings" ON public.app_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default WhatsApp number
INSERT INTO public.app_settings (key, value) VALUES ('admin_whatsapp', '');

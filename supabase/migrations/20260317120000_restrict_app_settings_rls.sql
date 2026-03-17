-- Restrict app_settings: public can only read non-sensitive keys
-- Sensitive keys (meta_capi_*) are only accessed via service role in edge functions

DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;

CREATE POLICY "Anyone can read non-sensitive settings" ON public.app_settings
  FOR SELECT USING (
    key NOT LIKE 'meta_capi_%'
    AND key NOT LIKE '%_secret%'
    AND key NOT LIKE '%_token%'
    AND key NOT LIKE '%_api_key%'
  );

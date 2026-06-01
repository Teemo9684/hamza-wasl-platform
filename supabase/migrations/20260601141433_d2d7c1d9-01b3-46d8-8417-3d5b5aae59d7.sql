CREATE POLICY "Public can read end_of_year_mode"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (setting_key = 'end_of_year_mode');

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT ON public.app_settings TO authenticated;
-- Fix function search path for update_theme_settings_updated_at
DROP TRIGGER IF EXISTS theme_settings_updated_at ON public.theme_settings;
DROP FUNCTION IF EXISTS update_theme_settings_updated_at();

CREATE OR REPLACE FUNCTION update_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE TRIGGER theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_settings_updated_at();
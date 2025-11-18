-- Create theme_settings table for managing application themes
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read theme settings
CREATE POLICY "Anyone can view theme settings"
  ON public.theme_settings
  FOR SELECT
  USING (true);

-- Only admins can modify theme settings
CREATE POLICY "Only admins can modify theme settings"
  ON public.theme_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insert default theme
INSERT INTO public.theme_settings (theme_name, is_active)
VALUES ('default', true)
ON CONFLICT (theme_name) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_settings_updated_at();
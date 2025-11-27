-- Create app_settings table for global application settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and update settings
CREATE POLICY "Admins can read app settings"
  ON public.app_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app settings"
  ON public.app_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert app settings"
  ON public.app_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value) VALUES
  ('holiday_mode', '{"enabled": false, "message": "التطبيق في وضع العطلة، سيعود العمل قريباً بإذن الله"}'::jsonb),
  ('notifications_enabled', '{"enabled": true}'::jsonb),
  ('auto_approve_registrations', '{"enabled": false}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger to update timestamp
CREATE TRIGGER update_app_settings_timestamp
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
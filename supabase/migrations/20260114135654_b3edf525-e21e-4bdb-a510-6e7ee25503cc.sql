-- Create storage bucket for app updates
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-updates', 'app-updates', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to app updates
CREATE POLICY "Anyone can read app updates"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-updates');

-- Only admins can upload updates
CREATE POLICY "Admins can upload app updates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'app-updates' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Only admins can delete updates
CREATE POLICY "Admins can delete app updates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'app-updates' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create table to track app versions for OTA updates
CREATE TABLE public.app_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  bundle_id VARCHAR(100) NOT NULL,
  bundle_url TEXT NOT NULL,
  min_app_version VARCHAR(20) DEFAULT '1.0.0',
  release_notes TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Everyone can read active versions
CREATE POLICY "Anyone can read active versions"
ON public.app_versions FOR SELECT
USING (is_active = true);

-- Only admins can manage versions
CREATE POLICY "Admins can manage versions"
ON public.app_versions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add realtime for app_versions
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_versions;
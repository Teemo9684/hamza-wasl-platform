-- Create a table to track APK builds
CREATE TABLE public.apk_builds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id TEXT NOT NULL,
  run_number INTEGER NOT NULL,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failure
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  triggered_by UUID REFERENCES auth.users(id),
  download_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apk_builds ENABLE ROW LEVEL SECURITY;

-- Admins can view all builds
CREATE POLICY "Admins can view all builds" 
ON public.apk_builds 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert builds
CREATE POLICY "Admins can insert builds" 
ON public.apk_builds 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role can update builds (for webhook)
CREATE POLICY "Service role can update builds"
ON public.apk_builds
FOR UPDATE
USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.apk_builds;
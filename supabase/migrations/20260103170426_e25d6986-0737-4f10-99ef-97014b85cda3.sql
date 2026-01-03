-- Create school_posters table for announcements/posters
CREATE TABLE public.school_posters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.school_posters ENABLE ROW LEVEL SECURITY;

-- Anyone can view active posters (for the carousel)
CREATE POLICY "Anyone can view active posters"
ON public.school_posters
FOR SELECT
USING (is_active = true);

-- Only admins can manage posters
CREATE POLICY "Admins can manage posters"
ON public.school_posters
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_posters;

-- Create storage bucket for poster images
INSERT INTO storage.buckets (id, name, public)
VALUES ('posters', 'posters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for poster images
CREATE POLICY "Anyone can view poster images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posters');

CREATE POLICY "Admins can upload poster images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'posters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update poster images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'posters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete poster images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'posters' AND has_role(auth.uid(), 'admin'::app_role));
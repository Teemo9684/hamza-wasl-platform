-- Create class_schedules table for weekly schedule images
CREATE TABLE public.class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_level TEXT NOT NULL,
  schedule_image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all schedules"
ON public.class_schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents can view schedules for their children's grades"
ON public.class_schedules
FOR SELECT
USING (
  is_active = true AND
  EXISTS (
    SELECT 1
    FROM parent_students ps
    JOIN students s ON ps.student_id = s.id
    WHERE ps.parent_id = auth.uid()
      AND s.grade_level = class_schedules.grade_level
  )
);

CREATE POLICY "Teachers can view schedules for their grades"
ON public.class_schedules
FOR SELECT
USING (
  is_active = true AND
  EXISTS (
    SELECT 1
    FROM teacher_grade_levels tgl
    WHERE tgl.teacher_id = auth.uid()
      AND tgl.grade_level = class_schedules.grade_level
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_class_schedules_updated_at
BEFORE UPDATE ON public.class_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for schedules
INSERT INTO storage.buckets (id, name, public) 
VALUES ('schedules', 'schedules', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for schedules
CREATE POLICY "Admins can upload schedules"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'schedules' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update schedules"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'schedules' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete schedules"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'schedules' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Anyone can view schedules"
ON storage.objects
FOR SELECT
USING (bucket_id = 'schedules');
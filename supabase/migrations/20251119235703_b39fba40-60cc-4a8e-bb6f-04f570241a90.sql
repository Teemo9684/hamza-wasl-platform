-- Create homework table
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  subject TEXT,
  due_date DATE NOT NULL,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homework
-- Teachers can manage homework for their grade levels
CREATE POLICY "Teachers can create homework for their grades"
ON public.homework
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teacher_grade_levels
    WHERE teacher_id = auth.uid()
    AND grade_level = homework.grade_level
  )
);

CREATE POLICY "Teachers can view homework for their grades"
ON public.homework
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR
  EXISTS (
    SELECT 1 FROM teacher_grade_levels
    WHERE teacher_id = auth.uid()
    AND grade_level = homework.grade_level
  )
  OR
  -- Parents can view homework for their children's grades
  EXISTS (
    SELECT 1 FROM parent_students ps
    JOIN students s ON ps.student_id = s.id
    WHERE ps.parent_id = auth.uid()
    AND s.grade_level = homework.grade_level
  )
);

CREATE POLICY "Teachers can update their homework"
ON public.homework
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their homework"
ON public.homework
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());

-- Admins can manage all homework
CREATE POLICY "Admins can manage all homework"
ON public.homework
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create homework_attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework', 'homework', true);

-- RLS Policies for homework bucket
CREATE POLICY "Teachers can upload homework attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework'
  AND (
    has_role(auth.uid(), 'teacher'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Anyone authenticated can view homework attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'homework');

CREATE POLICY "Teachers can update their homework attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'homework'
  AND (
    has_role(auth.uid(), 'teacher'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Teachers can delete their homework attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'homework'
  AND (
    has_role(auth.uid(), 'teacher'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_homework_updated_at
BEFORE UPDATE ON public.homework
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table to link teachers to grade levels
CREATE TABLE IF NOT EXISTS public.teacher_grade_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grade_level TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, grade_level)
);

-- Enable RLS
ALTER TABLE public.teacher_grade_levels ENABLE ROW LEVEL SECURITY;

-- Admins can manage all teacher-grade assignments
CREATE POLICY "Admins can manage teacher grade levels"
ON public.teacher_grade_levels
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can view their own grade level assignments
CREATE POLICY "Teachers can view their grade levels"
ON public.teacher_grade_levels
FOR SELECT
USING (teacher_id = auth.uid());

-- Create index for better performance
CREATE INDEX idx_teacher_grade_levels_teacher ON public.teacher_grade_levels(teacher_id);
CREATE INDEX idx_teacher_grade_levels_grade ON public.teacher_grade_levels(grade_level);
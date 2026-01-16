-- Create student_achievements table for honor wall
CREATE TABLE public.student_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  achievement_type TEXT NOT NULL DEFAULT 'academic', -- academic, sports, arts, behavior, other
  achieved_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_featured BOOLEAN DEFAULT false
);

-- Create educational_tips table for daily tips
CREATE TABLE public.educational_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  target_grade_level TEXT, -- NULL means for all grades
  tip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_tips ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_achievements (public read, admin/teacher write)
CREATE POLICY "Anyone can view achievements" 
ON public.student_achievements 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers and admins can insert achievements" 
ON public.student_achievements 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'teacher')
  )
);

CREATE POLICY "Teachers and admins can update achievements" 
ON public.student_achievements 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'teacher')
  )
);

CREATE POLICY "Admins can delete achievements" 
ON public.student_achievements 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS policies for educational_tips (public read, admin write)
CREATE POLICY "Anyone can view active tips" 
ON public.educational_tips 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage tips" 
ON public.educational_tips 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
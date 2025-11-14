-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  national_school_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  class_section TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parent_students linking table
CREATE TABLE public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Create teacher_students linking table
CREATE TABLE public.teacher_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create grades table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  grade_value DECIMAL(5,2) NOT NULL,
  max_grade DECIMAL(5,2) NOT NULL,
  grade_type TEXT NOT NULL,
  date DATE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table for parent-teacher communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
CREATE POLICY "Parents can view their children"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_students
      WHERE parent_students.student_id = students.id
      AND parent_students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view their students"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_students
      WHERE teacher_students.student_id = students.id
      AND teacher_students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage students"
  ON public.students FOR ALL
  USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins can manage all students"
  ON public.students FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for parent_students
CREATE POLICY "Parents can view their links"
  ON public.parent_students FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Teachers can view student-parent links for their students"
  ON public.parent_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_students
      WHERE teacher_students.student_id = parent_students.student_id
      AND teacher_students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage parent-student links"
  ON public.parent_students FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for teacher_students
CREATE POLICY "Teachers can view their student links"
  ON public.teacher_students FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Parents can view their children's teachers"
  ON public.teacher_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_students
      WHERE parent_students.student_id = teacher_students.student_id
      AND parent_students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage teacher-student links"
  ON public.teacher_students FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for attendance
CREATE POLICY "Teachers can manage attendance for their students"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_students
      WHERE teacher_students.student_id = attendance.student_id
      AND teacher_students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's attendance"
  ON public.attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_students
      WHERE parent_students.student_id = attendance.student_id
      AND parent_students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all attendance"
  ON public.attendance FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for grades
CREATE POLICY "Teachers can manage grades for their students"
  ON public.grades FOR ALL
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teacher_students
      WHERE teacher_students.student_id = grades.student_id
      AND teacher_students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's grades"
  ON public.grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_students
      WHERE parent_students.student_id = grades.student_id
      AND parent_students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all grades"
  ON public.grades FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for messages
CREATE POLICY "Users can view their sent messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Users can view their received messages"
  ON public.messages FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE
  USING (recipient_id = auth.uid());

CREATE POLICY "Admins can manage all messages"
  ON public.messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to link parent to student using national school ID
CREATE OR REPLACE FUNCTION public.link_parent_to_student(
  _parent_id UUID,
  _national_school_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student_id UUID;
BEGIN
  -- Find student by national school ID
  SELECT id INTO _student_id
  FROM public.students
  WHERE national_school_id = _national_school_id;
  
  IF _student_id IS NULL THEN
    RAISE EXCEPTION 'Student not found with national school ID: %', _national_school_id;
  END IF;
  
  -- Create parent-student link
  INSERT INTO public.parent_students (parent_id, student_id)
  VALUES (_parent_id, _student_id)
  ON CONFLICT (parent_id, student_id) DO NOTHING;
  
  RETURN _student_id;
END;
$$;
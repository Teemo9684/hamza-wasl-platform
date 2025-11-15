-- Fix infinite recursion by creating security definer functions

-- Function to check if a teacher teaches a student
CREATE OR REPLACE FUNCTION public.is_teacher_of_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_students
    WHERE teacher_id = _teacher_id
      AND student_id = _student_id
  )
$$;

-- Function to check if a parent has a child
CREATE OR REPLACE FUNCTION public.is_parent_of_student(_parent_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_students
    WHERE parent_id = _parent_id
      AND student_id = _student_id
  )
$$;

-- Drop and recreate the problematic policies

-- Fix teacher_students policies
DROP POLICY IF EXISTS "Parents can view their children's teachers" ON public.teacher_students;
CREATE POLICY "Parents can view their children's teachers"
ON public.teacher_students
FOR SELECT
TO authenticated
USING (public.is_parent_of_student(auth.uid(), student_id));

-- Fix parent_students policies
DROP POLICY IF EXISTS "Teachers can view student-parent links for their students" ON public.parent_students;
CREATE POLICY "Teachers can view student-parent links for their students"
ON public.parent_students
FOR SELECT
TO authenticated
USING (public.is_teacher_of_student(auth.uid(), student_id));
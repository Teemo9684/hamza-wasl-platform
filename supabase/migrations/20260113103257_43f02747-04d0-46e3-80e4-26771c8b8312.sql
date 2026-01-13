-- Create a security definer function to check if a student exists by national_school_id
-- This bypasses RLS to allow checking during registration
CREATE OR REPLACE FUNCTION public.check_student_exists(_national_school_id text)
RETURNS TABLE(student_id uuid, student_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT id, full_name
  FROM public.students
  WHERE national_school_id = _national_school_id;
END;
$$;
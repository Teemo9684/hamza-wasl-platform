-- Fix 1: Add RLS policies to message_access_log to block direct writes
-- Block direct inserts (only allow via SECURITY DEFINER triggers)
CREATE POLICY "Block direct log inserts"
ON public.message_access_log FOR INSERT
WITH CHECK (false);

-- Block any modifications to logs
CREATE POLICY "Block log modifications"
ON public.message_access_log FOR UPDATE
USING (false);

-- Block any deletions of logs
CREATE POLICY "Block log deletions"
ON public.message_access_log FOR DELETE
USING (false);

-- Fix 2: Update link_parent_to_student to require parent role
CREATE OR REPLACE FUNCTION public.link_parent_to_student(_parent_id uuid, _national_school_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student_id UUID;
BEGIN
  -- Security check: Only allow parents to link themselves, or admins to link anyone
  IF _parent_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: You can only link your own account to a student';
  END IF;
  
  -- Verify the caller has parent role (or is admin)
  IF NOT has_role(auth.uid(), 'parent') AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only parents or admins can perform this action';
  END IF;

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
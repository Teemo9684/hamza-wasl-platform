-- Update the link_parent_to_student function to allow newly registered users
-- The parent role is assigned via trigger after signup, but linking happens immediately
CREATE OR REPLACE FUNCTION public.link_parent_to_student(_parent_id uuid, _national_school_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student_id UUID;
BEGIN
  -- Security check: Only allow users to link themselves, or admins to link anyone
  IF _parent_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: You can only link your own account to a student';
  END IF;
  
  -- For new registrations, the parent role might not be assigned yet (trigger runs after)
  -- So we allow linking if the user is linking themselves (authenticated user)
  -- The parent role will be assigned by the trigger

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
  
  -- Ensure the user has the parent role (in case trigger didn't run yet)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_parent_id, 'parent')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN _student_id;
END;
$$;
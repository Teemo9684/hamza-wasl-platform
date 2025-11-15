-- Create function to handle teacher registration
CREATE OR REPLACE FUNCTION public.handle_teacher_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user metadata indicates this is a teacher
  IF NEW.raw_user_meta_data->>'subject' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'teacher'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for teacher registration
DROP TRIGGER IF EXISTS on_teacher_user_created ON auth.users;
CREATE TRIGGER on_teacher_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_teacher_registration();

-- Also create function for parent registration
CREATE OR REPLACE FUNCTION public.handle_parent_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user metadata indicates this is a parent
  IF NEW.raw_user_meta_data->>'national_school_id' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for parent registration
DROP TRIGGER IF EXISTS on_parent_user_created ON auth.users;
CREATE TRIGGER on_parent_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_parent_registration();
-- Create trigger function to automatically assign foreign language teachers to grades 3, 4, 5
CREATE OR REPLACE FUNCTION public.assign_foreign_language_grades()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subject_val TEXT;
BEGIN
  -- Get the subject from user metadata
  subject_val := NEW.raw_user_meta_data->>'subject';
  
  -- Check if the teacher is a foreign language teacher (French or English)
  IF subject_val IN ('فرنسية', 'إنجليزية') THEN
    -- Insert grade levels for foreign language teachers (3rd, 4th, 5th year)
    INSERT INTO public.teacher_grade_levels (teacher_id, grade_level, subject)
    VALUES 
      (NEW.id, 'السنة الثالثة', subject_val),
      (NEW.id, 'السنة الرابعة', subject_val),
      (NEW.id, 'السنة الخامسة', subject_val)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after teacher registration
DROP TRIGGER IF EXISTS on_foreign_language_teacher_created ON auth.users;
CREATE TRIGGER on_foreign_language_teacher_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_foreign_language_grades();
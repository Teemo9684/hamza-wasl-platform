-- French is now taught only in grades 4 and 5 (not grade 3)
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

  IF subject_val = 'فرنسية' THEN
    -- French: only grades 4 and 5
    INSERT INTO public.teacher_grade_levels (teacher_id, grade_level, subject)
    VALUES
      (NEW.id, 'السنة الرابعة', subject_val),
      (NEW.id, 'السنة الخامسة', subject_val)
    ON CONFLICT DO NOTHING;
  ELSIF subject_val = 'إنجليزية' THEN
    -- English: grades 3, 4 and 5
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
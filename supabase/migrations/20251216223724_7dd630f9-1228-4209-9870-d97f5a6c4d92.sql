-- Create trigger to automatically assign grade levels for foreign language teachers
DROP TRIGGER IF EXISTS on_teacher_foreign_language_registration ON auth.users;

CREATE TRIGGER on_teacher_foreign_language_registration
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_foreign_language_grades();
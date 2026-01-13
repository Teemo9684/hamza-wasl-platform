-- حذف القيد القديم الذي يمنع نفس الأستاذ من التعيين في نفس المستوى
ALTER TABLE public.teacher_grade_levels 
DROP CONSTRAINT teacher_grade_levels_teacher_id_grade_level_key;
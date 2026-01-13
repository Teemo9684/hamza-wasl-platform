-- إضافة قيد لمنع تكرار المادة في نفس المستوى (أستاذ واحد لكل مادة في كل مستوى)
CREATE UNIQUE INDEX IF NOT EXISTS unique_subject_per_grade 
ON public.teacher_grade_levels (grade_level, subject) 
WHERE subject IS NOT NULL;
-- إضافة قيد unique على teacher_id و student_id لتجنب التكرار
ALTER TABLE public.teacher_students 
ADD CONSTRAINT teacher_students_teacher_student_unique 
UNIQUE (teacher_id, student_id);
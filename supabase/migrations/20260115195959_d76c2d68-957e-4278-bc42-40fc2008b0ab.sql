-- حذف القيد القديم وإضافة قيد جديد يقبل القيم العربية والإنجليزية
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check 
CHECK (status = ANY (ARRAY[
  'present', 'absent', 'late', 'excused',
  'حاضر', 'غائب', 'متأخر', 'غائب بعذر', 'معذور'
]));
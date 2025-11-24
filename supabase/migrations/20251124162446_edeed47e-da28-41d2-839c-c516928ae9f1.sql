-- حذف السياسات القديمة وإعادة إنشائها بشكل صحيح
DROP POLICY IF EXISTS "Admins can upload schedules" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view schedules" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update schedules" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete schedules" ON storage.objects;

-- السماح للمسؤولين برفع جداول الحصص
CREATE POLICY "Admins can upload schedules"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'schedules' 
  AND (
    SELECT has_role(auth.uid(), 'admin'::app_role)
  )
);

-- السماح للجميع بمشاهدة جداول الحصص
CREATE POLICY "Anyone can view schedules"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'schedules');

-- السماح للمسؤولين بتحديث جداول الحصص
CREATE POLICY "Admins can update schedules"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'schedules' 
  AND (
    SELECT has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'schedules' 
  AND (
    SELECT has_role(auth.uid(), 'admin'::app_role)
  )
);

-- السماح للمسؤولين بحذف جداول الحصص
CREATE POLICY "Admins can delete schedules"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'schedules' 
  AND (
    SELECT has_role(auth.uid(), 'admin'::app_role)
  )
);
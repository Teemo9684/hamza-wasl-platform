-- Allow parents and teachers to view homework attachments
CREATE POLICY "Allow authenticated users to view homework files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'homework');

-- Allow teachers to upload homework files
CREATE POLICY "Allow teachers to upload homework files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'::app_role
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);

-- Allow teachers to delete their homework files
CREATE POLICY "Allow teachers to delete homework files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'homework' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'::app_role
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);
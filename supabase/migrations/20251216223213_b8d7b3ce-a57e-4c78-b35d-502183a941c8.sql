-- Drop existing policies on storage.objects if they exist
DROP POLICY IF EXISTS "Admins can delete schedules" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON storage.objects;
DROP POLICY IF EXISTS "Admins and teachers can upload schedules" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view homework" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload homework" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete homework" ON storage.objects;

-- Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('schedules', 'homework');

-- Create RLS policies for storage buckets
-- Policy for schedules bucket - SELECT
CREATE POLICY "Authenticated users can view schedules"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'schedules'
  AND auth.role() = 'authenticated'
);

-- Policy for schedules bucket - INSERT (only admins and teachers)
CREATE POLICY "Admins and teachers can upload schedules"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'schedules'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'teacher')
  )
);

-- Policy for schedules bucket - DELETE (only admins)
CREATE POLICY "Admins can delete schedules"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'schedules'
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy for homework bucket - SELECT
CREATE POLICY "Authenticated users can view homework"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'homework'
  AND auth.role() = 'authenticated'
);

-- Policy for homework bucket - INSERT (teachers)
CREATE POLICY "Teachers can upload homework"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'homework'
  AND public.has_role(auth.uid(), 'teacher')
);

-- Policy for homework bucket - DELETE (teachers for their own files)
CREATE POLICY "Teachers can delete homework"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'homework'
  AND public.has_role(auth.uid(), 'teacher')
);
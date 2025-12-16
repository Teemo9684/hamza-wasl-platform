-- Drop existing overly permissive homework storage policies
DROP POLICY IF EXISTS "Teachers can insert homework files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete homework files" ON storage.objects;

-- Create more restrictive INSERT policy (only teachers and admins can upload)
CREATE POLICY "Teachers and admins can insert homework files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'homework' AND (
    has_role(auth.uid(), 'teacher'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Create DELETE policy with ownership check
CREATE POLICY "Teachers can delete their own homework files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'homework' AND (
    (owner)::uuid = auth.uid() OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);
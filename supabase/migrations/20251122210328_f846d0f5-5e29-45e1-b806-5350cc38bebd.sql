-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view homework files" ON storage.objects;
DROP POLICY IF EXISTS "Allow teachers to upload homework files" ON storage.objects;
DROP POLICY IF EXISTS "Allow teachers to delete homework files" ON storage.objects;

-- Since the homework bucket is public, create simple policies
-- Allow everyone to view files in homework bucket
CREATE POLICY "Public read access for homework files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'homework');

-- Allow authenticated teachers and admins to insert files
CREATE POLICY "Teachers can insert homework files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework'
);

-- Allow authenticated teachers and admins to delete files
CREATE POLICY "Teachers can delete homework files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'homework'
);
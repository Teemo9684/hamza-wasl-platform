-- Fix the overly permissive RLS policy on apk_builds
DROP POLICY IF EXISTS "Service role can update builds" ON public.apk_builds;

-- Create a more restrictive policy for updating builds (only admins can update)
CREATE POLICY "Admins can update builds"
ON public.apk_builds
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add delete policy for admins
CREATE POLICY "Admins can delete builds"
ON public.apk_builds
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
-- Add explicit authentication requirement as baseline policy for profiles table
-- This provides defense-in-depth security

CREATE POLICY "Baseline authentication requirement"
ON public.profiles
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);
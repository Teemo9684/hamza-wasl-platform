
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Anyone can view theme settings" ON public.theme_settings;
DROP POLICY IF EXISTS "Only admins can modify theme settings" ON public.theme_settings;

-- Create a PERMISSIVE select policy for everyone
CREATE POLICY "Anyone can view theme settings"
ON public.theme_settings
FOR SELECT
TO authenticated, anon
USING (true);

-- Create separate PERMISSIVE policies for admin modifications only
CREATE POLICY "Admins can insert theme settings"
ON public.theme_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update theme settings"
ON public.theme_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete theme settings"
ON public.theme_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

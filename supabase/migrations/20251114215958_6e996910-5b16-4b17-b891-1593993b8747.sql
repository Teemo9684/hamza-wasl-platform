-- Fix news_ticker RLS policies - restrict write operations to admins only
DROP POLICY IF EXISTS "Anyone can insert news ticker items" ON news_ticker;
DROP POLICY IF EXISTS "Anyone can update news ticker items" ON news_ticker;
DROP POLICY IF EXISTS "Anyone can delete news ticker items" ON news_ticker;
DROP POLICY IF EXISTS "Authenticated users can manage news ticker" ON news_ticker;

-- Only admins can manage news ticker
CREATE POLICY "Admins can manage news ticker"
ON news_ticker
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add explicit authentication requirements to profiles table
CREATE POLICY "Require authentication for profiles"
ON profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add explicit authentication requirements to students table
CREATE POLICY "Require authentication for students"
ON students
FOR SELECT
USING (auth.uid() IS NOT NULL);
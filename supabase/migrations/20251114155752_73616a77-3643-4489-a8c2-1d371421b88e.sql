-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can manage news ticker" ON public.news_ticker;

-- Create new policy allowing anyone to insert news
CREATE POLICY "Anyone can insert news ticker items"
ON public.news_ticker
FOR INSERT
TO anon
WITH CHECK (true);

-- Create new policy allowing anyone to update news
CREATE POLICY "Anyone can update news ticker items"
ON public.news_ticker
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Create new policy allowing anyone to delete news
CREATE POLICY "Anyone can delete news ticker items"
ON public.news_ticker
FOR DELETE
TO anon
USING (true);

-- Also allow authenticated users to manage everything
CREATE POLICY "Authenticated users can manage news ticker"
ON public.news_ticker
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
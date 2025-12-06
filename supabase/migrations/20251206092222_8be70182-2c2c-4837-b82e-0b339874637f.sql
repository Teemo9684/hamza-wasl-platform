-- Drop the existing public access policy
DROP POLICY IF EXISTS "Anyone can view active news ticker items" ON public.news_ticker;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view active news" 
ON public.news_ticker 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);
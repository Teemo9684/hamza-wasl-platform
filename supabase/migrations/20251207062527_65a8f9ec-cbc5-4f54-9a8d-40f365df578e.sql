-- Drop the authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can view active news" ON public.news_ticker;

-- Create public access policy for active news items
CREATE POLICY "Anyone can view active news ticker items" 
ON public.news_ticker 
FOR SELECT 
USING (is_active = true);
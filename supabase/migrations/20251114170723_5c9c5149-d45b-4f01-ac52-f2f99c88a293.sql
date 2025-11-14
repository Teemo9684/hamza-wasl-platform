-- Fix search_path for update_news_ticker_updated_at function
CREATE OR REPLACE FUNCTION public.update_news_ticker_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
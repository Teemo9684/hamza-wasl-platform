-- Create news ticker table
CREATE TABLE public.news_ticker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon_type TEXT NOT NULL DEFAULT 'جديد',
  badge_color TEXT NOT NULL DEFAULT 'bg-red-500',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_ticker ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can read news)
CREATE POLICY "Anyone can view active news ticker items"
ON public.news_ticker
FOR SELECT
USING (is_active = true);

-- Create policy for authenticated users to manage news (admin only in app logic)
CREATE POLICY "Authenticated users can manage news ticker"
ON public.news_ticker
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_news_ticker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_news_ticker_timestamp
BEFORE UPDATE ON public.news_ticker
FOR EACH ROW
EXECUTE FUNCTION public.update_news_ticker_updated_at();

-- Insert default news items
INSERT INTO public.news_ticker (title, content, icon_type, badge_color, display_order) VALUES
('جديد', 'مرحباً بكم في منصة همزة وصل - جسر التواصل بين المدرسة والبيت', 'جديد', 'bg-red-500', 1),
('إعلان', 'تابعوا التحديثات والإشعارات المهمة من خلال المنصة', 'إعلان', 'bg-blue-500', 2),
('نصيحة', 'سجل الدخول الآن للاستفادة من جميع الخدمات التعليمية', 'نصيحة', 'bg-green-500', 3);
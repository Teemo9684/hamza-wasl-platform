
CREATE TABLE public.results_countdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'نتائج شهادة التعليم الابتدائي',
  subtitle TEXT DEFAULT 'العد التنازلي للإعلان عن النتائج',
  target_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  image_url TEXT,
  result_message TEXT DEFAULT 'مبروك النجاح لتلاميذنا الأعزاء',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.results_countdown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view countdown"
ON public.results_countdown FOR SELECT
USING (true);

CREATE POLICY "Admins can insert countdown"
ON public.results_countdown FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update countdown"
ON public.results_countdown FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete countdown"
ON public.results_countdown FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_results_countdown_updated_at
BEFORE UPDATE ON public.results_countdown
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.results_countdown (title, subtitle, target_date, result_message, is_enabled)
VALUES (
  'نتائج شهادة التعليم الابتدائي',
  'العد التنازلي للإعلان عن النتائج',
  (now() + interval '30 days'),
  'مبروك النجاح لتلاميذنا الأعزاء',
  true
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.results_countdown;

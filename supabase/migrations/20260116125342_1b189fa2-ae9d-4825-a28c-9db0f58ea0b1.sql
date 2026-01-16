-- إضافة جدول homework للـ Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.homework;

-- تعيين REPLICA IDENTITY FULL للجداول المطلوبة
ALTER TABLE public.homework REPLICA IDENTITY FULL;
ALTER TABLE public.notification_queue REPLICA IDENTITY FULL;
ALTER TABLE public.document_requests REPLICA IDENTITY FULL;
ALTER TABLE public.news_ticker REPLICA IDENTITY FULL;
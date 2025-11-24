-- زيادة حجم الملفات المسموح رفعها لجدول الحصص إلى 50MB
UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50MB بالبايت
WHERE id = 'schedules';
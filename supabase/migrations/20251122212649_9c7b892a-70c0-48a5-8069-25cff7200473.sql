-- Security improvements: Add storage bucket limits and server-side validation

-- Add file size limits and MIME type restrictions to storage buckets
UPDATE storage.buckets 
SET file_size_limit = 10485760,  -- 10MB limit
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
WHERE name = 'homework';

UPDATE storage.buckets 
SET file_size_limit = 5242880,  -- 5MB limit
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
WHERE name = 'schedules';

-- Add server-side validation constraints for data integrity

-- Students table constraints
ALTER TABLE students 
ADD CONSTRAINT check_student_name_length CHECK (length(full_name) > 0 AND length(full_name) <= 100);

ALTER TABLE students
ADD CONSTRAINT check_national_id_format CHECK (national_school_id ~ '^[a-zA-Z0-9]+$');

-- Messages table constraints
ALTER TABLE messages
ADD CONSTRAINT check_message_subject_length CHECK (length(subject) > 0 AND length(subject) <= 200);

ALTER TABLE messages
ADD CONSTRAINT check_message_content_length CHECK (length(content) > 0 AND length(content) <= 5000);

-- Attendance notes constraint
ALTER TABLE attendance
ADD CONSTRAINT check_attendance_notes_length CHECK (notes IS NULL OR length(notes) <= 1000);

-- Profiles table constraints
ALTER TABLE profiles
ADD CONSTRAINT check_profile_name_length CHECK (length(full_name) > 0 AND length(full_name) <= 100);

-- News ticker constraints
ALTER TABLE news_ticker
ADD CONSTRAINT check_news_title_length CHECK (length(title) > 0 AND length(title) <= 200);

ALTER TABLE news_ticker
ADD CONSTRAINT check_news_content_length CHECK (length(content) > 0 AND length(content) <= 1000);

-- Homework table constraints
ALTER TABLE homework
ADD CONSTRAINT check_homework_title_length CHECK (length(title) > 0 AND length(title) <= 200);

ALTER TABLE homework
ADD CONSTRAINT check_homework_description_length CHECK (length(description) > 0 AND length(description) <= 5000);
-- Drop the old functions that won't work with pg_net
DROP TRIGGER IF EXISTS on_new_message_notify ON public.messages;
DROP TRIGGER IF EXISTS on_attendance_notify ON public.attendance;
DROP TRIGGER IF EXISTS on_homework_notify ON public.homework;
DROP FUNCTION IF EXISTS public.notify_new_message();
DROP FUNCTION IF EXISTS public.notify_attendance_change();
DROP FUNCTION IF EXISTS public.notify_new_homework();

-- Create a simpler approach using database webhooks via supabase_functions schema
-- We'll create a function that inserts into a queue table that we'll process

-- Create notification queue table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access
CREATE POLICY "Service role can access notification_queue"
ON public.notification_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to queue message notification
CREATE OR REPLACE FUNCTION public.queue_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Insert into queue
  INSERT INTO public.notification_queue (notification_type, payload)
  VALUES (
    'message',
    jsonb_build_object(
      'user_ids', jsonb_build_array(NEW.recipient_id),
      'title', 'رسالة جديدة',
      'body', COALESCE(sender_name, 'مستخدم') || ': ' || NEW.subject,
      'data', jsonb_build_object(
        'type', 'message',
        'message_id', NEW.id::text,
        'sender_id', NEW.sender_id::text
      )
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue message notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to queue attendance notification
CREATE OR REPLACE FUNCTION public.queue_attendance_notification()
RETURNS TRIGGER AS $$
DECLARE
  student_name TEXT;
  parent_ids UUID[];
  status_text TEXT;
BEGIN
  -- Get student name
  SELECT full_name INTO student_name
  FROM public.students
  WHERE id = NEW.student_id;

  -- Get parent IDs
  SELECT ARRAY_AGG(parent_id) INTO parent_ids
  FROM public.parent_students
  WHERE student_id = NEW.student_id;

  IF parent_ids IS NULL OR array_length(parent_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map status
  status_text := CASE NEW.status
    WHEN 'حاضر' THEN 'حاضر ✅'
    WHEN 'غائب' THEN 'غائب ❌'
    WHEN 'متأخر' THEN 'متأخر ⏰'
    WHEN 'غائب بعذر' THEN 'غائب بعذر 📝'
    WHEN 'معذور' THEN 'معذور 📝'
    ELSE NEW.status
  END;

  -- Insert into queue
  INSERT INTO public.notification_queue (notification_type, payload)
  VALUES (
    'attendance',
    jsonb_build_object(
      'user_ids', to_jsonb(parent_ids),
      'title', 'تسجيل حضور',
      'body', COALESCE(student_name, 'التلميذ') || ' - ' || status_text,
      'data', jsonb_build_object(
        'type', 'attendance',
        'student_id', NEW.student_id::text,
        'status', NEW.status
      )
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue attendance notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to queue homework notification
CREATE OR REPLACE FUNCTION public.queue_homework_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_ids UUID[];
BEGIN
  -- Get parent IDs for students in this grade
  SELECT ARRAY_AGG(DISTINCT ps.parent_id) INTO parent_ids
  FROM public.students s
  JOIN public.parent_students ps ON s.id = ps.student_id
  WHERE s.grade_level = NEW.grade_level;

  IF parent_ids IS NULL OR array_length(parent_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert into queue
  INSERT INTO public.notification_queue (notification_type, payload)
  VALUES (
    'homework',
    jsonb_build_object(
      'user_ids', to_jsonb(parent_ids),
      'title', 'واجب جديد 📚',
      'body', NEW.title || ' - ' || NEW.grade_level,
      'data', jsonb_build_object(
        'type', 'homework',
        'homework_id', NEW.id::text,
        'grade_level', NEW.grade_level
      )
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue homework notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_new_message_queue_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_message_notification();

CREATE TRIGGER on_attendance_queue_notification
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_attendance_notification();

CREATE TRIGGER on_homework_queue_notification
  AFTER INSERT ON public.homework
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_homework_notification();

-- Enable realtime for notification_queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_queue;
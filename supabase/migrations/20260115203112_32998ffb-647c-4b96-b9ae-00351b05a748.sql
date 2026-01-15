-- Create a database function to handle new message notifications
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Build the payload
  payload := jsonb_build_object(
    'user_ids', jsonb_build_array(NEW.recipient_id),
    'title', 'رسالة جديدة',
    'body', COALESCE(sender_name, 'مستخدم') || ': ' || NEW.subject,
    'data', jsonb_build_object(
      'type', 'message',
      'message_id', NEW.id,
      'sender_id', NEW.sender_id
    )
  );

  -- Call the edge function via pg_net
  PERFORM net.http_post(
    url := (SELECT current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true))
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the insert
    RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_new_message_notify ON public.messages;
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

-- Create function to notify on attendance changes
CREATE OR REPLACE FUNCTION public.notify_attendance_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  student_name TEXT;
  parent_ids UUID[];
  status_text TEXT;
BEGIN
  -- Get student name
  SELECT full_name INTO student_name
  FROM public.students
  WHERE id = NEW.student_id;

  -- Get parent IDs for this student
  SELECT ARRAY_AGG(parent_id) INTO parent_ids
  FROM public.parent_students
  WHERE student_id = NEW.student_id;

  -- If no parents, skip
  IF parent_ids IS NULL OR array_length(parent_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map status to readable text
  status_text := CASE NEW.status
    WHEN 'حاضر' THEN 'حاضر ✅'
    WHEN 'غائب' THEN 'غائب ❌'
    WHEN 'متأخر' THEN 'متأخر ⏰'
    WHEN 'غائب بعذر' THEN 'غائب بعذر 📝'
    WHEN 'معذور' THEN 'معذور 📝'
    ELSE NEW.status
  END;

  -- Build the payload
  payload := jsonb_build_object(
    'user_ids', to_jsonb(parent_ids),
    'title', 'تسجيل حضور',
    'body', COALESCE(student_name, 'التلميذ') || ' - ' || status_text,
    'data', jsonb_build_object(
      'type', 'attendance',
      'student_id', NEW.student_id,
      'attendance_id', NEW.id,
      'status', NEW.status
    )
  );

  -- Call the edge function via pg_net
  PERFORM net.http_post(
    url := (SELECT current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true))
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send attendance push notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for attendance
DROP TRIGGER IF EXISTS on_attendance_notify ON public.attendance;
CREATE TRIGGER on_attendance_notify
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_attendance_change();

-- Create function to notify on new homework
CREATE OR REPLACE FUNCTION public.notify_new_homework()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  parent_ids UUID[];
BEGIN
  -- Get parent IDs for students in this grade level
  SELECT ARRAY_AGG(DISTINCT ps.parent_id) INTO parent_ids
  FROM public.students s
  JOIN public.parent_students ps ON s.id = ps.student_id
  WHERE s.grade_level = NEW.grade_level;

  -- If no parents, skip
  IF parent_ids IS NULL OR array_length(parent_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build the payload
  payload := jsonb_build_object(
    'user_ids', to_jsonb(parent_ids),
    'title', 'واجب جديد 📚',
    'body', NEW.title || ' - ' || NEW.grade_level,
    'data', jsonb_build_object(
      'type', 'homework',
      'homework_id', NEW.id,
      'grade_level', NEW.grade_level
    )
  );

  -- Call the edge function via pg_net
  PERFORM net.http_post(
    url := (SELECT current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true))
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send homework push notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for homework
DROP TRIGGER IF EXISTS on_homework_notify ON public.homework;
CREATE TRIGGER on_homework_notify
  AFTER INSERT ON public.homework
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_homework();
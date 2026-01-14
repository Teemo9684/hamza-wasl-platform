-- Enable REPLICA IDENTITY FULL for messages table to support realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for attendance table too
ALTER TABLE public.attendance REPLICA IDENTITY FULL;

-- Ensure attendance is in the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'attendance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  END IF;
END $$;
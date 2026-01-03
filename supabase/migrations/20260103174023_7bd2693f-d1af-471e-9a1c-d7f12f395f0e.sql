-- Enable REPLICA IDENTITY FULL for real-time updates
ALTER TABLE public.school_posters REPLICA IDENTITY FULL;

-- Ensure the table is added to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'school_posters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.school_posters;
  END IF;
END $$;
-- Create table to persist notification read states
CREATE TABLE public.notification_read_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN ('attendance', 'homework', 'documents')),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_type)
);

-- Enable RLS
ALTER TABLE public.notification_read_states ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notification states
CREATE POLICY "Users can view their own notification states"
ON public.notification_read_states
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own notification states
CREATE POLICY "Users can insert their own notification states"
ON public.notification_read_states
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification states
CREATE POLICY "Users can update their own notification states"
ON public.notification_read_states
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_notification_read_states_user_id ON public.notification_read_states(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_read_states_updated_at
BEFORE UPDATE ON public.notification_read_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
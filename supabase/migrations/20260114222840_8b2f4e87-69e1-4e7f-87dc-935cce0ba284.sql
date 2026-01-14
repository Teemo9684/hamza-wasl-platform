-- Add unique constraint on token column for upsert to work correctly
ALTER TABLE public.push_tokens ADD CONSTRAINT push_tokens_token_unique UNIQUE (token);

-- Also add composite unique on user_id + token for better conflict handling
CREATE UNIQUE INDEX IF NOT EXISTS push_tokens_user_token_idx ON public.push_tokens (user_id, token);

-- Enable realtime for push_tokens table
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_tokens;
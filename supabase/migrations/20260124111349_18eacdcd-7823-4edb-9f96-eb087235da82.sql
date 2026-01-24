-- Remove the old redundant policy that allows sending without proper checks
DROP POLICY IF EXISTS "Approved users can send messages" ON public.messages;
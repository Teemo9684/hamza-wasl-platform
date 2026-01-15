-- Fix the RLS policy for notification_queue - only service role should access
DROP POLICY IF EXISTS "Service role can access notification_queue" ON public.notification_queue;

-- Create more restrictive policy - no user access, only via triggers (SECURITY DEFINER)
-- The table is populated by triggers and processed by edge functions using service role
CREATE POLICY "No direct user access to notification_queue"
ON public.notification_queue
FOR SELECT
USING (false);

CREATE POLICY "No direct user insert to notification_queue"
ON public.notification_queue
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct user update to notification_queue"
ON public.notification_queue
FOR UPDATE
USING (false);

CREATE POLICY "No direct user delete to notification_queue"
ON public.notification_queue
FOR DELETE
USING (false);
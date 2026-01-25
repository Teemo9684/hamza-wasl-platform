-- Fix RLS policy for message replies
-- The current policy has a bug in the reply check condition

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Users can send messages to approved users only" ON public.messages;

-- Recreate with fixed reply logic
CREATE POLICY "Users can send messages to approved users only"
ON public.messages
FOR INSERT
WITH CHECK (
  (sender_id = auth.uid()) 
  AND is_user_approved(auth.uid()) 
  AND (
    -- Check recipient is approved
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = messages.recipient_id 
      AND profiles.is_approved = true
    )
  ) 
  AND (
    -- Admin can message anyone
    has_role(auth.uid(), 'admin'::app_role)
    
    -- Teacher can message parents of their students
    OR (
      has_role(auth.uid(), 'teacher'::app_role) 
      AND EXISTS (
        SELECT 1 FROM parent_students ps
        JOIN teacher_students ts ON ps.student_id = ts.student_id
        WHERE ts.teacher_id = auth.uid() 
        AND ps.parent_id = messages.recipient_id
      )
    )
    
    -- Parent can message teachers of their children
    OR (
      has_role(auth.uid(), 'parent'::app_role) 
      AND EXISTS (
        SELECT 1 FROM teacher_students ts
        JOIN parent_students ps ON ts.student_id = ps.student_id
        WHERE ps.parent_id = auth.uid() 
        AND ts.teacher_id = messages.recipient_id
      )
    )
    
    -- FIXED: Anyone can reply to someone who has messaged them before
    -- Check if the recipient has previously sent a message to the current user
    OR EXISTS (
      SELECT 1 FROM messages m
      WHERE m.sender_id = messages.recipient_id 
      AND m.recipient_id = auth.uid()
    )
    
    -- Parent/Teacher can message admin if admin messaged them first
    OR (
      has_role(messages.recipient_id, 'admin'::app_role) 
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.sender_id = messages.recipient_id 
        AND m.recipient_id = auth.uid()
      )
    )
  )
);
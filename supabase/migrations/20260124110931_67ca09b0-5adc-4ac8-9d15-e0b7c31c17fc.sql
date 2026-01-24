-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can send messages to approved users only" ON public.messages;

-- Create a more flexible policy that allows:
-- 1. Admins to send to anyone
-- 2. Teachers to send to parents of their students
-- 3. Parents to send to teachers of their children
-- 4. Anyone to reply to messages they received (by checking if they received a message from that user)
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
    -- Admin can send to anyone
    has_role(auth.uid(), 'admin'::app_role)
    OR
    -- Teacher sending to parent of their student
    (
      has_role(auth.uid(), 'teacher'::app_role) 
      AND EXISTS (
        SELECT 1 FROM parent_students ps
        JOIN teacher_students ts ON ps.student_id = ts.student_id
        WHERE ts.teacher_id = auth.uid() 
        AND ps.parent_id = messages.recipient_id
      )
    )
    OR
    -- Parent sending to teacher of their child
    (
      has_role(auth.uid(), 'parent'::app_role) 
      AND EXISTS (
        SELECT 1 FROM teacher_students ts
        JOIN parent_students ps ON ts.student_id = ps.student_id
        WHERE ps.parent_id = auth.uid() 
        AND ts.teacher_id = messages.recipient_id
      )
    )
    OR
    -- Allow replying to anyone who has sent you a message before
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.sender_id = messages.recipient_id 
      AND m.recipient_id = auth.uid()
    )
  )
);
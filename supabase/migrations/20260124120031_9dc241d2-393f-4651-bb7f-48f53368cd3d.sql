-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can send messages to approved users only" ON public.messages;

-- Create improved INSERT policy that allows:
-- 1. Admins can send to anyone
-- 2. Teachers can send to parents of their students
-- 3. Parents can send to teachers of their children
-- 4. ANYONE can reply to someone who sent them a message (bidirectional replies)
CREATE POLICY "Users can send messages to approved users only"
ON public.messages
FOR INSERT
WITH CHECK (
  -- Sender must be the authenticated user and approved
  sender_id = auth.uid()
  AND is_user_approved(auth.uid())
  AND EXISTS (
    SELECT 1 FROM profiles WHERE id = recipient_id AND is_approved = true
  )
  AND (
    -- Admins can send to anyone
    has_role(auth.uid(), 'admin')
    OR
    -- Teachers can send to parents of their students
    (
      has_role(auth.uid(), 'teacher')
      AND EXISTS (
        SELECT 1 FROM parent_students ps
        JOIN teacher_students ts ON ps.student_id = ts.student_id
        WHERE ts.teacher_id = auth.uid() AND ps.parent_id = recipient_id
      )
    )
    OR
    -- Parents can send to teachers of their children
    (
      has_role(auth.uid(), 'parent')
      AND EXISTS (
        SELECT 1 FROM teacher_students ts
        JOIN parent_students ps ON ts.student_id = ps.student_id
        WHERE ps.parent_id = auth.uid() AND ts.teacher_id = recipient_id
      )
    )
    OR
    -- ANYONE can reply to someone who has sent them a message before (bidirectional)
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.sender_id = recipient_id AND m.recipient_id = auth.uid()
    )
    OR
    -- Also allow replying to admins if they have a message from an admin
    (
      has_role(recipient_id, 'admin')
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.sender_id = recipient_id AND m.recipient_id = auth.uid()
      )
    )
  )
);
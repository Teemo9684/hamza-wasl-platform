-- Allow parents to delete their received messages
CREATE POLICY "Users can delete their received messages" 
ON public.messages 
FOR DELETE 
USING (recipient_id = auth.uid());

-- Allow parents to delete their document requests
CREATE POLICY "Parents can delete their document requests" 
ON public.document_requests 
FOR DELETE 
USING (parent_id = auth.uid());
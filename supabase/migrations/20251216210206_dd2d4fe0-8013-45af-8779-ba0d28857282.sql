-- Create document_requests table
CREATE TABLE public.document_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

-- Parents can create requests for their children
CREATE POLICY "Parents can create document requests"
ON public.document_requests
FOR INSERT
WITH CHECK (
  parent_id = auth.uid() 
  AND is_parent_of_student(auth.uid(), student_id)
);

-- Parents can view their own requests
CREATE POLICY "Parents can view their document requests"
ON public.document_requests
FOR SELECT
USING (parent_id = auth.uid());

-- Admins can manage all requests
CREATE POLICY "Admins can manage all document requests"
ON public.document_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_requests;

-- Trigger for updated_at
CREATE TRIGGER update_document_requests_updated_at
BEFORE UPDATE ON public.document_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
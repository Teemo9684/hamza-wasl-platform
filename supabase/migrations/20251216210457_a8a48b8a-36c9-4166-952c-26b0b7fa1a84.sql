-- Add foreign key constraints for document_requests table
ALTER TABLE public.document_requests
ADD CONSTRAINT document_requests_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.document_requests
ADD CONSTRAINT document_requests_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
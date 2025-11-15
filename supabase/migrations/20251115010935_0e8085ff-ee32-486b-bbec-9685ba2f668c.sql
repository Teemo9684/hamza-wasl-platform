-- Add missing foreign key relationships to profiles table

-- First, drop existing constraints if they exist
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

ALTER TABLE public.teacher_students
DROP CONSTRAINT IF EXISTS teacher_students_teacher_id_fkey;

ALTER TABLE public.parent_students
DROP CONSTRAINT IF EXISTS parent_students_parent_id_fkey;

-- Now add the correct foreign keys to profiles
ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages
ADD CONSTRAINT messages_recipient_id_fkey
FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_students
ADD CONSTRAINT teacher_students_teacher_id_fkey
FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.parent_students
ADD CONSTRAINT parent_students_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
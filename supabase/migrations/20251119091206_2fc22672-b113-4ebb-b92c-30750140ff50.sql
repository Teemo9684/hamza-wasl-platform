-- Add is_approved column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;

-- Update existing profiles to be approved (for backwards compatibility)
UPDATE public.profiles 
SET is_approved = true 
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT is_approved FROM public.profiles WHERE id = _user_id
$$;

-- Update RLS policies to require approval
-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Baseline authentication requirement" ON public.profiles;

-- Recreate policies with approval check
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id AND is_approved = true);

CREATE POLICY "Approved users can access data"
ON public.profiles
FOR ALL
TO authenticated
USING (is_approved = true);

-- Update students RLS to require approval
CREATE POLICY "Approved users can view students"
ON public.students
FOR SELECT
TO authenticated
USING (is_user_approved(auth.uid()));

-- Update messages RLS to require approval
CREATE POLICY "Approved users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (is_user_approved(auth.uid()) AND sender_id = auth.uid());

-- Update attendance RLS to require approval
CREATE POLICY "Approved users can manage attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (is_user_approved(auth.uid()));

-- Update grades RLS to require approval
CREATE POLICY "Approved users can manage grades"
ON public.grades
FOR ALL
TO authenticated
USING (is_user_approved(auth.uid()));

-- Admins can always manage profiles regardless of approval status
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create view for pending approvals (admins only)
CREATE OR REPLACE VIEW public.pending_approvals AS
SELECT 
  p.id,
  p.full_name,
  p.phone,
  p.created_at,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.is_approved = false
ORDER BY p.created_at DESC;
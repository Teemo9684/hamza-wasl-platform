-- Drop the insecure view
DROP VIEW IF EXISTS public.pending_approvals;

-- Create a secure function instead that checks admin role
CREATE OR REPLACE FUNCTION public.get_pending_approvals()
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  created_at timestamp with time zone,
  role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.created_at,
    ur.role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.is_approved = false
    AND has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC;
$$;
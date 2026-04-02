DROP FUNCTION IF EXISTS public.get_pending_approvals();

CREATE OR REPLACE FUNCTION public.get_pending_approvals()
 RETURNS TABLE(id uuid, full_name text, phone text, created_at timestamp with time zone, role app_role, student_name text, student_grade text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.created_at,
    ur.role,
    s.full_name as student_name,
    s.grade_level as student_grade
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN public.parent_students ps ON p.id = ps.parent_id
  LEFT JOIN public.students s ON ps.student_id = s.id
  WHERE p.is_approved = false
    AND has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC;
$$;
-- Security hardening: only authenticated administrators may change the news ticker.
-- The existing public SELECT policy for active news remains in place.
-- Replaces broad legacy INSERT/UPDATE/DELETE/ALL policies.
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'news_ticker'
      AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.news_ticker', policy_row.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins can insert news ticker items"
ON public.news_ticker FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update news ticker items"
ON public.news_ticker FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete news ticker items"
ON public.news_ticker FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Prevent anonymous and general authenticated clients from using table-level
-- write privileges if future permissive RLS policies are accidentally added.
REVOKE INSERT, UPDATE, DELETE ON public.news_ticker FROM anon;
GRANT INSERT, UPDATE, DELETE ON public.news_ticker TO authenticated;

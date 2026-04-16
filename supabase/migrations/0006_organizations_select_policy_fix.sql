-- Hotfix: fix organizations SELECT policy for membership-based visibility
-- Keep multi-tenant isolation while allowing members to read their own orgs.

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND cmd IN ('SELECT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', p.policyname);
  END LOOP;
END;
$$;

CREATE POLICY "Users can view their organizations" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members om
      WHERE om.org_id = id
        AND om.user_id = auth.uid()
    )
  );
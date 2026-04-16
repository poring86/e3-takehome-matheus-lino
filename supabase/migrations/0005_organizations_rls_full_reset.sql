-- Hotfix: full reset for organizations/org_members RLS and grants
-- Use when organization creation still returns 403 (42501).

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.org_members TO authenticated;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
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
      FROM public.org_members
      WHERE public.org_members.org_id = public.organizations.id
        AND public.org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Org owners can update their organizations" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members
      WHERE public.org_members.org_id = public.organizations.id
        AND public.org_members.user_id = auth.uid()
        AND public.org_members.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Users can create own owner membership" ON public.org_members;

CREATE POLICY "Users can create own owner membership" ON public.org_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
  );
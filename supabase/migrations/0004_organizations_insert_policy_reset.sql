-- Hotfix: force-reset INSERT policies for organizations
-- Why: Cloud state may contain conflicting/restrictive INSERT/ALL policies.

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND cmd IN ('INSERT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', p.policyname);
  END LOOP;
END;
$$;

CREATE POLICY "Users can create organizations" ON public.organizations
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
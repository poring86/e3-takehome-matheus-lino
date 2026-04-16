-- Hotfix: unblock onboarding organization creation flow
-- Purpose:
-- 1) Ensure authenticated users can insert rows into organizations
-- 2) Allow onboarding to add the creator as owner in org_members

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create own owner membership" ON org_members;

CREATE POLICY "Users can create own owner membership" ON org_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
  );
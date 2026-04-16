-- Hotfix: prevent recursive RLS evaluation on org_members
-- Safe to run after 0001_rls_policies.sql in cloud environments

DROP POLICY IF EXISTS "Org admins can manage memberships" ON org_members;
DROP POLICY IF EXISTS "Org owners can manage memberships" ON org_members;
DROP POLICY IF EXISTS "Users can view org memberships they belong to" ON org_members;

CREATE POLICY "Users can view org memberships they belong to" ON org_members
  FOR SELECT USING (
    user_id = auth.uid()
  );

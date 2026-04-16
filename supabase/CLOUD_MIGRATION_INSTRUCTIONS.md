# Supabase Cloud Migration Instructions

To fully meet all requirements, you must apply the following migrations in your Supabase Cloud project:

## 1. Apply Base Schema Migration

- Open the Supabase web console for your project.
- Go to the SQL Editor.
- Copy and paste the entire contents of:
  - `supabase/migrations/0000_schema.sql`
- Run the SQL.

## 2. Apply RLS Policies Migration

- In the same SQL Editor, after the schema migration completes successfully:
- Copy and paste the entire contents of:
  - `supabase/migrations/0001_rls_policies.sql`
- Run the SQL.

## 3. Apply org_members RLS Hotfix (recommended)

- In the same SQL Editor, after the policy migration completes:
- Copy and paste the entire contents of:
  - `supabase/migrations/0002_org_members_rls_hotfix.sql`
- Run the SQL.
- This prevents recursive policy reintroduction on `org_members`.

## 4. Apply Onboarding Organization Creation Hotfix (recommended)

- In the same SQL Editor, after the previous migrations complete:
- Copy and paste the entire contents of:
  - `supabase/migrations/0003_onboarding_org_creation_hotfix.sql`
- Run the SQL.
- This ensures organization creation and first owner membership creation work during onboarding.

## 5. Apply Organizations INSERT Policy Reset Hotfix (if 403 persists)

- If onboarding organization creation still returns 403 (`42501`) after step 4:
- Copy and paste the entire contents of:
  - `supabase/migrations/0004_organizations_insert_policy_reset.sql`
- Run the SQL.
- This removes any conflicting INSERT/ALL policies on `organizations` and recreates a single permissive policy for authenticated users.

## 6. Validate

- Use the REST Explorer or your app to query:
  - `/rest/v1/org_members?select=id&limit=1`
  - `/rest/v1/organizations?select=id&limit=1`
- Both should return HTTP 200 and a JSON array (even if empty), not 404/PGRST205/42P17.

## 7. Apply Organizations SELECT Policy Fix (if org list remains empty)

- If organization creation works but organization listing remains empty for members:
- Copy and paste the entire contents of:
  - `supabase/migrations/0006_organizations_select_policy_fix.sql`
- Run the SQL.

## 8. Mark as Complete

- Once validated, update `BUGS.md` (close B-022) and `NOTES.md` (mark RLS policy coverage as **Done**).

---

**Note:** This step is required for full compliance with the requirements and to unblock all organization-related features in production.

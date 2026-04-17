# BUGS.md

## Format

Each bug entry follows this structure:

- Date
- Status
- Location
- Symptom
- Cause
- Fix
- Commit

## Open Bugs

### B-001 Agent orchestration deadlock and rate limit failure

- Date: 2026-04-16
- Status: Open
- Location: Initial AI agent setup and build orchestration.
- Symptom: The first AI workflow deadlocked waiting on subscription-sync events and hit rate limits during schema generation.
- Cause: Over-reliance on early automated orchestration during initial setup.
- Fix: Switched to manual schema definition and changed model strategy to recover delivery speed.
- Commit: a3922c8

## Resolved Bugs

### B-030 New note UI failed with generic error on save

- Date: 2026-04-17
- Status: Resolved
- Location: `src/app/dashboard/notes/new/page.tsx`
- Symptom:
	- Creating a note from the UI failed and only logged generic message `Failed to create note`.
- Cause:
	- Client save flow depended on implicit cookie auth and did not send bearer token explicitly.
	- Error handling did not expose backend error payload/status to the user.
- Fix:
	- Added bearer token retrieval via Supabase session and sent `Authorization: Bearer <token>` on note creation request.
	- Added UI error banner and detailed response parsing for failed saves.
	- Added client-side request timeout/abort to prevent indefinite `Saving...` state when backend request hangs.
	- Added explicit timeout around `supabase.auth.getSession()` to prevent pre-request hangs from locking the save state.
- Validation:
	- `npm run build` passed after frontend changes.
	- API integration and smoke tests remained green in previous validation cycle.
- Commit: 1a9eebb

### B-029 Notes [id] endpoints returned 401 with bearer auth and 500 on delete

- Date: 2026-04-17
- Status: Resolved
- Location: `src/app/api/notes/[id]/route.ts`, `tests/api/notes.integration.test.ts`
- Symptom:
	- Integration CRUD suite authenticated by bearer token passed create, but read/update/delete returned 401.
	- Delete path later returned 500 in integration test.
- Cause:
	- `/api/notes/[id]` handlers were relying on cookie auth only and did not use bearer-token fallback.
	- Delete handler assumed FK cascade for children, but runtime DB constraints did not guarantee cascade behavior for all related tables.
- Fix:
	- Added `getAuthenticatedUser` helper with bearer-token-first auth fallback in `/api/notes/[id]` handlers.
	- Typed route context safely for Next.js params resolution.
	- Deleted child records (`note_versions`, `note_tags`, `note_shares`) before deleting note.
	- Aligned integration test update assertion to API response shape.
- Validation:
	- `npx vitest run tests/api/notes.integration.test.ts` => 4/4 passed.
	- `sh scripts/smoke-notes.sh` => passed with HTTP 201.
	- `npm run build` => passed.
- Commit: 0f6d085, 2d0ba17

### B-028 Notes create 500 due to Supabase pooler password mismatch

- Date: 2026-04-17
- Status: Resolved
- Location: `.env`, runtime container environment, `src/app/api/notes/route.ts`
- Symptom: `POST /api/notes` returned HTTP 500 after migration to Supabase-only compose.
- Cause:
	- `DATABASE_URL` password in runtime was incorrect (missing trailing `.`), resulting in Postgres auth failure (`28P01`).
	- Intermittent env drift happened when shell-exported vars overrode `.env` during container recreation.
- Fix:
	- Updated `DATABASE_URL` in `.env` with the correct pooler password.
	- Recreated app container after clearing shell overrides to ensure `.env` values were applied.
- Validation:
	- Connection probe from app container succeeded.
	- `POST /api/notes` returned HTTP 201 with created note payload.
- Commit: pending

### B-027 Local Postgres vs Supabase Postgres environment drift

- Date: 2026-04-16
- Status: Resolved
- Location: `docker-compose.yml`, `.env`, runtime container environment
- Symptom: Endpoints backed by Drizzle (`/api/notes`) intermittently failed with database auth errors (`28P01`) due to mismatched runtime `DATABASE_URL` and duplicated database topology.
- Cause: Hybrid setup kept both local Postgres container and Supabase Postgres in circulation, allowing accidental connection to stale/incorrect DB host and credentials.
- Fix:
	- Removed local `db` service from `docker-compose.yml`.
	- Standardized dev architecture to Supabase-only Postgres.
	- Updated docs/environment template to require Supabase `DATABASE_URL`.
- Validation: Compose now runs only `app`; no local Postgres dependency remains in orchestration.
- Commit: e70ed9d

### B-026 Dashboard empty state after successful login/onboarding

- Date: 2026-04-16
- Status: Resolved
- Location: `src/lib/auth-context.tsx`, `src/lib/load-user-organizations.ts`, `src/app/api/organizations/route.ts`, `src/app/onboarding/page.tsx`, `src/app/dashboard/page.tsx`
- Symptom: User could authenticate and create organizations, but dashboard still displayed the empty "create/join organization" state.
- Cause: Combined issue from policy drift and client boot timing:
	- `org_members` had rows, but `organizations` visibility was inconsistent in direct user-scoped reads.
	- First-load auth/session propagation could briefly return unauthorized from org bootstrap calls.
	- Dashboard relied strictly on `currentOrg` before fallback state was available.
- Fix:
	- Added resilient org loading path with bearer/cookie fallbacks.
	- Added server endpoint `GET /api/organizations` to normalize membership + organization payload.
	- Added context-level `refreshOrganizations` and used it after onboarding inserts before redirect.
	- Added dashboard fallback active organization from `userOrgs[0]` when `currentOrg` is temporarily null.
	- Added fail-soft behavior for transient bootstrap failures.
- Validation: Local API `/api/organizations` returned memberships with organization payload (`200`), production build passed, and user confirmed organizations display.
- Commit: a3922c8

### B-025 Organization creation forbidden by RLS policy mismatch

- Date: 2026-04-16
- Status: Resolved
- Location: Supabase Cloud policies on `organizations` and `org_members`
- Symptom: `POST /rest/v1/organizations?select=*` returned HTTP 403 with `new row violates row-level security policy` during onboarding.
- Cause: Effective cloud policy state did not allow onboarding insert path for organization creation and owner membership insertion.
- Fix: Applied onboarding/policy hotfix sequence and aligned app loading behavior for policy-drift tolerance:
	- `supabase/migrations/0003_onboarding_org_creation_hotfix.sql`
	- `supabase/migrations/0004_organizations_insert_policy_reset.sql`
	- `supabase/migrations/0005_organizations_rls_full_reset.sql`
	- `supabase/migrations/0006_organizations_select_policy_fix.sql`
- Validation: Organization creation and membership insert flow recovered; dashboard organization visibility stabilized with follow-up app fixes (see B-026).
- Commit: pending

### B-024 Password reset flow failed with Supabase lock contention / expired link handling

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/auth/reset-password/page.tsx
- Symptom: Password reset page could fail with messages like lock contention (`lock:sb-...-auth-token`) or raw `otp_expired` errors, blocking reset completion.
- Cause: Recovery session initialization treated transient session lock contention as hard failure and did not normalize expired-link errors for users.
- Fix: Added tolerant recovery-session handling, fallback session check, URL hash cleanup after successful session setup, and explicit user-friendly message for expired recovery links.
- Validation: Local production build passes and reset flow now allows retry path via `/auth/forgot-password`.
- Commit: pending

### B-023 Infinite recursion in org_members RLS policy (Supabase)

- Date: 2026-04-16
- Status: Resolved
- Location: supabase/migrations/0001_rls_policies.sql (Supabase Cloud)
- Symptom: REST queries to org_members and organizations returned 500 with `infinite recursion detected in policy for relation "org_members"` (42P17).
- Cause: The SELECT policy on org_members referenced org_members itself via EXISTS, triggering recursive RLS evaluation.
- Fix: Dropped the recursive admin management policy in Supabase Cloud and kept a non-recursive read policy (`user_id = auth.uid()`).
- Validation: Endpoints `/rest/v1/org_members` and `/rest/v1/organizations` returned HTTP 200 after the policy cleanup.
- Lessons learned: Do not reference the same table inside its own RLS predicate unless the pattern is proven non-recursive.
- Lessons learned: Prefer ownership checks through stable parent tables (for example, organizations.owner_id) when authorizing membership management.
- Lessons learned: Validate policy changes immediately with direct REST calls before continuing feature testing.
- Commit: n/a (manual fix in Supabase SQL Editor)

### B-002 Unescaped apostrophe in sign-in page JSX

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/auth/signin/page.tsx
- Symptom: `react/no-unescaped-entities` lint risk due to raw apostrophe in JSX text.
- Cause: Unescaped JSX character in user-facing text.
- Fix: Replaced `Don't` with `Don&apos;t` in JSX text.
- Commit: 385dac2

### B-003 Syntax error in notes dashboard pagination implementation

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/dashboard/notes/page.tsx
- Symptom: TypeScript compilation failed with `try expected` and `Declaration or statement expected`.
- Cause: Duplicate/misplaced `finally` block and duplicate `useEffect` outside intended scope.
- Fix: Removed duplicated blocks and restored valid function/component structure.
- Commit: historical (pre-atomic cleanup)

### B-004 Module resolution failures in dashboard and auth pages

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/dashboard/notes/[id]/page.tsx, src/app/auth/signin/page.tsx, src/app/auth/signup/page.tsx
- Symptom: 30+ `Module not found` errors under Turbopack.
- Cause: Inconsistent internal import strategy and path resolution drift.
- Fix: Standardized internal imports to `@` alias usage where applicable and aligned import paths.
- Commit: historical (pre-atomic cleanup)

### B-005 Route handler params type mismatch in dynamic API routes

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/api/notes/[id]/route.ts, src/app/api/notes/[id]/summarize/route.ts, src/app/api/notes/[id]/versions/route.ts
- Symptom: Build/type-check errors expecting async-compatible `context.params` shape.
- Cause: Handler signatures were not aligned with the active Next.js runtime expectations.
- Fix: Updated handlers to read params from context safely and consistently.
- Commit: 2c78898

### B-006 Invalid parameter destructuring syntax in route handlers

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/api/notes/[id]/route.ts and summarize variants
- Symptom: Parser error `Expected ',', got ':'`.
- Cause: Invalid destructuring syntax in function parameter type annotation.
- Fix: Removed invalid parameter destructuring pattern and normalized context access inside function body.
- Commit: 2c78898

### B-007 Duplicate exported symbol declarations in schema files

- Date: 2026-04-16
- Status: Resolved
- Location: drizzle/schema.ts, src/drizzle/schema.ts
- Symptom: `Cannot redeclare exported variable 'organizations'`.
- Cause: Constants exported inline and re-exported again in trailing export block.
- Fix: Removed duplicate trailing re-export blocks.
- Commit: 2c78898

### B-008 Legacy schema import path in DB client

- Date: 2026-04-16
- Status: Resolved
- Location: src/lib/db.ts
- Symptom: Mixed schema import sources increased maintenance and resolution risk.
- Cause: Partial migration to `@` alias left a legacy relative import.
- Fix: Switched schema import to `@/drizzle/schema`.
- Commit: 2c78898

### B-009 Seed script union type mismatch for role/visibility

- Date: 2026-04-16
- Status: Resolved
- Location: scripts/seed.ts
- Symptom: Drizzle insert type mismatch because selected role/visibility inferred as `string`.
- Cause: Arrays inferred as `string[]` instead of literal union tuples.
- Fix: Declared arrays as `const` tuples and reused for random selection.
- Commit: 2c78898

### B-010 Drizzle orderBy direction type error in files API

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/api/files/route.ts
- Symptom: `.orderBy(files.createdAt, "desc")` type mismatch.
- Cause: Incorrect Drizzle orderBy usage with string direction argument.
- Fix: Replaced with `.orderBy(desc(files.createdAt))`.
- Commit: 2c78898

### B-011 Drizzle query builder reassignment type mismatch in notes API

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/api/notes/route.ts
- Symptom: Query builder type incompatibility when reassigning different chained shapes.
- Cause: Reassignment of strongly typed builder with variant generic output chains.
- Fix: Refactored into single query construction path using composable filter list.
- Commit: 2c78898

### B-012 `count` identifier shadowing in notes pagination

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/api/notes/route.ts
- Symptom: `'count' implicitly has type 'any'` self-reference error.
- Cause: Destructured variable name shadowed imported `count()` function in same expression context.
- Fix: Renamed destructured value to `totalCount`.
- Commit: 2c78898

### B-013 Next 16 async cookies API incompatibility in server Supabase client

- Date: 2026-04-16
- Status: Resolved
- Location: src/lib/supabase-server.ts
- Symptom: Cookie store methods accessed synchronously while `cookies()` resolved asynchronously.
- Cause: Client helper assumed sync cookie API.
- Fix: Made `createClient` async and updated API handlers to `await createClient()`.
- Commit: 2c78898

### B-014 Build failure from eager OpenAI client initialization

- Date: 2026-04-16
- Status: Resolved
- Location: src/app/api/notes/[id]/summarize/route.ts
- Symptom: Build failed during route data collection due to missing `OPENAI_API_KEY` at import time.
- Cause: OpenAI client initialized at module scope.
- Fix: Moved OpenAI client creation into POST handler with runtime env guard.
- Commit: 2c78898

### B-015 Prerender failure from eager Supabase browser client env requirement

- Date: 2026-04-16
- Status: Resolved
- Location: src/lib/supabase-client.ts
- Symptom: Prerender error `supabaseUrl is required`.
- Cause: Module-scope client initialization used non-null assertions on missing env vars.
- Fix: Added safe defaults to prevent prerender crash in env-missing contexts.
- Commit: 2c78898

### B-016 Missing dialog UI component import target

- Date: 2026-04-16
- Status: Resolved
- Location: src/components/ui/dialog.tsx and dependent dashboard settings page
- Symptom: Build failed because dialog UI module was imported but file did not exist.
- Cause: Missing component implementation.
- Fix: Added dialog component implementation compatible with existing UI patterns.
- Commit: 2c78898

### B-017 Invalid test scaffold expecting Express entrypoint

- Date: 2026-04-16
- Status: Resolved
- Location: tests/auth.test.ts
- Symptom: Vitest failed with `Cannot find module '../src/app'` and executed zero tests.
- Cause: Template test assumed an Express app entrypoint in a Next.js codebase.
- Fix: Replaced with executable schema validation tests.
- Commit: 6e6c7ab

### B-018 Vitest alias resolution mismatch for `@` imports

- Date: 2026-04-16
- Status: Resolved
- Location: tests/auth.test.ts
- Symptom: Test import failed for `@/lib/types/notes`.
- Cause: Vitest alias mapping for `@` not configured in this setup.
- Fix: Switched test import to relative path (`../src/lib/types/notes`).
- Commit: 6e6c7ab

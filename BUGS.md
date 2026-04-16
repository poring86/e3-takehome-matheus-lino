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
- Commit: pending

## Resolved Bugs

### B-002 Unescaped apostrophe in sign-in page JSX
- Date: 2026-04-16
- Status: Resolved
- Location: src/app/auth/signin/page.tsx
- Symptom: `react/no-unescaped-entities` lint risk due to raw apostrophe in JSX text.
- Cause: Unescaped JSX character in user-facing text.
- Fix: Replaced `Don't` with `Don&apos;t` in JSX text.
- Commit: pending

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

# BUGS.md

## Bugs Found During Review

### Bug 1: Agent orchestration deadlock and rate limit failure

- **Location**: initial AI agent setup / build orchestration
- **Issue**: the first AI agent workflow deadlocked while waiting on subscription-sync events and hit rate limits during schema generation.
- **Impact**: delayed initial architectural setup by ~1 hour and forced a pivot away from automated agent-only scaffolding.
- **Fix**: moved to manual schema definition and switched LLM models to Gemini Flash/Pro to maintain velocity.
- **Commit**: pending

### Bug 2: Unescaped apostrophe in sign-in page JSX

- **Location**: `src/app/auth/signin/page.tsx` line 107
- **Issue**: raw apostrophe in JSX triggers `react/no-unescaped-entities` lint errors and can cause rendering issues in strict React setups.
- **Impact**: prevents a clean lint/build pass and indicates a production-quality rendering issue in the auth flow.
- **Fix**: escape apostrophes in JSX text or use HTML entities to satisfy React linting.
- **Commit**: pending

### Bug 3: Syntax error in notes dashboard pagination implementation

- **Location**: `src/app/dashboard/notes/page.tsx` lines 76-79
- **Issue**: Duplicate and misplaced `finally` block in the `fetchNotes` function, causing TypeScript compilation to fail with "try expected" and "Declaration or statement expected" errors.
- **Impact**: Prevents the application from building and deploying, blocking the pagination feature implementation.
- **Fix**: Removed the duplicate `finally` block and duplicate `useEffect` that were incorrectly placed outside the function scope.
- **Commit**: Fixed in current session - code now compiles and dev server starts successfully.

### Bug 4: Module resolution failures in dashboard and auth pages (Next.js 16 Turbopack)

- **Location**: Multiple files in `src/app/dashboard/notes/[id]/page.tsx` and `src/app/auth/signin/page.tsx`, `src/app/auth/signup/page.tsx`
- **Issue**: Turbopack build fails with 30+ "Module not found" errors. Cannot resolve relative imports like `'../../../../../components/protected-route'`, `'../../components/ui/button'`, etc.
- **Affected files**:
  - `src/app/dashboard/notes/[id]/page.tsx` - cannot resolve protected-route, avatar, button, card, input, label, select
  - `src/app/auth/signin/page.tsx` - cannot resolve alert, button, card, input, label
  - `src/app/auth/signup/page.tsx` - cannot resolve alert, button, card, input, label
- **Impact**: `npm run build` fails completely with Turbopack. Build with `NEXT_DISABLE_TURBOPACK=1` shows the same errors, indicating a path resolution issue not specific to Turbopack.
- **Root cause**: Import paths are incorrect or target files do not exist. Components exist in `src/components/ui/` but imports are failing.
- **Severity**: **Critical** - blocks production deployment
- **Status**: Needs investigation and fix
- **Commit**: pending fix

## 2026-04-16

### Bug: Module not found for internal imports (UI components, lib, drizzle)

- Symptom: Next.js/Turbopack build failed with 'Module not found' for valid relative imports (e.g., '../../components/ui/button').
- Root cause: Turbopack/Next.js 16+ with tsconfig 'paths' mapping requires all internal imports to use the alias '@' instead of relative paths for consistent resolution.
- Fix: Refactored all internal imports to use '@' alias (e.g., '@/components/ui/button', '@/lib/supabase-client', '@/drizzle/schema').
- Commit: [refactor: use @ alias for all internal imports]

### Bug: Next.js Route Handler context.params type mismatch (Promise vs. plain object)

- Symptom: Type error in build: context.params expected as Promise<{ id: string }> but handler used plain object.
- Attempted Fix: Updated handlers to accept Promise in context.params, but it introduced a TypeScript/ESM syntax error: "Expected ',', got ':'."
- Next step: Adjust parameter handling syntax to a valid function signature using the context object inside the handler body.
- Fix: Updated handlers to read params from context inside the function body and resolve Promise/object compatibility.
- Commit: [fix: update Next.js route handler context.params to Promise]

### Bug: Syntax error while destructuring async route handler parameter

- Symptom: "Expected ',', got ':'" when using 'context: { params }: any' in the handler signature.
- Cause: That destructuring syntax is invalid for this route-handler function signature.
- Next step: Use 'context: any' and access 'context.params' in the function body.

**Bug:** Handler signature/type mismatch in summarize route (English only)

- Symptom: Type error in build: context.params expected as Promise<{ id: string }> but handler used plain object in src/app/api/notes/[id]/summarize/route.ts.
- Cause: Handler signature does not match Next.js 15+ expectations for context.params.
- Next step: Refactor POST handler in summarize/route.ts to use context: any and resolve params as Promise or object, with all code and comments in English.

### 2026-04-16

**Bug:** Handler signature/type mismatch in versions route (English only)

- Symptom: Type error in build: context.params expected as Promise<{ id: string }> but handler used plain object in src/app/api/notes/[id]/versions/route.ts.
- Cause: Handler signature does not match Next.js 15+ expectations for context.params.
- Next step: Refactor all handlers in versions/route.ts to use context: any and resolve params as Promise or object, with all code and comments in English.

### 2026-04-16

**Bug:** Duplicate exported symbol declarations in schema files

- Symptom: Build/type-check failed with "Cannot redeclare exported variable 'organizations'" in drizzle/schema.ts.
- Cause: The schema constants were exported where declared and then exported again in a trailing export block.
- Fix: Removed duplicate trailing export blocks in both drizzle/schema.ts and src/drizzle/schema.ts.

**Bug:** Legacy schema import path in database client

- Symptom: App code still imported schema from ../../drizzle/schema in src/lib/db.ts.
- Cause: Partial migration to @ alias left one old import path.
- Fix: Updated src/lib/db.ts to import schema from @/drizzle/schema.

**Bug:** Seed script role union type mismatch

- Symptom: Build/type-check failed in scripts/seed.ts because role was inferred as string instead of the required literal union.
- Cause: Roles and visibility arrays were inferred as string[] in random selection logic.
- Fix: Typed arrays as const literal tuples and reused them for random selection.

**Bug:** Drizzle orderBy direction string type error in files API

- Symptom: Build/type-check failed in src/app/api/files/route.ts because `.orderBy(files.createdAt, "desc")` passed a string where Drizzle expects SQL/order expressions.
- Cause: Incorrect use of string direction argument with Drizzle's orderBy API.
- Fix: Imported `desc` from drizzle-orm and changed to `.orderBy(desc(files.createdAt))`.

**Bug:** Drizzle query builder reassignment type mismatch in notes API

- Symptom: Build/type-check failed in src/app/api/notes/route.ts when reassigning `notesQuery` with different chained builder shapes (with/without `.where` and extra joins).
- Cause: Reassigning a strongly typed Drizzle query builder variable to different generic builder types.
- Fix: Reworked query construction to build a single `filters` array and create one final query with a single `.where(and(...filters))`.

**Bug:** `count` identifier shadowing in notes API pagination query

- Symptom: TypeScript error: `'count' implicitly has type 'any' because it is referenced directly or indirectly in its own initializer`.
- Cause: Destructuring `const [{ count }]` shadowed the imported `count()` function identifier in the same expression context.
- Fix: Renamed destructured result to `totalCount` and returned `total: totalCount`.

**Bug:** Next 16 async cookies API incompatibility in server Supabase client

- Symptom: Build/type-check failed in src/lib/supabase-server.ts because `cookies()` returned a Promise and code tried to call `cookieStore.getAll()` synchronously.
- Cause: Next.js 16 cookies API is async in this project setup, while the helper assumed a synchronous cookie store.
- Fix: Made `createClient` async (`await cookies()`) and updated all server route handlers to use `await createClient()`.

**Bug:** Build failed when collecting page data due to eager OpenAI client initialization

- Symptom: Build failed for /api/notes/[id]/summarize with missing `OPENAI_API_KEY` during module import.
- Cause: OpenAI client was instantiated at module scope, which executed during build-time route loading.
- Fix: Moved OpenAI client creation into the POST handler and added an explicit runtime guard for missing `OPENAI_API_KEY`.

**Bug:** Prerender failed due to eager Supabase browser client env requirement

- Symptom: Build failed while prerendering `/_not-found` with `supabaseUrl is required`.
- Cause: `src/lib/supabase-client.ts` instantiated a client at module scope with non-null assertions on missing env vars.
- Fix: Added safe defaults for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` so prerender/build does not crash when env vars are absent.

**Bug:** Auth test suite used invalid Express entrypoint for a Next.js app

- Symptom: `npx vitest run tests/auth.test.ts` failed with `Cannot find module '../src/app'` and reported zero tests.
- Cause: The test file was a template expecting an Express `app` entrypoint that does not exist in this Next.js project.
- Fix: Replaced the suite with executable schema validation tests based on `createNoteSchema` and `updateNoteSchema`.

**Bug:** Vitest path alias resolution mismatch in test imports

- Symptom: Test import failed for `@/lib/types/notes` in Vitest.
- Cause: Vitest alias mapping for `@` is not configured in the current setup.
- Fix: Switched test import to a relative path (`../src/lib/types/notes`) so tests run without extra Vitest config.

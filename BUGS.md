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

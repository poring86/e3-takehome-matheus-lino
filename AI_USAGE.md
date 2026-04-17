# AI_USAGE.md

## Agents Used

- Main agent: GitHub Copilot - overall coordination, planning, and review
- Sub-agent 1: Backend Setup Agent - database schema, auth, and RLS policies
- Sub-agent 2: Frontend Auth Agent - auth UI and organization management
- Sub-agent 3: Notes Agent - CRUD, versioning, and search
- Sub-agent 4: Features Agent - file upload and AI summaries
- Sub-agent 5: Infra Agent - logging, deployment, and seed data

## Work Split

- Parallel execution where possible: Backend and Frontend agents started simultaneously
- Sequential for dependent parts: Backend first, then frontend, then features

## Parallel Usage

- Agents 1 and 2 ran in parallel initially
- Agents 3 and 4 after auth/orgs were set up
- Agent 5 throughout for logging and infra

## Agent Errors and Interventions

- Error: The initial agent (Antigravity/Gemini Pro) suffered a processing deadlock and subscription sync failure during the setup phase.
- Intervention: Manually reset the environment and switched to a hybrid workflow using GitHub Copilot and browser-based LLMs (Gemini Flash/Pro) to bypass tool limitations and maintain velocity.
- Error: GitHub Copilot hit usage rate limits during intensive code generation and review phases.
- Intervention: Restarted VS Code and waited for quota reset to continue development.
- Update: Upgraded to the paid version of GitHub Copilot to overcome the usage limits of the free version, ensuring uninterrupted development progress.
- Error: Agents occasionally suggested outdated Next.js 13/14 APIs for server components.
- Intervention: I enforced the "nextjs-agent-rules" and manually corrected the code to use Next.js 15 async APIs and proper server-side patterns.

## What I Don't Trust Agents To Do

- Security-critical code (auth, permissions) - Always review deeply
- Complex business logic - Sample and test
- Deployment configs - Verify manually
- Performance bottleneck analysis for the 10k notes requirement
- Final validation of Supabase RLS policies to prevent multi-tenant data leaks

## Technical Management Steps

- Context Reset: On April 16, 2026, chat context was reset to prevent hallucinations and memory fatigue. This ensures code quality and prevents LLM drift by focusing only on current project files and instructions.

## Multi-Agent Protocol Execution (Current Session)

### QA/Security Agent Review (Current)

- **Decision**: Identified build failures due to module resolution issues. Prioritizing critical bug fixes before proceeding with Dashboard and Seed implementation.
- **Rationale**: Cannot proceed with feature development while core build is broken. Security and stability must be ensured first.
- **Action**: Investigating module not found errors in build output, focusing on dependency resolution and import paths.

### Feature Engineer Agent (Implementation Phase)

- **Decision**: Proceeding with RLS policies implementation as highest security priority.
- **Rationale**: Multi-tenant data isolation is incomplete without database-level RLS enforcement.
- **Action**: Creating Supabase migration scripts for RLS policies on all tables.

### Architect Agent (Deployment Phase)

- **Decision**: Created Railway deployment guide and Docker configuration.
- **Rationale**: Ensures production-ready deployment with proper environment setup.
- **Action**: Documented deployment process and post-deployment steps.

### QA/Security Agent (Commit Strategy)

- **Decision**: Execute atomic commits as requested by user to maintain clean git history and demonstrate agent work split.
- **Rationale**: Atomic commits provide clear audit trail of agent work and follow best practices for collaborative development.
- **Action**: Create 4 separate commits covering setup, database, auth, and dashboard features.

### Current Session - Module Resolution Fix & Feature Completion

- **Decision**: Invoke multi-agent workflow to diagnose and fix 30+ module resolution errors (Bug #4) blocking build
- **Rationale**: Critical blocker preventing progression. Multi-agent investigation accelerates diagnosis while maintaining review discipline.
- **Parallel Execution**:
  - **Agent 1 (Explore)**: Diagnose import pattern issues and identify working vs. broken imports
  - **Agent 1 (Main)**: Apply fixes with atomic commits for each change category
- **Serial Verification**: Main agent reviews all generated code before committing
- **Atomic Commits**: Each fix is committed separately with clear messages (tracked in git history)

## Agent Activity Log (2026-04-16, Supabase-only migration phase)

- **Main agent (GitHub Copilot)**
  - Removed local Postgres service from orchestration in `docker-compose.yml`.
  - Updated developer guidance to Supabase-only runtime in `README.md`.
  - Updated environment template in `.env.example` to document Supabase Postgres connection format.
  - Added architectural decision log entry in `NOTES.md` (why local db removal, impact, ops notes).
  - Added resolved bug entry in `BUGS.md` for local-vs-cloud DB drift (`DATABASE_URL` mismatch class).
  - Validated compose target service list (`app` only) and cleaned orphan containers.

- **Subagents used in this phase**
  - None invoked.

- **Outstanding manual input required**
  - Provide real Supabase Postgres `DATABASE_URL` in `.env` to complete end-to-end note creation validation.

## Agent Activity Log (2026-04-17, notes 500 resolution)

- **Main agent (GitHub Copilot)**
  - Reproduced `POST /api/notes` failure and captured precise backend error logs.
  - Isolated runtime DB auth failure (`28P01`) in Drizzle query path at `src/app/api/notes/route.ts`.
  - Validated container runtime URL parsing and effective DB identity from inside app container.
  - Determined correct password variant included trailing `.` and updated runtime configuration workflow.
  - Verified end-to-end success: authenticated request to `POST /api/notes` returned `201` with created note payload.

- **Subagents used in this phase**
  - None invoked.

## Agent Activity Log (2026-04-17, notes integration hardening)

- **Main agent (GitHub Copilot)**
  - Hardened integration diagnostics with explicit env override preservation in `scripts/diagnose-notes-integration.sh`.
  - Added smoke guard `scripts/smoke-notes.sh` for fast runtime validation of note creation path.
  - Implemented bearer-token fallback auth for `/api/notes/[id]` route handlers.
  - Fixed delete path by removing dependent rows before note deletion.
  - Updated integration assertions to match API payload shape and revalidated end-to-end.

- **Validation executed by main agent**
  - `npx vitest run tests/api/notes.integration.test.ts` (passed `4/4`).
  - `sh scripts/smoke-notes.sh` (passed `201`).
  - `npm run build` (passed).

- **Subagents used in this phase**
  - None invoked.

## Agent Activity Log (2026-04-17, new-note UI save hardening)

- **Main agent (GitHub Copilot)**
  - Updated `/dashboard/notes/new` save flow to attach bearer token from Supabase session.
  - Improved frontend error handling to surface backend API errors in-page (instead of generic console-only failure).
  - Revalidated production build after frontend changes.

- **Validation executed by main agent**
  - `npm run build` (passed).

- **Subagents used in this phase**
  - None invoked.

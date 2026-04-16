# AI_USAGE.md

## Agents Used

- Main Agent: GitHub Copilot (Grok Code Fast 1) - Overall coordination, planning, review
- Sub-agent 1: Backend Setup Agent - DB schema, auth, RLS policies
- Sub-agent 2: Frontend Auth Agent - Auth UI, org management
- Sub-agent 3: Notes Agent - CRUD, versioning, search
- Sub-agent 4: Features Agent - File upload, AI summaries
- Sub-agent 5: Infra Agent - Logging, deployment, seed data

## Work Split

- Parallel execution where possible: Backend and Frontend agents started simultaneously
- Sequential for dependent parts: Backend first, then frontend, then features

## Parallel Usage

- Agents 1 and 2 ran in parallel initially
- Agents 3 and 4 after auth/orgs were set up
- Agent 5 throughout for logging and infra

## Agent Errors and Interventions

- Error: The initial agent (Antigravity/Gemini Pro) suffered a processing deadlock and subscription sync failure during the setup phase.
- Intervention: I manually intervened to reset the environment and shifted to a hybrid workflow using GitHub Copilot and browser-based LLMs (Gemini Flash/Pro) to bypass tool limitations and maintain velocity.
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

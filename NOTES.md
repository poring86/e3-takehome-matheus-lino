# NOTES.md - Agent Scratchpad

## Project Overview
Building a multi-tenant team notes app using NextJS, Supabase, Drizzle, TypeScript. Features: auth + multi-tenancy, notes CRUD with versioning, search, file upload, AI summaries, logging. Deploy to Railway with Docker.

## Current State
- NextJS project initialized with basic dependencies (Supabase, Drizzle, OpenAI, etc.)
- No implementation yet, just starter page

## Plans and Decisions
- **Architecture**: 
  - Frontend: NextJS App Router, Tailwind for styling, Radix UI components
  - Backend: Supabase for DB/auth/storage, Drizzle ORM
  - Auth: Supabase Auth with RLS for multi-tenancy
  - DB Schema: organizations, users, org_members (roles), notes, note_versions, tags, note_tags, files
  - Versioning: note_versions table tracking changes
  - Search: Supabase full-text search with RLS
  - AI: OpenAI API for note summaries
  - Logging: Pino logger, store operational logs in DB

- **Work Split**:
  - Agent 1: Backend setup (DB schema, auth, RLS)
  - Agent 2: Frontend auth and org management
  - Agent 3: Notes CRUD, versioning, search
  - Agent 4: File upload and AI features
  - Agent 5: Logging, deployment, seed data

- **Timeline**: 24 hours, aim for completion with review

## Actions Taken
- [ ] Created NOTES.md
- [ ] Created AI_USAGE.md, BUGS.md, REVIEW.md
- [ ] Initialized git repo if needed
- [ ] Set up environment variables for Supabase, OpenAI

## Decisions Made
- Use RLS for all tenant isolation
- Roles: owner, admin, member
- Visibility: public (org-wide), private (author only), shared (specific users)
- Diffs: Use diff library for version comparisons

## Next Steps
- Launch sub-agents for implementation
- Review and test each component
- Frequent commits with explanations
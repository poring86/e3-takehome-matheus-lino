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

## Backend Setup Agent Actions

- Created drizzle/schema.ts with all required tables: organizations, users, org_members, notes, note_versions, tags, note_tags, files
- Defined role enum: owner, admin, member
- Created drizzle.config.ts for migrations
- Generated initial migration with Drizzle
- Added RLS policies to migration for multi-tenancy and role-based access:
  - Users can only access their own profile
  - Org boundaries enforced via org_members
  - Role-based permissions: members can read, admins/owners can manage
- Created Supabase client/server libs in src/lib/
- Created Drizzle db connection in src/lib/db.ts
- Added middleware.ts for auth session management
- Auth setup: Supabase Auth with RLS, users table linked to auth.users (manual sync needed)

## Decisions Made
- Used uuid for all IDs for consistency with Supabase
- RLS policies use auth.uid() for user context
- Basic RBAC: owners/admins can manage orgs/members, authors can manage their notes/files
- Foreign keys without cascades for safety
- Migration includes RLS enable and policies

## Decisions Made
- Use RLS for all tenant isolation
- Roles: owner, admin, member
- Visibility: public (org-wide), private (author only), shared (specific users)
- Diffs: Use diff library for version comparisons

## Next Steps
- Launch sub-agents for implementation
- Review and test each component
- Frequent commits with explanations
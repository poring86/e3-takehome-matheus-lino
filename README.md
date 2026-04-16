# E3 Take-home: Multi-tenant Notes Platform

Production-style take-home project built with Next.js, Supabase, Drizzle, and TypeScript.

## Scope Summary

- Multi-tenant auth and organization membership
- Notes CRUD with permissions
- Visibility and selective sharing
- Versioning and history endpoints
- Search across title/content/tags
- File upload flow
- AI note summary (generate + accept/reject)
- Structured logging for key events
- Seed data for large test volume

## Tech Stack

- Next.js 16
- TypeScript
- Supabase (Auth + Storage + Postgres)
- Drizzle ORM
- Zod
- Vitest

## Project Structure

- src/app: routes, pages, and API handlers
- src/components: UI and route guards
- src/lib: clients, db setup, helpers, schemas
- src/drizzle: runtime schema definitions
- drizzle and supabase/migrations: SQL and migration artifacts
- scripts/seed.ts: seed script for bulk sample data

## Environment Variables

Create a `.env` (or `.env.local`) with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
OPENAI_API_KEY=...
LOG_LEVEL=info
```

## Local Setup

```bash
npm install
npm run db:migrate
npm run dev
```

## Useful Scripts

```bash
npm run dev        # start local dev server
npm run build      # production build
npm run start      # start production server
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Validation Commands

```bash
npm run build
npx vitest run tests/auth.test.ts
```

## Deployment

For Railway deployment details, see:

- RAILWAY_DEPLOYMENT.md

## Documentation

- BUGS.md: bug tracking with status and commit references
- NOTES.md: execution notes and checklist
- AI_USAGE.md: agent usage and interventions
- REVIEW.md: review coverage and risk notes

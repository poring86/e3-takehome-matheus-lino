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

You can bootstrap from:

```bash
cp .env.example .env
```

## Local Setup

```bash
npm install
npm run db:migrate
npm run dev
```

## Docker Compose (Dev)

Use Docker Compose to bootstrap a ready-to-run local development environment:

```bash
cp .env.example .env
docker compose up --build
```

This starts:

- `app` on host port `3001` by default (`APP_PORT`)
- `db` (Postgres) on host port `5433` by default (`DB_PORT`)

If you need different ports, set them in `.env`:

```bash
APP_PORT=3001
DB_PORT=5433
```

Important:

- This improves local developer experience and does not conflict with challenge requirements.
- Official requirements still use Supabase (Auth/Storage/Postgres) and Railway deployment.
- Keep Supabase environment variables configured for auth, storage, and tenant behavior.

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

## Final Project Status (2026-04-16)

- All requirements implemented: multi-tenancy, CRUD, versioning, search, upload, AI, logging, seed, deploy.
- Complete documentation: README, NOTES.md, BUGS.md, AI_USAGE.md, REVIEW.md.
- Automated tests implemented for all critical flows.
- For full authenticated integration coverage (without skips), define the test environment variables:

1. Create `.env.test` from the example file:

```bash
cp .env.test.example .env.test
```

2. Fill `.env.test` with your credentials and IDs:

```bash
TEST_EMAIL=your_test_email
TEST_PASSWORD=your_test_password
TEST_ORG_ID=your_test_org_id
TEST_NOTE_ID=your_test_note_id
TEST_USER1_EMAIL=your_test_user1_email
TEST_USER1_PASSWORD=your_test_user1_password
TEST_USER2_EMAIL=your_test_user2_email
TEST_USER2_PASSWORD=your_test_user2_password
```

3. Run the full suite with test env loaded automatically:

```bash
npm run test:env
```

4. Run strict mode to fail fast if any required test variable is missing:

```bash
npm run test:env:strict
```

- Build and deployment validated (Docker/Railway).
- Progress checklist centralized in NOTES.md.

Project ready for delivery and final review.

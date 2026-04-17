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

## Autenticação e Organização: Arquitetura Modular

Todos os hooks de autenticação e organização agora seguem uma arquitetura modular, evitando componentes órfãos e promovendo boundaries claros entre domínios:

- **Autenticação:**
  - `useUserSession` e `useSignOut` ficam em `src/modules/auth/hooks/`
- **Organização:**
  - `useCurrentOrg` e `useSwitchOrg` ficam em `src/modules/organization/hooks/`

Importe sempre via o módulo:

```ts
import { useUserSession } from "@/modules/auth";
import { useCurrentOrg } from "@/modules/organization";
```

Não utilize mais hooks de domínio em `lib/` ou componentes órfãos. Siga a separação de módulos para lógica de domínio, conforme recomendações do livro "Arquitetura: As Partes Difíceis".

## Architecture

The project follows a modular monolith architecture with server-first API routes and strict tenant boundaries.

- Architecture baseline and rules: see `ARCHITECTURE.md`
- Module decomposition and boundaries: see `src/modules/README.md`
- Operational governance and commit/audit contract: see `AGENTS.md`

## Naming Convention

- Source and executable script filenames use kebab-case.
- Example patterns:
  - `use-user-session.ts`
  - `check-test-coverage.ts`
  - `organization-service.ts`
- Why:
  - Consistent path style reduces CI/container path mismatch issues.
  - Improves maintainability and discoverability in grep/search-based workflows.
  - Keeps module, script, and workflow references aligned over time.

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

- `app` on host port `3000` by default (`APP_PORT`)

If you need different ports, set them in `.env`:

```bash
APP_PORT=3000
```

Important:

- This setup uses Supabase for Auth, Storage, and Postgres (no local Postgres container).
- Ensure `DATABASE_URL` points to your Supabase Postgres connection string.
- Keep Supabase environment variables configured for tenant behavior.

## Production Image Optimization

Production image uses a multi-stage Docker build with Next.js standalone output.

What this changes:

- Build dependencies stay in builder stages and do not ship to runtime.
- Runtime image includes only `public`, `.next/static`, and `.next/standalone` artifacts.
- Container runs as non-root user in production stage.

Expected impact:

- Smaller final image and faster image pull/startup in deployment.
- Reduced attack surface in runtime container.
- Cleaner separation between build-time and runtime concerns.

## Useful Scripts

```bash
npm run dev        # start local dev server
npm run build      # production build
npm run start      # start production server
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:reset:seed
```

- `db:seed`: populates sample data without clearing existing records.
- `db:reset:seed`: clears app data and Supabase Auth users before reseeding.

## Validation Commands

```bash
npm run build
npx vitest run tests/auth.test.ts
npm run test:notes:integration
npm run smoke:notes
```

## Recommended Docker Test Flow (Single Source of Truth)

Use this flow to avoid host/container mismatches and port confusion.

One-command options:

```bash
npm run test:notes:docker:full
npm run test:docker:full
```

- `test:notes:docker:full`: runs only notes integration suite.
- `test:docker:full`: runs the full test suite inside Docker with higher hook/test timeout to reduce integration flakiness.

Equivalent manual flow:

```bash
docker compose down --remove-orphans
docker compose up -d app
docker compose exec app npm run test:notes:integration
```

Expected setup:

- `APP_PORT=3000` in `.env`
- integration env variables filled in `.env.test` (`TEST_EMAIL`, `TEST_PASSWORD`, `TEST_ORG_ID`)

Notes:

- `test:notes:integration` validates authenticated note CRUD against the running app/API using Supabase auth token flow.
- `smoke:notes` is a fast runtime guard for the most critical write path (`POST /api/notes`) and fails immediately if database/auth runtime config is broken.

## Deployment

For Railway deployment details, see:

- RAILWAY_DEPLOYMENT.md

## Documentation

- ARCHITECTURE.md: architecture baseline, layering, and conventions
- docs/adr/README.md: architecture decision records (ADRs) index and accepted decisions
- docs/github-governance.md: CI pipelines and branch protection policy
- docs/github-branch-protection-checklist.md: 2-minute setup checklist for required checks on `main`
- .github/pull_request_template.md: PR checklist for ADR/risk/validation/audit alignment
- src/modules/README.md: component/module decomposition and dependency rules
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

## AI Summary (OpenAI) Notice

The note summary feature depends on a valid and funded OpenAI API key (`OPENAI_API_KEY`).

- If your OpenAI quota runs out, the system will return a clear message and all other features will keep working normally.
- You do NOT need OpenAI credits to run tests, CRUD, authentication, versioning, etc.
- To test the AI summary, just add a valid key and restart the backend.

## AI: Note Summary (OpenAI or Gemini)

By default, note summaries use OpenAI (gpt-3.5-turbo). You can switch to Gemini (Google) if preferred.

### Provider Selection

In your `.env`:

```
AI_PROVIDER=openai   # or gemini
```

- For OpenAI: set `OPENAI_API_KEY`.
- For Gemini: set `GEMINI_API_KEY`.

Exemplo:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

If `AI_PROVIDER` is not set, the default is `openai`.

### Notes

- The mandatory challenge delivery must work with OpenAI.
- Gemini support is optional and considered an extra.
- The demo video can be recorded with any tool (Gemini, OBS, Loom, etc).
- Document in the video/README which provider is being used.

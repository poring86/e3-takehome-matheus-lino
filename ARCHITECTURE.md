# ARCHITECTURE.md

## Purpose

This document defines the architectural baseline for the project so feature work stays consistent, reviewable, and scalable.

## Architectural Style

- Application style: modular monolith.
- Runtime model: Next.js app router with server-first API routes.
- Data boundary: Supabase Postgres (via Drizzle ORM) as single source of truth.
- Multi-tenant rule: all business reads/writes must be scoped by organization membership.

## Component-Based Decomposition

The monolith is decomposed by business capability (component/module), not by technical layer only.

Current primary components:

- `notes`: note lifecycle, visibility, versioning, and sharing.
- `auth` (shared): authenticated identity resolution and session/token handling.

Target module shape for each capability:

- `src/modules/<component>/application/`: use cases and orchestration.
- `src/modules/<component>/domain/`: business policies and invariants.
- `src/modules/<component>/infrastructure/`: persistence and external adapters.
- `src/modules/<component>/index.ts`: public API for other layers/components.

This follows a component-first decomposition strategy to keep change localized and reduce cognitive load.

## Layering Model

Use this layering model for new features:

1. Interface Layer
- `src/app/**`: pages and API route handlers.
- Responsibilities: input parsing, auth/session extraction, HTTP response mapping.
- Must not contain complex business rules.

2. Domain/Application Layer
- `src/modules/**` plus shared kernel in `src/lib/**` when truly cross-cutting.
- Responsibilities: business rules, permission checks, orchestration.
- Should be framework-light and testable.

3. Data Layer
- `src/lib/db.ts`, `drizzle/schema.ts`, SQL migrations.
- Responsibilities: persistence, relational mapping, migration evolution.

4. Infra/Cross-cutting
- `src/lib/logger.ts`, deployment files, scripts.
- Responsibilities: logging, runtime config, build/deploy/test orchestration.

## Folder Conventions

- API endpoints: `src/app/api/<domain>/...`
- UI pages: `src/app/<area>/...`
- Shared UI primitives: `src/components/ui/**`
- Cross-domain libs: `src/lib/**`
- Component modules: `src/modules/**`
- DB schema/migrations: `drizzle/**` and `supabase/migrations/**`
- Test files: `tests/<domain>*.test.ts`

## Coupling Rules (Mandatory)

- Prefer dependency by module public API (`src/modules/<component>/index.ts`).
- Avoid deep imports into another module internals.
- Route handlers are interface adapters; they should not embed business logic.
- New business logic should be introduced in application/domain layers before route integration.
- Keep shared kernel small; do not move feature-specific rules to shared areas.

## Core Invariants

- Every tenant-sensitive query must include organization boundary checks.
- Route handlers must authenticate before database access.
- Validation must happen at boundaries (request payload/params).
- Mutating endpoints should emit structured logs.
- New DB behavior requires a migration artifact.

## API Design Rules

- Keep handlers thin and deterministic.
- Use explicit status codes (`400/401/403/404/500`).
- Return stable JSON shapes; avoid ad-hoc response formats.
- Prefer additive changes to preserve compatibility.

## Testing Strategy

- Unit tests: pure logic and validation paths.
- Integration tests: API + auth + DB behavior.
- Docker full-suite command is the canonical reproducible validation for delivery.

## Delivery Governance

- Follow atomic commit policy from `AGENTS.md`.
- Keep `AI_USAGE.md`, `NOTES.md`, `BUGS.md`, and `REVIEW.md` aligned with relevant architectural decisions.
- Document architecture-impacting decisions in `NOTES.md` as decision logs.

## Decision Workflow

When introducing architectural changes:

1. Write a short decision note in `NOTES.md` with rationale.
2. Update this file if conventions or boundaries changed.
3. Update README if the change affects contributor or reviewer workflow.
4. Validate with build + canonical Docker tests.

## Migration Status (Incremental)

- Notes API flow (`list/create/get/update/delete/versions/summarize`) is routed through module application services.
- Shared authentication helper is exposed through module public API.
- Lint boundaries guard modularized Notes handlers against direct DB/schema coupling.

# ADR-0001: Adopt modular monolith boundaries

- Status: Accepted
- Date: 2026-04-17
- Deciders: Project maintainers
- Related: `NOTES.md` Architecture Decision/Progress logs (2026-04-17)

## Context

The codebase grew through feature-first delivery and needed clearer boundaries to reduce coupling between handlers, business logic, and data access.

## Decision

Adopt a modular monolith model where each capability exposes a public module API and route handlers remain thin interface adapters.

The module shape is:

- `src/modules/<component>/application/`
- `src/modules/<component>/domain/`
- `src/modules/<component>/infrastructure/`
- `src/modules/<component>/index.ts`

Cross-module usage should prefer public APIs and avoid deep imports.

## Consequences

### Positive

- Clearer ownership and evolution per capability.
- Lower coupling risk between route layer and persistence details.
- Better testability for domain/application logic.

### Negative / Trade-offs

- Incremental migration overhead while legacy patterns still exist.
- Requires lint and review discipline to enforce boundaries.

### Follow-ups

- Continue migrating remaining business logic out of route handlers.
- Expand boundary checks where needed.

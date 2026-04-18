# ADR-0003: Adopt React Query for dashboard server state

- Status: Accepted
- Date: 2026-04-17
- Deciders: Project maintainers
- Related: `NOTES.md` Frontend State Decision/Validation logs (2026-04-17)

## Context

Dashboard pages used imperative fetch orchestration with repeated loading/error state wiring, increasing complexity and race-condition surface.

## Decision

Adopt TanStack React Query for dashboard server-state flows.

Initial scope includes:

- Notes list
- Note detail
- Note versions
- Settings member management
- Onboarding/org bootstrap loading

## Consequences

### Positive

- Centralized server-state caching and invalidation.
- Reduced imperative fetch boilerplate.
- Better consistency for loading/error semantics.

### Negative / Trade-offs

- Added dependency and query-client lifecycle management.
- Migration period where old and new patterns can coexist.

### Follow-ups

- Continue incremental migration of remaining imperative server-state flows.
- Keep query-key conventions documented.

# ADR-0005: Standardize API auth resolution order

- Status: Accepted
- Date: 2026-04-17
- Deciders: Project maintainers
- Related: Notes/integration logs for `/api/notes` auth hardening

## Context

API handlers experienced inconsistent authentication behavior across browser-cookie and bearer-token clients, causing regressions such as `401/403` in integration and post-redirect flows.

## Decision

Standardize API authentication resolution order for protected handlers:

1. Resolve user from `Authorization: Bearer <token>` when present.
2. Fallback to server-side cookie/session auth when bearer token is absent.
3. Return explicit `401` on unresolved identity, before business/data access.

Implementation expectation:

- Keep auth extraction in thin handler/interface layer.
- Keep business services token-agnostic and user-centric.

## Consequences

### Positive

- Predictable behavior across browser and API clients.
- Lower race-condition risk in client hydration windows.
- Cleaner separation of concerns between handler auth and domain logic.

### Negative / Trade-offs

- Slightly more handler plumbing where legacy endpoints are still being migrated.
- Must keep auth behavior uniform across all handlers to avoid drift.

### Follow-ups

- Expand to all protected routes as part of modularization passes.
- Keep integration tests covering bearer and cookie fallback behavior.

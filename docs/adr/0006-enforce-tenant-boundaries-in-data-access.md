# ADR-0006: Enforce tenant boundaries in data access

- Status: Accepted
- Date: 2026-04-17
- Deciders: Project maintainers
- Related: RLS fixes, notes permission hardening, architecture invariants

## Context

The platform is multi-tenant by organization membership. Data leaks can occur when org scoping is omitted in joins/filters or when permission checks are inconsistently applied.

## Decision

Define tenant boundary enforcement as a non-negotiable invariant:

- Every tenant-sensitive read/write must be scoped by organization membership.
- Auth resolution must occur before database access.
- Handler-level validation and explicit permission checks must precede mutation.
- RLS and application checks are complementary, not interchangeable.

## Consequences

### Positive

- Stronger defense against cross-tenant leakage.
- More consistent review criteria for security-sensitive code.
- Easier root-cause analysis for auth/permission regressions.

### Negative / Trade-offs

- Additional query/permission plumbing in some endpoints.
- Higher migration effort for legacy paths not yet fully modularized.

### Follow-ups

- Keep boundary lint/rules aligned with modularized handlers.
- Add/maintain integration tests for unauthorized cross-org attempts.
- Document exceptions explicitly (if ever needed) with dedicated ADR updates.

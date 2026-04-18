# ADR-0002: Standardize kebab-case filenames with fitness gate

- Status: Accepted
- Date: 2026-04-17
- Deciders: Project maintainers
- Related: `NOTES.md` Naming Decision Log (2026-04-17), fitness updates

## Context

Mixed filename conventions increased path-reference drift risk across scripts, CI workflows, and Linux/Docker environments.

## Decision

Standardize source and executable script filenames to kebab-case/lowercase and enforce the rule using an automated fitness function.

Enforcement implementation:

- `src/fitness/check-file-naming.ts`
- Local integration: `scripts/fitness-run.sh`
- CI integration: `.github/workflows/fitness.yml`

## Consequences

### Positive

- Lower risk of path mismatch in CI and containerized workflows.
- Consistent grep/search/discovery behavior across the codebase.
- Naming policy becomes executable, not only documented.

### Negative / Trade-offs

- Additional validation step in fitness pipeline.
- Existing files require one-time migration and reference updates.

### Follow-ups

- Keep policy references aligned in governance docs.
- Review naming scope exceptions only when framework constraints require it.

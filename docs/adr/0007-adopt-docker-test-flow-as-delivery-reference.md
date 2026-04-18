# ADR-0007: Adopt Docker test flow as delivery reference

- Status: Accepted
- Date: 2026-04-17
- Deciders: Project maintainers
- Related: Docker test orchestration and reliability updates

## Context

Host-vs-container differences caused intermittent validation inconsistencies, especially in integration setup and timeout behavior.

## Decision

Adopt containerized test execution as the delivery reference path:

- Canonical commands:
  - `npm run test:notes:docker:full`
  - `npm run test:docker:full`
- Keep timeout profile tuned for containerized integration setup.
- Treat host runs as local feedback, not as final delivery authority.

## Consequences

### Positive

- Better reproducibility across machines and reviewers.
- Lower risk of environment-specific false negatives/positives.
- Alignment between local validation and CI/runtime behavior.

### Negative / Trade-offs

- Slower execution compared to host-only unit runs.
- Extra Docker dependency for full delivery validation.

### Follow-ups

- Keep Docker scripts and docs synchronized.
- Revisit timeout defaults as test suite and infra evolve.
- Maintain a small smoke path for fast critical-path checks.

## Summary

Describe what changed and why.

## Type of Change

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Test-only
- [ ] Documentation-only
- [ ] CI/CD or governance

## Architectural Impact

- [ ] No architectural impact
- [ ] Architectural impact (details below)

If architecture is impacted, reference ADR(s):

- ADR: <!-- e.g. docs/adr/0006-enforce-tenant-boundaries-in-data-access.md -->

## Risk Assessment

- [ ] Low
- [ ] Medium
- [ ] High

Main risks and mitigation:

- Risk:
- Mitigation:

## Validation Evidence

Required before merge:

- [ ] `npm run -s build`
- [ ] `CI / verify` passed
- [ ] `Fitness Functions / fitness` passed

Optional/local evidence (when relevant):

- [ ] `npm run test:notes:docker:full`
- [ ] `npm run test:docker:full`
- [ ] `npx vitest run --coverage`

## Multi-tenant and Security Checks

- [ ] Tenant boundaries verified for all new/changed data paths
- [ ] Auth behavior verified (bearer-first/fallback where applicable)
- [ ] No sensitive data exposure in logs/responses

## Docs and Audit Alignment

- [ ] `NOTES.md` updated when needed
- [ ] `REVIEW.md` updated when risk/review scope changed
- [ ] `AI_USAGE.md` updated when agent execution trace changed
- [ ] ADR added/updated for long-lived architecture decisions

## Checklist

- [ ] No deep import across module boundaries
- [ ] File naming follows kebab-case policy (where applicable)
- [ ] No unrelated file changes included

# GitHub Governance (Pipelines + Branch Protection)

This project uses a two-layer validation model in GitHub Actions:

- Fast CI for pull-request feedback (`CI / verify`)
- Fitness gate for architectural/non-functional constraints (`Fitness Functions / fitness`)

## Required Workflows

- `.github/workflows/ci.yml`
- `.github/workflows/fitness.yml`

## Recommended Branch Protection (main)

Set these rules in GitHub repository settings for `main`:

1. Require a pull request before merging
2. Require approvals: minimum 1
3. Dismiss stale approvals when new commits are pushed
4. Require conversation resolution before merging
5. Require status checks to pass before merging:
   - `CI / verify`
   - `Fitness Functions / fitness`
6. Require branches to be up to date before merging
7. Restrict direct pushes to `main`
8. Include administrators (recommended)

For a fast UI walkthrough, see `docs/github-branch-protection-checklist.md`.

## Why this setup

- CI gives fast signal for code health (lint/build/test)
- Fitness protects long-lived quality constraints (naming, bundle, coverage, architecture checks)
- Branch protection ensures decisions are enforced consistently, not optionally

## Operational Notes

- If a check is too slow for developer loop, keep it in fitness and not in fast CI.
- If a check is flaky, fix or quarantine it before marking as required.
- Required checks should represent deterministic project policy.

## Pull Request Template

Use `.github/pull_request_template.md` to standardize:

- ADR references for architecture-impacting changes
- Risk declaration and mitigation notes
- Validation evidence and required checks
- Audit file alignment (`NOTES.md`, `REVIEW.md`, `AI_USAGE.md`)

## Code Owners

Use `.github/CODEOWNERS` to route review automatically for architecture, API, and governance sensitive paths.

Recommended branch protection alignment:

1. Enable `Require review from Code Owners`
2. Keep minimum approvals at `1` or more, depending on team size
3. Keep stale-approval dismissal enabled to ensure owners review latest diffs

Why this helps:

- Reduces review gaps on security/tenant-sensitive paths
- Improves accountability for governance and architecture changes
- Makes reviewer assignment deterministic at PR open time

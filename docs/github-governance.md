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

## Why this setup

- CI gives fast signal for code health (lint/build/test)
- Fitness protects long-lived quality constraints (naming, bundle, coverage, architecture checks)
- Branch protection ensures decisions are enforced consistently, not optionally

## Operational Notes

- If a check is too slow for developer loop, keep it in fitness and not in fast CI.
- If a check is flaky, fix or quarantine it before marking as required.
- Required checks should represent deterministic project policy.

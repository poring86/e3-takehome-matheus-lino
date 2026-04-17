# GitHub Branch Protection Checklist (2 minutes)

Use this checklist to protect `main` with required pipelines.

## Preconditions

- Workflows are present:
  - `.github/workflows/ci.yml`
  - `.github/workflows/fitness.yml`
- At least one CI run already happened, so status checks appear in GitHub UI.

## UI Steps

1. Open repository `Settings`.
2. Open `Branches`.
3. Under `Branch protection rules`, click `Add rule`.
4. Branch name pattern: `main`.
5. Enable `Require a pull request before merging`.
6. Set minimum approvals to `1`.
7. Enable `Dismiss stale pull request approvals when new commits are pushed`.
8. Enable `Require conversation resolution before merging`.
9. Enable `Require review from Code Owners`.
10. Enable `Require status checks to pass before merging`.
11. Select required checks:
    - `CI / verify`
    - `Fitness Functions / fitness`
12. Enable `Require branches to be up to date before merging`.
13. Enable `Do not allow bypassing the above settings` (recommended).
14. Optionally enable `Include administrators`.
15. Click `Create` / `Save changes`.

## Validation After Setup

- Create a test PR and confirm merge is blocked when one required check fails.
- Confirm direct push to `main` is blocked for non-exempt users.

## Optional Ruleset (JSON template)

If you prefer repository rulesets via API/automation, use this as a baseline payload and adapt fields to your org policy:

```json
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "pull_request", "parameters": { "required_approving_review_count": 1, "dismiss_stale_reviews_on_push": true, "require_code_owner_review": true, "require_last_push_approval": false, "required_review_thread_resolution": true } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": true, "required_status_checks": [ { "context": "CI / verify" }, { "context": "Fitness Functions / fitness" } ] } },
    { "type": "non_fast_forward" },
    { "type": "deletion" }
  ],
  "bypass_actors": []
}
```

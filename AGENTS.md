<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Audit Note (2026-04-17)

- Recent delivery trace was updated in `AI_USAGE.md`, `NOTES.md`, `BUGS.md`, and `REVIEW.md`.
- Scope includes Docker test orchestration hardening and production image multi-stage optimization.

## Execution Contract (Mandatory)

### Atomic Commits Policy

- Always create atomic commits by logical unit only (one intent per commit).
- Never mix feature, refactor, test, and docs in the same commit unless they are inseparable for build integrity.
- Commit order must be: code change, tests/validation update, documentation/audit update.
- If a change touches multiple domains, split into multiple commits.

### Audit Files Watch Policy

- Keep these files continuously aligned with every relevant change:
	- `AGENTS.md`
	- `AI_USAGE.md`
	- `NOTES.md`
	- `BUGS.md`
	- `REVIEW.md`
- Any infra, security, test orchestration, or production behavior change must be reflected in audit docs in the same delivery cycle.

### Pre-Completion Checklist (Required Before Declaring Done)

- Confirm whether change requires an entry in `AI_USAGE.md`.
- Confirm whether change requires a decision or log entry in `NOTES.md`.
- Confirm whether bug behavior changed and update `BUGS.md`.
- Confirm whether review scope/risk changed and update `REVIEW.md`.
- Confirm whether operating rules changed and update `AGENTS.md`.

### Modular Monolith Boundary Policy

- Prefer component/module APIs from `src/modules/<component>/index.ts`.
- Avoid deep imports into another module's internal folders.
- Keep route handlers (`src/app/api/**`) thin and focused on interface concerns.
- Migrate business logic from handlers to module application/domain layers incrementally.

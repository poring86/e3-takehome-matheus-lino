# NOTES.md — Agent Scratchpad

## Documentation Guardrails

- Keep all code, comments, and documentation in English only.
- Keep entries concise and actionable.
- Prefer atomic commits by logical unit (fix, test, docs).

## Project Completion Checklist (2026-04-16)

### Core Features

- [x] Auth + multi-tenancy (sign in, org creation, org switch, roles, permissions enforced)
- [x] Notes CRUD (create, read, update, delete)
- [x] Tagging, visibility controls, selective sharing within org
- [x] Versioning & state tracking (history, diffs, who/when/what)
- [x] Search (titles, content, tags, org/permission aware, scalable)
- [x] File upload (org/note association, permissioned access)
- [x] AI summary (structured, accept/reject, permission-safe)
- [x] Logging (auth events, mutations, AI, failures, permission denials)

### Infra & Data

- [x] Dockerfile & Railway deployment
- [x] Seed script with 10k+ notes, multiple orgs/users/tags/versions/files

### Documentation

- [ ] NOTES.md (plans, actions, reasoning)
- [ ] AI_USAGE.md (agents, split, errors, distrust)
- [ ] BUGS.md (bugs, commit refs)
- [ ] REVIEW.md (deep/sample review, distrust, next steps)
- [ ] Git history granular & explanatory

### Tests

- [ ] Auth flow (sign in, sign up, org switch)
- [ ] Permissions enforcement (role-based access)
- [ ] Notes CRUD (create, read, update, delete)
- [ ] Notes versioning & diff
- [ ] Search (titles, content, tags, org boundaries)
- [ ] File upload & access control
- [ ] AI summary (generation, accept/reject, permission-safe)
- [ ] Logging (auth, mutations, AI, failures, denials)
- [ ] Seed data validation (10k+ notes, orgs, users, tags, files)

---

## Agent Execution Log & Reasoning

### Planning & Work Split

- Defined all core features and infra as checklist items (see above).
- Split work across agents: Backend (schema, auth, RLS), Notes (CRUD, versioning, search), Features (upload, AI), Infra (logging, seed, deploy), Review (testing, docs).
- Parallelized backend and frontend setup; features and infra in parallel after auth/orgs.

### Key Actions & Decisions

- Chose Next.js 16, Supabase, Drizzle, TypeScript for full-stack and multi-tenant support.
- Enforced Next.js 15+ agent rules to avoid deprecated APIs.
- Used tsconfig paths alias (@) for all internal imports to resolve Turbopack build issues.
- Implemented granular commit history with atomic commits for each feature/fix.
- Prioritized security: RLS policies, permission checks, org isolation, logging of denials.
- Seeded DB with 10k+ notes, multiple orgs/users/tags/files for realistic scale.
- Dockerized app and validated Railway deployment.

### Pivots & Interventions

- Switched from free to paid Copilot due to rate limits.
- Manually enforced agent rules when LLMs suggested outdated patterns.
- Refactored all imports to use alias after module resolution bugs.
- Registered all bugs and fixes in BUGS.md with commit refs.

### Next Steps

- Finalize and review all documentation files.
- Implement and run automated tests for all critical flows.
- Review commit history for clarity and completeness.

---

## Observations & History

- All core features and infra are implemented and functional.
- Remaining work: finalize documentation, review commit history, and implement automated tests for critical flows.
- See previous sections for detailed agent actions, parallelization, and review notes.

# REVIEW.md

## What Was Reviewed Deeply

- **Multi-tenant isolation:** orgId enforcement across all queries, role-based permissions (owner/admin/member)
- **Authentication flow:** Supabase auth with middleware, organization switching, and session management
- **CRUD operations:** Create, read, update, and delete notes with validation and permission checks
- **Versioning system:** Full snapshots, version tracking, and diffs via API
- **Search functionality:** Server-side search with pagination and title/content/tag filters
- **File upload:** Supabase Storage integration, org-level isolation
- **AI summaries:** OpenAI integration with accept/reject workflow and permission checks
- **Logging:** Structured logs with Pino for auth, mutations, AI requests, and permission denials
- **Database schema:** Relationships, constraints, and indexing for performance
- **Security:** Input validation, SQL injection prevention, permission enforcement

## What Was Sampled

- **UI responsiveness:** Dashboard layout, forms, error handling
- **API performance:** Query efficiency, pagination implementation
- **Seed data quality:** Realistic data distribution, edge cases
- **Build process:** Docker containerization, Railway deployment readiness
- **Error handling:** API error responses, logging coverage

## What I Distrusted Most

- **AI prompt security:** Potential prompt injection attacks - implemented strict input validation
- **File upload paths:** Path traversal vulnerabilities - enforced org-based storage paths
- **Multi-tenant data leakage:** Complex queries with joins - added explicit org_id filters everywhere
- **Concurrent edits:** Version conflicts - implemented atomic updates with proper error handling
- **Search performance:** With 10k+ notes - optimized with proper indexing and pagination

## What I'd Review Next With More Time

- **Load testing:** Performance with 10k+ concurrent users and query optimization
- **E2E testing:** Cypress/Playwright for critical user journeys
- **Accessibility audit:** WCAG compliance, screen reader support
- **Security penetration testing:** OWASP top 10, API fuzzing
- **Database performance:** Query plans, connection pooling, read replicas
- **CDN integration:** File delivery optimization, caching strategies
- **Monitoring setup:** Application metrics, alerting, error tracking
- **Backup/recovery:** Data durability, disaster recovery procedures

## Recent Reliability Improvements (2026-04-17)

- Added canonical Docker test entrypoints for reviewer reproducibility:
  - `npm run test:notes:docker:full`
  - `npm run test:docker:full`
- Hardened full Docker suite with increased Vitest hook/test timeouts to avoid false negatives in integration setup.
- Standardized Docker dev runtime to port `3000` and validated containerized app response.
- Migrated production image to multi-stage + standalone runtime and validated build/startup behavior.

## Architecture Governance Improvement (2026-04-17)

- Added explicit architecture baseline document (`ARCHITECTURE.md`) to reduce organizational drift.
- Defined layering boundaries and core invariants for tenant-safe behavior.
- Added decision workflow tying architecture-impacting changes to audit files and README discoverability.

## Modularization Risk Control Update (2026-04-17)

- Notes detail and versions API handlers were converted to thin adapters calling module application services.
- Lint boundary guards now cover all modularized notes handlers to prevent direct DB coupling regressions.
- Refactor safety was verified with successful production build after strict TypeScript validation.

## Notes Component Completion Update (2026-04-17)

- Notes summarize endpoint now follows the same module-driven application pattern as other Notes handlers.
- Notes API handlers are consistently thin adapters with business logic centralized in module application services.
- Lint guardrails now cover all modularized Notes handlers to prevent coupling regression.

## Fitness Quality Gate Update (2026-04-17)

- Added coverage fitness gate calibrated to a practical baseline (60%) with env override (`MIN_TEST_COVERAGE`) for progressive hardening.
- Added focused helper unit tests (`utils` and `logger`) to raise baseline coverage without introducing API behavior risk.
- Hardened fitness CI workflow by adding explicit dependency installation (`npm ci`) before fitness build/run steps.

## Build Reliability Update (2026-04-17)

- Reviewed production Docker build failure mode caused by missing `NEXT_PUBLIC_SUPABASE_*` at build time.
- Added builder-stage env injection in `Dockerfile` so Next.js env validation does not fail during route/page data collection.
- Documented explicit `--build-arg` usage in README for CI/CD parity across environments.

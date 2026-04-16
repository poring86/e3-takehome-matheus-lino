# REVIEW.md

## What Was Reviewed Deeply
- Authentication and authorization logic
- RLS policies for tenant isolation
- Permission enforcement across all features
- Security of AI and file upload features
- Database schema and relationships

## What Was Sampled
- UI components for usability
- Search functionality with test data
- Version diffs and tracking
- Logging output

## What I Distrusted Most
- AI-generated summaries for potential security issues (prompt injection)
- File upload handling for path traversal
- Search queries for SQL injection or data leakage
- Multi-tenancy isolation in complex queries

## What I'd Review Next With More Time
- Performance under load (10k+ notes)
- Edge cases in versioning (concurrent edits)
- Accessibility and mobile responsiveness
- Integration tests for end-to-end flows
- Security audit for OWASP top 10
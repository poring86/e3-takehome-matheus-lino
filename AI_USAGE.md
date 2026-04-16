# AI_USAGE.md

## Agents Used
- Main Agent: GitHub Copilot (Grok Code Fast 1) - Overall coordination, planning, review
- Sub-agent 1: Backend Setup Agent - DB schema, auth, RLS policies
- Sub-agent 2: Frontend Auth Agent - Auth UI, org management
- Sub-agent 3: Notes Agent - CRUD, versioning, search
- Sub-agent 4: Features Agent - File upload, AI summaries
- Sub-agent 5: Infra Agent - Logging, deployment, seed data

## Work Split
- Parallel execution where possible: Backend and Frontend agents started simultaneously
- Sequential for dependent parts: Backend first, then frontend, then features

## Parallel Usage
- Agents 1 and 2 ran in parallel initially
- Agents 3 and 4 after auth/orgs were set up
- Agent 5 throughout for logging and infra

## Agent Errors and Interventions
- [List any errors or where agents were wrong]
- Interventions: [Where I intervened]

## What I Don't Trust Agents To Do
- Security-critical code (auth, permissions) - Always review deeply
- Complex business logic - Sample and test
- Deployment configs - Verify manually
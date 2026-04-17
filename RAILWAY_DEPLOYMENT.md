# Railway Deployment Guide

## Prerequisites

- Railway account
- Supabase project with database
- OpenAI API key

## Environment Variables

Set these in Railway project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_key
LOG_LEVEL=info
```

## Deployment Steps

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Dockerfile
3. Set environment variables
4. Deploy

## Post-Deployment

1. Run database migrations:

   ```bash
   npx drizzle-kit migrate
   ```

2. Execute RLS policies in Supabase SQL Editor:
   - Copy contents of `supabase/migrations/0001_rls_policies.sql`
   - Run in Supabase SQL Editor

3. Seed the database:
   ```bash
   npm run db:seed
   ```

   If you need a full reset before seeding:
   ```bash
   npm run db:reset:seed
   ```

## Verification

- App should be accessible at Railway URL
- Users can sign up/login
- Multi-tenant isolation working
- Search scales to 10k+ notes
- All features functional

## Deployment Verification Record

Fill this section after production deployment to keep an auditable trail.

- Railway URL: `<set-after-deploy>`
- Deployment timestamp (UTC): `<set-after-deploy>`
- Health check:
   - Command: `curl -I https://<railway-url> | head -n 1`
   - Expected: `HTTP/2 200` (or `HTTP/1.1 200`)
   - Result: `<set-after-deploy>`
- Post-deploy smoke test:
   - Command: `npm run smoke:notes`
   - Expected: note create path succeeds (`201`)
   - Result: `<set-after-deploy>`

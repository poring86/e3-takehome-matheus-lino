#!/bin/sh
# Run TypeScript fitness functions with tsx
npx tsx src/fitness/check-docker-image-size.ts
npx tsx src/fitness/check-file-naming.ts
npx tsx src/fitness/check-test-coverage.ts

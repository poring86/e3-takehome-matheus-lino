#!/bin/sh
# Run TypeScript fitness functions with tsx
npx tsx src/fitness/checkDockerImageSize.ts
npx tsx src/fitness/checkApiResponseTime.ts
npx tsx src/fitness/checkTestCoverage.ts

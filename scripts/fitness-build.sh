#!/bin/sh
# Build TypeScript fitness functions to dist/fitness
mkdir -p dist/fitness
npx tsc src/fitness/checkDockerImageSize.ts --outDir dist/fitness
npx tsc src/fitness/checkApiResponseTime.ts --outDir dist/fitness

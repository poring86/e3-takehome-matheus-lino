# Fitness Functions

This folder contains automated fitness functions to continuously validate architectural and non-functional requirements.

- **checkDockerImageSize.ts**: Fails if the Docker image exceeds 400MB.
- **checkApiResponseTime.ts**: Fails if main API endpoints are too slow (>350ms).

To run locally:

```sh
bash scripts/fitness-build.sh
bash scripts/fitness-run.sh
```

These checks are also executed automatically in CI (see .github/workflows/fitness.yml).

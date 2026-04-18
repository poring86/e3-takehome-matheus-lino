# Fitness Functions

This folder contains automated fitness functions to continuously validate architectural and non-functional requirements.

- **check-docker-image-size.ts**: Fails if the Docker image exceeds 400MB.
- **check-file-naming.ts**: Fails if source/script filenames use camelCase or PascalCase (kebab-case/lowercase enforced in `src/`, `scripts/`, `tests/`).
- **check-test-coverage.ts**: Fails if overall test coverage is below the minimum threshold (default: 60%).
- **check-lint-strict.ts**: Fails if there are any lint errors or warnings.
- **check-bundle-size.ts**: Fails if the main frontend bundle exceeds 500KB gzipped.

Coverage threshold configuration:

- Set `MIN_TEST_COVERAGE` to override the default threshold.

To run locally:

```sh
bash scripts/fitness-build.sh
bash scripts/fitness-run.sh
```

These checks are also executed automatically in CI (see .github/workflows/fitness.yml).

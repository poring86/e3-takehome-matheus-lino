# Modules

This project uses component-based decomposition in a modular monolith style.

## Module shape

Each module should evolve toward this structure:

- `application/`: use cases and orchestration
- `domain/`: business rules and policies (framework-agnostic)
- `infrastructure/`: persistence and external adapters
- `index.ts`: public API surface for other layers/modules

## Dependency rules

- Route handlers in `src/app/api/**` should depend on module application APIs.
- Route handlers should not import DB clients or schema directly.
- Modules should expose public APIs and avoid deep, ad-hoc cross-module imports.
- Shared capabilities (auth, logging, config) live in shared module/kernel areas.

## Monolith with low coupling

The codebase remains a single deployable unit, but each business capability is isolated by:

- explicit module boundaries
- stable interfaces
- minimal shared mutable concerns
- dependency direction from outer layers to inner policies/use cases

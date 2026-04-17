/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies hide architecture drift and increase fragility.',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'api-handlers-no-direct-db-imports',
      severity: 'error',
      comment:
        'API handlers must use module services instead of direct DB/schema access.',
      from: {
        path: '^src/app/api/notes/',
      },
      to: {
        path: '^src/(lib/db|drizzle/schema)\\.ts$',
      },
    },
    {
      name: 'no-module-internal-imports-from-outside-modules',
      severity: 'error',
      comment:
        'Only module public APIs should be imported from outside src/modules.',
      from: {
        pathNot: '^src/modules/|^src/lib/notes/',
      },
      to: {
        path: '^src/modules/[^/]+/(application|domain|infrastructure)/',
      },
    },
  ],
  options: {
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '(\\.next|dist|coverage)',
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};

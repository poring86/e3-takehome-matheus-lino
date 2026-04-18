import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/api/**/route.ts"],
    rules: {
      // API handlers should call application services instead of querying DB directly.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/db",
              message:
                "Import application services from modules instead of DB access in route handlers.",
            },
            {
              name: "@/drizzle/schema",
              message:
                "Schema access belongs to module infrastructure/application layers, not route handlers.",
            },
          ],
        },
      ],
    },
  },
  {
    // Temporary exception while files API is not yet modularized.
    files: ["src/app/api/files/route.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

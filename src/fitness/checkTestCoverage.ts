// Fitness function: fail if test coverage is below threshold
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type CoverageMetric = { pct: number };
type CoverageSummary = {
  total: {
    statements: CoverageMetric;
    branches: CoverageMetric;
    functions: CoverageMetric;
    lines: CoverageMetric;
  };
};

const MIN_COVERAGE = Number(process.env.MIN_TEST_COVERAGE || 60); // percent
const summaryPath = join(process.cwd(), "coverage", "coverage-summary.json");

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

try {
  // Force json-summary output so CI can read deterministic coverage metrics.
  execSync(
    "npx vitest run --coverage --coverage.reporter=json-summary --coverage.reporter=text",
    { stdio: "inherit" },
  );

  if (!existsSync(summaryPath)) {
    throw new Error(`Coverage summary file not found: ${summaryPath}`);
  }

  const summary = JSON.parse(
    readFileSync(summaryPath, "utf8"),
  ) as CoverageSummary;

  const total = summary.total;
  const statements = total.statements.pct;
  const branches = total.branches.pct;
  const functions = total.functions.pct;
  const lines = total.lines.pct;

  const failed = [statements, branches, functions, lines].some(
    (pct) => pct < MIN_COVERAGE,
  );

  if (failed) {
    console.error(
      `FAIL: Test coverage below ${MIN_COVERAGE}% (statements: ${statements}%, branches: ${branches}%, functions: ${functions}%, lines: ${lines}%)`,
    );
    process.exit(1);
  }

  console.log(
    `PASS: Test coverage OK (statements: ${statements}%, branches: ${branches}%, functions: ${functions}%, lines: ${lines}%)`,
  );
} catch (error: unknown) {
  console.error("Could not check test coverage:", getErrorMessage(error));
  process.exit(2);
}

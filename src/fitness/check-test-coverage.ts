// Fitness function: fail if test coverage is below threshold
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const MIN_COVERAGE = Number(process.env.MIN_TEST_COVERAGE || 60); // percent
const coverageSummaryPath = path.resolve(
  process.cwd(),
  "coverage/coverage-summary.json",
);

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.test", override: true });

try {
  // Run coverage with explicit reporters so summary JSON is always produced.
  execSync("npx vitest run --coverage --coverage.reporter=text --coverage.reporter=json-summary", {
    stdio: "inherit",
  });

  if (!fs.existsSync(coverageSummaryPath)) {
    console.error(
      `FAIL: Coverage summary not found at ${coverageSummaryPath}.`,
    );
    process.exit(2);
  }

  const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, "utf-8"));
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
  } else {
    console.log(
      `PASS: Test coverage OK (statements: ${statements}%, branches: ${branches}%, functions: ${functions}%, lines: ${lines}%)`,
    );
  }
} catch (err: any) {
  console.error("Could not check test coverage:", err?.message || err);
  process.exit(2);
}

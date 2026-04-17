// Fitness function: fail if test coverage is below threshold
import { execSync } from 'child_process';

const MIN_COVERAGE = Number(process.env.MIN_TEST_COVERAGE || 60); // percent

try {
  // Run vitest coverage and get summary as JSON
  execSync('npx vitest run --coverage', { stdio: 'inherit' });
  const summary = require('../../coverage/coverage-summary.json');
  const total = summary.total;
  const statements = total.statements.pct;
  const branches = total.branches.pct;
  const functions = total.functions.pct;
  const lines = total.lines.pct;

  const failed = [statements, branches, functions, lines].some((pct) => pct < MIN_COVERAGE);
  if (failed) {
    console.error(`FAIL: Test coverage below ${MIN_COVERAGE}% (statements: ${statements}%, branches: ${branches}%, functions: ${functions}%, lines: ${lines}%)`);
    process.exit(1);
  } else {
    console.log(`PASS: Test coverage OK (statements: ${statements}%, branches: ${branches}%, functions: ${functions}%, lines: ${lines}%)`);
  }
} catch (err: any) {
  console.error('Could not check test coverage:', err.message);
  process.exit(2);
}

// Fitness function: fail if there are any lint errors or warnings
import { execSync } from "child_process";

try {
  execSync("npm run lint", { stdio: "pipe" });
  console.log("PASS: Lint passed with no errors or warnings.");
} catch (err: any) {
  const output = err.stdout?.toString() || err.message;
  console.error("FAIL: Lint errors or warnings detected:\n" + output);
  process.exit(1);
}

// Fitness function: fail if there are any lint errors or warnings
import { execSync } from "child_process";

try {
  execSync("npm run lint", { stdio: "pipe" });
  console.log("PASS: Lint passed with no errors or warnings.");
} catch (err: unknown) {
  let output = "";
  if (
    err &&
    typeof err === "object" &&
    "stdout" in err &&
    typeof (err as { stdout?: unknown }).stdout === "object" &&
    (err as { stdout?: unknown }).stdout &&
    typeof (err as { stdout: { toString: () => string } }).stdout.toString === "function"
  ) {
    output = (err as { stdout: { toString: () => string } }).stdout.toString();
  } else if (err instanceof Error) {
    output = err.message;
  } else {
    output = String(err);
  }
  console.error("FAIL: Lint errors or warnings detected:\n" + output);
  process.exit(1);
}

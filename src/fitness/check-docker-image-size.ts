// Fitness function: fail if Docker image exceeds 400MB
import { execSync } from "child_process";

const IMAGE = process.env.IMAGE_NAME || "e3-takehome-check:latest";
const MAX_SIZE_MB = 400;

try {
  const output = execSync(`docker image inspect ${IMAGE} --format='{{.Size}}'`)
    .toString()
    .trim();
  const sizeBytes = parseInt(output, 10);
  const sizeMB = sizeBytes / (1024 * 1024);
  if (sizeMB > MAX_SIZE_MB) {
    console.error(
      `FAIL: Docker image ${IMAGE} is ${sizeMB.toFixed(1)}MB (limit: ${MAX_SIZE_MB}MB)`,
    );
    process.exit(1);
  } else {
    console.log(
      `PASS: Docker image ${IMAGE} is ${sizeMB.toFixed(1)}MB (limit: ${MAX_SIZE_MB}MB)`,
    );
  }
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Could not inspect Docker image:", msg);
  process.exit(2);
}

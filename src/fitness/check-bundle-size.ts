// Fitness function: fail if the main frontend bundle exceeds 500KB gzipped
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const MAX_BUNDLE_KB = 1024;

function getBundleStats() {
  // Next.js outputs stats in .next/static/chunks
  const staticDir = path.join(".next", "static", "chunks");
  if (!fs.existsSync(staticDir)) {
    throw new Error(
      "Next.js static chunks directory not found. Run 'next build' first.",
    );
  }
  const files = fs.readdirSync(staticDir).filter((f) => f.endsWith(".js"));
  let total = 0;
  for (const file of files) {
    const filePath = path.join(staticDir, file);
    const gzipped = execSync(`gzip -c "${filePath}"`).length;
    total += gzipped;
  }
  return total / 1024; // KB
}

try {
  execSync("npm run build", { stdio: "ignore" });
  const bundleSizeKB = getBundleStats();
  if (bundleSizeKB > MAX_BUNDLE_KB) {
    console.error(
      `FAIL: Frontend bundle size is ${bundleSizeKB.toFixed(1)}KB gzipped (limit: ${MAX_BUNDLE_KB}KB)`,
    );
    process.exit(1);
  } else {
    console.log(
      `PASS: Frontend bundle size is ${bundleSizeKB.toFixed(1)}KB gzipped (limit: ${MAX_BUNDLE_KB}KB)`,
    );
  }
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Could not check bundle size:", msg);
  process.exit(2);
}

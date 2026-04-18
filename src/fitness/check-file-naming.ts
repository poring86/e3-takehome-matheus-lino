import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const CHECKED_DIRECTORIES = ["src/", "scripts/", "tests/"];
const CHECKED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".sh"]);
const ALLOWED_NAME_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function isWithinCheckedDirectories(filePath: string): boolean {
  return CHECKED_DIRECTORIES.some((dir) => filePath.startsWith(dir));
}

function isCheckedExtension(filePath: string): boolean {
  if (filePath.endsWith(".d.ts")) {
    return false;
  }

  return CHECKED_EXTENSIONS.has(path.extname(filePath));
}

function getFileStem(filePath: string): string {
  const baseName = path.basename(filePath);
  const extension = path.extname(baseName);
  return baseName.slice(0, Math.max(0, baseName.length - extension.length));
}

function getTrackedFiles(): string[] {
  const output = execSync("git ls-files --cached --others --exclude-standard", {
    encoding: "utf-8",
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function findViolations(files: string[]): string[] {
  return files
    .filter((filePath) => fs.existsSync(filePath))
    .filter((filePath) => isWithinCheckedDirectories(filePath))
    .filter((filePath) => isCheckedExtension(filePath))
    .filter((filePath) => !ALLOWED_NAME_PATTERN.test(getFileStem(filePath)))
    .sort((a, b) => a.localeCompare(b));
}

try {
  const trackedFiles = getTrackedFiles();
  const violations = findViolations(trackedFiles);

  if (violations.length > 0) {
    console.error("FAIL: Non-kebab-case filenames detected in source/script scope.");
    console.error("Rename these files to lowercase/kebab-case (camelCase and PascalCase are not allowed):");
    for (const file of violations) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }

  console.log("PASS: File naming convention check passed (kebab-case/lowercase).\nChecked: src/, scripts/, tests/");
} catch (error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("Could not check file naming convention:", msg);
  process.exit(2);
}

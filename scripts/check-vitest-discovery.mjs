import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoots = ["apps", "packages"];

function normalizedAbsolute(filePath) {
  const normalized = path.resolve(filePath).replaceAll("\\", "/");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function collectTestFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist" || entry.name === "coverage") continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(absolutePath));
      continue;
    }
    if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) files.push(normalizedAbsolute(absolutePath));
  }
  return files;
}

function packageDirectories() {
  return packageRoots.flatMap((relativeRoot) => {
    const absoluteRoot = path.join(rootDir, relativeRoot);
    if (!existsSync(absoluteRoot)) return [];
    return readdirSync(absoluteRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(path.join(absoluteRoot, entry.name, "package.json")))
      .map((entry) => path.join(absoluteRoot, entry.name));
  });
}

function listedTestFiles(packageDirectory) {
  const vitestEntrypoint = path.join(rootDir, "node_modules", "vitest", "vitest.mjs");
  const output = execFileSync(process.execPath, [vitestEntrypoint, "list", "--staticParse", "--json"], {
    cwd: packageDirectory,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"]
  });
  const registrations = JSON.parse(output);
  return new Set(registrations.map((registration) => normalizedAbsolute(registration.file)));
}

const failures = [];
for (const packageDirectory of packageDirectories()) {
  const packageJson = JSON.parse(readFileSync(path.join(packageDirectory, "package.json"), "utf8"));
  if (!packageJson.scripts?.test?.includes("vitest")) continue;

  const physicalFiles = collectTestFiles(packageDirectory);
  const collectedFiles = listedTestFiles(packageDirectory);
  const missing = physicalFiles.filter((file) => !collectedFiles.has(file));
  if (missing.length > 0) {
    failures.push({
      packageName: packageJson.name,
      missing: missing.map((file) => path.relative(rootDir, file).replaceAll("\\", "/"))
    });
  }
}

if (failures.length > 0) {
  console.error("Vitest discovery missed physical test files:");
  for (const failure of failures) {
    console.error(`- ${failure.packageName}`);
    for (const file of failure.missing) console.error(`  - ${file}`);
  }
  process.exitCode = 1;
} else {
  console.log("Vitest discovery covers every physical package test file.");
}

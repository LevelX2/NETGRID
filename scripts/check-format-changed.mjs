#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * @contract Checks only files changed against a chosen Git base plus local
 * staged, working-tree and untracked files that Prettier can parse.
 * @authority This is a scoped package gate; repo-wide format baseline remains a
 * separate decision.
 * @visibility Emits file paths only, never file contents.
 */
const repoRoot = process.cwd();
const options = parseArgs(process.argv.slice(2));
if (options.selfTest) {
  runSelfTest();
  process.exit(0);
}

const baseRef = options.baseRef;
const prettierExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".scss",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const files = unique([
  ...gitLines([
    "diff",
    "--name-only",
    "--diff-filter=ACMRTUXB",
    `${baseRef}...HEAD`,
  ]),
  ...gitLines(["diff", "--name-only", "--diff-filter=ACMRTUXB", "--cached"]),
  ...gitLines(["diff", "--name-only", "--diff-filter=ACMRTUXB"]),
  ...gitLines(["ls-files", "--others", "--exclude-standard"]),
]).filter(isPrettierSupportedFile);

warnIfTrivialBaseRef(baseRef);

if (files.length === 0) {
  console.log(
    `FORMAT_CHANGED OK base=${baseRef} files=0 reason=no-prettier-supported-changes`,
  );
  process.exit(0);
}

const prettier = prettierBinary();
console.log(`FORMAT_CHANGED checking base=${baseRef} files=${files.length}`);
if (options.list) {
  console.log("FORMAT_CHANGED files:");
  for (const file of files) console.log(`- ${file}`);
}

const result = spawnSync(
  prettier.command,
  [...prettier.args, "--check", "--", ...files],
  {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
  },
);

if (result.error) {
  console.error(
    `FORMAT_CHANGED failed to start prettier: ${result.error.message}`,
  );
  process.exit(1);
}
process.exit(result.status ?? 1);

function parseArgs(rawArgs) {
  const parsed = {
    baseRef: "main",
    list: false,
    selfTest: false,
  };
  const positional = [];
  for (const arg of rawArgs) {
    if (arg === "--") continue;
    if (arg === "--list") {
      parsed.list = true;
      continue;
    }
    if (arg === "--self-test") {
      parsed.selfTest = true;
      continue;
    }
    positional.push(arg);
  }
  if (positional[0]) parsed.baseRef = positional[0];
  return parsed;
}

function gitLines(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`FORMAT_CHANGED git ${args.join(" ")} failed.`);
    if (result.stderr.trim()) console.error(result.stderr.trim());
    process.exit(result.status ?? 1);
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitText(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) return undefined;
  return result.stdout.trim();
}

function hasLocalVersionedChanges() {
  return (
    gitLines(["diff", "--name-only", "--cached"]).length > 0 ||
    gitLines(["diff", "--name-only"]).length > 0
  );
}

function warnIfTrivialBaseRef(ref) {
  const refCommit = gitText(["rev-parse", "--verify", ref]);
  const headCommit = gitText(["rev-parse", "--verify", "HEAD"]);
  if (!refCommit || !headCommit) return;
  if (refCommit !== headCommit) return;
  if (hasLocalVersionedChanges()) return;
  console.warn(
    `FORMAT_CHANGED WARN base=${ref} matches HEAD and no staged/working-tree versioned changes exist; use origin/main for final main integration checks.`,
  );
}

function isPrettierSupportedFile(file) {
  if (file.startsWith("packages/engine/src/game/engine-runtime-internal/"))
    return false;
  const absolute = path.join(repoRoot, file);
  if (!fs.existsSync(absolute)) return false;
  if (!fs.statSync(absolute).isFile()) return false;
  return prettierExtensions.has(path.extname(file).toLowerCase());
}

function prettierBinary() {
  const localCli = path.join(
    repoRoot,
    "node_modules",
    "prettier",
    "bin",
    "prettier.cjs",
  );
  if (fs.existsSync(localCli))
    return { command: process.execPath, args: [localCli] };
  return { command: "prettier", args: [] };
}

function unique(values) {
  return [...new Set(values)].sort();
}

function runSelfTest() {
  const cases = [
    {
      args: ["--", "origin/main", "--list"],
      expected: { baseRef: "origin/main", list: true, selfTest: false },
    },
    {
      args: ["main"],
      expected: { baseRef: "main", list: false, selfTest: false },
    },
    {
      args: ["--self-test"],
      expected: { baseRef: "main", list: false, selfTest: true },
    },
  ];
  for (const testCase of cases) {
    const actual = parseArgs(testCase.args);
    if (JSON.stringify(actual) !== JSON.stringify(testCase.expected)) {
      console.error(
        `FORMAT_CHANGED self-test failed args=${JSON.stringify(testCase.args)} actual=${JSON.stringify(actual)} expected=${JSON.stringify(testCase.expected)}`,
      );
      process.exit(1);
    }
  }
  console.log("FORMAT_CHANGED self-test OK");
}

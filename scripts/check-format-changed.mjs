#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const baseRef = args[0] ?? "main";
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
]).filter(isPrettierSupportedFile);

if (files.length === 0) {
  console.log(
    `FORMAT_CHANGED OK base=${baseRef} files=0 reason=no-prettier-supported-changes`,
  );
  process.exit(0);
}

const prettier = prettierBinary();
console.log(`FORMAT_CHANGED checking base=${baseRef} files=${files.length}`);
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

function isPrettierSupportedFile(file) {
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

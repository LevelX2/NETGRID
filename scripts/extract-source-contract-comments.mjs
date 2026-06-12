#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const contractTags = [
  "@contract",
  "@authority",
  "@visibility",
  "@mvpBoundary",
  "@aiProjection",
];
const sourceExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const skippedDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
]);

const options = parseArgs(process.argv.slice(2));
const files = collectSourceFiles(options.roots);
const comments = files.flatMap(extractContractComments);
const tagCounts = countTags(comments);

if (options.writeReport) {
  const reportPath = path.join(repoRoot, options.reportPath);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdownReport(comments, tagCounts));
  formatReportWithPrettier(reportPath);
}

if (options.json) {
  console.log(
    JSON.stringify(
      {
        generatedBy: "scripts/extract-source-contract-comments.mjs",
        scope: options.roots,
        reportPath: options.writeReport ? options.reportPath : undefined,
        comments,
        tagCounts,
      },
      null,
      2,
    ),
  );
} else {
  console.log(
    [
      `SOURCE_CONTRACT_COMMENTS OK comments=${comments.length}`,
      ...contractTags.map((tag) => `${tag}=${tagCounts[tag] ?? 0}`),
      options.writeReport ? `report=${options.reportPath}` : undefined,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function parseArgs(args) {
  const parsed = {
    json: false,
    reportPath:
      "docs/reviews/architecture/source-contract-comments-2026-06-12.md",
    roots: ["packages", "scripts"],
    writeReport: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg === "--write-report") {
      parsed.writeReport = true;
      continue;
    }
    if (arg === "--report") {
      const value = args[index + 1];
      if (!value) fail("--report requires a path");
      parsed.reportPath = normalizeRepoRelativePath(value);
      index += 1;
      continue;
    }
    if (arg === "--root") {
      const value = args[index + 1];
      if (!value) fail("--root requires a path");
      parsed.roots.push(normalizeRepoRelativePath(value));
      index += 1;
      continue;
    }
    fail(`Unknown argument: ${arg}`);
  }

  parsed.roots = unique(parsed.roots.map(normalizeRepoRelativePath));
  return parsed;
}

function collectSourceFiles(roots) {
  return roots
    .flatMap((root) => walk(path.join(repoRoot, root)))
    .map((absolutePath) => path.relative(repoRoot, absolutePath))
    .map(toPosixPath)
    .sort();
}

function walk(absoluteRoot) {
  if (!fs.existsSync(absoluteRoot)) return [];
  const stat = fs.statSync(absoluteRoot);
  if (stat.isFile()) {
    return isSourceFile(absoluteRoot) ? [absoluteRoot] : [];
  }
  if (!stat.isDirectory()) return [];

  const files = [];
  for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const absolutePath = path.join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
      continue;
    }
    if (entry.isFile() && isSourceFile(absolutePath)) files.push(absolutePath);
  }
  return files;
}

function isSourceFile(absolutePath) {
  return sourceExtensions.has(path.extname(absolutePath).toLowerCase());
}

function extractContractComments(file) {
  const absolutePath = path.join(repoRoot, file);
  const source = fs.readFileSync(absolutePath, "utf8");
  const comments = [];
  const pattern = /\/\*\*[\s\S]*?\*\//g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const lines = normalizeCommentLines(match[0]);
    const entries = parseTagEntries(lines);
    const relevantEntries = entries.filter((entry) =>
      contractTags.includes(entry.tag),
    );
    if (relevantEntries.length === 0) continue;
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    comments.push({
      file,
      line,
      tags: relevantEntries.map((entry) => entry.tag),
      summary: summarizeEntries(relevantEntries),
    });
  }

  return comments;
}

function normalizeCommentLines(comment) {
  return comment
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*\/\*\*?/, "")
        .replace(/\*\/\s*$/, "")
        .replace(/^\s*\*\s?/, "")
        .trim(),
    )
    .filter(Boolean);
}

function parseTagEntries(lines) {
  const entries = [];
  let current;

  for (const line of lines) {
    const tagMatch = line.match(/^(@[A-Za-z][A-Za-z0-9]*)(?:\s+(.*))?$/);
    if (tagMatch) {
      current = {
        tag: tagMatch[1],
        text: tagMatch[2] ?? "",
      };
      entries.push(current);
      continue;
    }
    if (current) current.text = `${current.text} ${line}`.trim();
  }

  return entries;
}

function summarizeEntries(entries) {
  return entries
    .map((entry) => `${entry.tag}: ${entry.text}`.trim())
    .join(" | ");
}

function countTags(comments) {
  const counts = Object.fromEntries(contractTags.map((tag) => [tag, 0]));
  for (const comment of comments) {
    for (const tag of comment.tags) counts[tag] += 1;
  }
  return counts;
}

function renderMarkdownReport(comments, tagCounts) {
  const lines = [
    "# Source Contract Comments 2026-06-12",
    "",
    "Generated by `node scripts/extract-source-contract-comments.mjs --write-report`.",
    "",
    "## Scope",
    "",
    "- Scans source roots `packages/` and `scripts/` for JSDoc contract tags.",
    "- Extracts `@contract`, `@authority`, `@visibility`, `@mvpBoundary` and `@aiProjection`.",
    "- Review artifact only: no runtime consumer, no planner recommendation and no scoring recommendation.",
    "",
    "## Summary",
    "",
    `- Comments: ${comments.length}`,
    ...contractTags.map((tag) => `- \`${tag}\`: ${tagCounts[tag] ?? 0}`),
    "",
    "## Comments",
    "",
    "| Source | Tags | Summary |",
    "| --- | --- | --- |",
    ...comments.map(
      (comment) =>
        `| \`${comment.file}:${comment.line}\` | ${comment.tags
          .map((tag) => `\`${tag}\``)
          .join(", ")} | ${escapeMarkdownTableCell(comment.summary)} |`,
    ),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function escapeMarkdownTableCell(value) {
  return value.replaceAll("|", "\\|");
}

function formatReportWithPrettier(reportPath) {
  const localCli = path.join(
    repoRoot,
    "node_modules",
    "prettier",
    "bin",
    "prettier.cjs",
  );
  const command = fs.existsSync(localCli) ? process.execPath : "prettier";
  const args = fs.existsSync(localCli)
    ? [localCli, "--write", reportPath]
    : ["--write", reportPath];
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.status === 0) return;
  if (result.stderr.trim()) console.error(result.stderr.trim());
  fail(`prettier failed for ${path.relative(repoRoot, reportPath)}`);
}

function normalizeRepoRelativePath(value) {
  return toPosixPath(path.normalize(value)).replace(/^(\.\.\/)+/, "");
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function unique(values) {
  return [...new Set(values)];
}

function fail(message) {
  console.error(`SOURCE_CONTRACT_COMMENTS failed: ${message}`);
  process.exit(1);
}

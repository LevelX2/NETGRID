import { execFileSync } from "node:child_process";
import fs from "node:fs";

const schemaPath = "packages/ai/src/action-semantic-candidate.ts";
const mdPath = "docs/reviews/ai/ai035-action-semantic-candidate-schema-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai035-action-semantic-candidate-schema-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI035 check failed: ${message}`);
  process.exit(1);
}

function changedFiles() {
  const names = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
  ]) {
    const output = execFileSync("git", args, { encoding: "utf8" }).trim();
    if (!output) continue;
    for (const line of output.split(/\r?\n/)) names.add(line.trim());
  }
  return [...names].filter(Boolean).sort();
}

const schema = read(schemaPath);
const md = read(mdPath);
const report = JSON.parse(read(jsonPath));

if (report.step !== "AI035") fail("JSON step must be AI035");
if (report.schemaFile !== schemaPath) fail("schemaFile points at the wrong file");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredText of [
  "export type ActionSemanticCandidate",
  "export type ActionGateResult",
  "ACTION_SEMANTIC_CANDIDATE_SCHEMA_VERSION",
]) {
  if (!schema.includes(requiredText)) fail(`Schema missing ${requiredText}`);
}

for (const requiredField of report.candidateRequiredFields) {
  if (!schema.includes(`${requiredField}:`) && !schema.includes(`${requiredField}?:`)) {
    fail(`ActionSemanticCandidate missing field ${requiredField}`);
  }
}

for (const requiredStatus of report.projectionStatuses) {
  if (!schema.includes(`"${requiredStatus}"`)) fail(`Schema missing projection status ${requiredStatus}`);
}

for (const requiredIssue of report.projectionIssues) {
  if (!schema.includes(`"${requiredIssue}"`)) fail(`Schema missing projection issue ${requiredIssue}`);
}

for (const requiredGate of report.gateIds) {
  if (!schema.includes(`"${requiredGate}"`)) fail(`Schema missing gate id ${requiredGate}`);
}

for (const requiredText of [
  "keine Action-Auswahl",
  "kein Scoring",
  "keine Planner- oder Runtime-Anbindung",
  "Alle No-Effect-Flags bleiben `false`",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

const forbiddenRuntimeFiles = [
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
  "packages/engine/src/game/legal-actions.ts",
  "packages/shared/src/index.ts",
];

for (const file of forbiddenRuntimeFiles) {
  if (read(file).includes("action-semantic-candidate")) {
    fail(`Runtime/decision file imports action-semantic-candidate: ${file}`);
  }
}

if (/\b(choose|rank|score|select)\w*\s*\(/.test(schema)) {
  fail("Schema file must not define choose/rank/score/select functions");
}

const allowedChangedFiles = [
  schemaPath,
  mdPath,
  jsonPath,
  "docs/reviews/ai/action-semantics-bridge-progress-2026-06-04.json",
  "scripts/check-ai035-action-semantic-candidate-schema.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI035: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI035_ACTION_SEMANTIC_CANDIDATE_SCHEMA OK fields=${report.candidateRequiredFields.length} gates=${report.gateIds.length}`,
);

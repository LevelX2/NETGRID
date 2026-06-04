import { execFileSync } from "node:child_process";
import fs from "node:fs";

const schemaPath = "packages/ai/src/action-semantic-candidate.ts";
const testPath = "packages/ai/src/action-semantic-candidate.test.ts";
const mdPath = "docs/reviews/ai/ai039-target-context-projection-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai039-target-context-projection-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI039 check failed: ${message}`);
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
const testSource = read(testPath);
const md = read(mdPath);
const report = JSON.parse(read(jsonPath));

if (report.step !== "AI039") fail("JSON step must be AI039");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");
if (report.metrics.selectedTargetsProjected !== 1) fail("selectedTargetsProjected must be 1");
if (report.metrics.availableTargetsProjected !== 1) fail("availableTargetsProjected must be 1");
if (report.metrics.hiddenInfoBlocked !== 1) fail("hiddenInfoBlocked must be 1");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredText of [
  "selectedTargetsByActionId",
  "availableTargetsByActionId",
  "function applyTargetContextProjection",
  "function targetContextForAction",
  '"engine_provided"',
  '"target_context_unavailable"',
  '"hidden_info_blocked"',
]) {
  if (!schema.includes(requiredText)) fail(`Schema missing ${requiredText}`);
}

for (const forbiddenText of [
  "GameState",
  "PlayerView",
  "getLegalActions",
  "servers.find",
  "cardInstances",
  "fullGameState",
]) {
  if (schema.includes(forbiddenText)) fail(`AI039 builder must not reconstruct targets via ${forbiddenText}`);
}

for (const requiredText of [
  "projects target context only from selected or engine-provided targets",
  "selectedTargetsByActionId",
  "availableTargetsByActionId",
  "target_context_unavailable",
  "hidden_info_blocked",
]) {
  if (!testSource.includes(requiredText)) fail(`Test missing ${requiredText}`);
}

for (const requiredText of [
  "rekonstruiert keine Zieloptionen",
  "keine Ziel-ID-Projektion",
  "bewertet keine Ziele",
  "wählt kein Ziel",
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

const allowedChangedFiles = [
  schemaPath,
  testPath,
  mdPath,
  jsonPath,
  "docs/reviews/ai/action-semantics-bridge-progress-2026-06-04.json",
  "scripts/check-ai039-target-context-projection.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI039: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI039_TARGET_CONTEXT_PROJECTION OK selected=${report.metrics.selectedTargetsProjected} available=${report.metrics.availableTargetsProjected} hiddenBlocked=${report.metrics.hiddenInfoBlocked}`,
);

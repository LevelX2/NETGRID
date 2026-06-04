import { execFileSync } from "node:child_process";
import fs from "node:fs";

const schemaPath = "packages/ai/src/action-semantic-candidate.ts";
const testPath = "packages/ai/src/action-semantic-candidate.test.ts";
const mdPath = "docs/reviews/ai/ai040-action-cost-timing-profiles-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai040-action-cost-timing-profiles-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI040 check failed: ${message}`);
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

if (report.step !== "AI040") fail("JSON step must be AI040");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");
if (report.metrics.costProfileProjected !== 3) fail("costProfileProjected must be 3");
if (report.metrics.timingProfileProjected !== 3) fail("timingProfileProjected must be 3");
if (report.metrics.variableCostProfiles !== 1) fail("variableCostProfiles must be 1");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredText of [
  "function applyCostAndTimingProfiles",
  "function costProfileForAction",
  "function timingProfileForAction",
  "function variableCostForAction",
  '"cost_unknown"',
  '"timing_unknown"',
]) {
  if (!schema.includes(requiredText)) fail(`Schema missing ${requiredText}`);
}

for (const forbiddenFunction of [
  "chooseSemanticAiAction(",
  "scoreSemantic",
  "rankSemantic",
  "selectSemantic",
]) {
  if (schema.includes(forbiddenFunction)) fail(`AI040 must not define ${forbiddenFunction}`);
}

for (const requiredText of [
  "normalizes action cost and timing profiles without scoring",
  "clickCost: 1",
  "variableCost",
  "encounterPhase",
  "not_applicable",
]) {
  if (!testSource.includes(requiredText)) fail(`Test missing ${requiredText}`);
}

for (const requiredText of [
  "keine Kostenbewertung",
  "kein Ranking",
  "keine Planner-Gewichtung",
  "wählt keine Aktion",
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
  "scripts/check-ai040-action-cost-timing-profiles.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI040: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI040_ACTION_COST_TIMING_PROFILES OK cost=${report.metrics.costProfileProjected} timing=${report.metrics.timingProfileProjected}`,
);

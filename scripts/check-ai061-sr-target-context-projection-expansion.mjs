import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai061-sr-target-context-projection-expansion-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai061-sr-target-context-projection-expansion-2026-06-04.json";
const codePath = "packages/ai/src/shadow-readiness-expansion.ts";
const testPath = "packages/ai/src/shadow-readiness-expansion.test.ts";
const progressPath =
  "docs/reviews/ai/shadow-readiness-expansion-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI061-SR check failed: ${message}`);
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

const md = read(mdPath);
const report = JSON.parse(read(jsonPath));
const code = read(codePath);
const test = read(testPath);
const progress = JSON.parse(read(progressPath));

if (report.step !== "AI061-SR") fail("JSON step must be AI061-SR");
if (
  report.schemaVersion !==
  "ai061-sr-target-context-projection-expansion-v1"
) {
  fail("schemaVersion mismatch");
}
if (report.targetContextGapBefore !== 13) fail("before gap must be 13");
if (report.targetContextGapAfter !== 0) fail("after gap must be 0");
if (report.projectedTargetContextCount !== 13)
  fail("projected target context count must be 13");
if (report.hiddenInfoGuardedTargetContextNotProjectedCount !== 1) {
  fail("hidden-info guarded target context count must be 1");
}
if (report.projectionPolicy.hiddenInfoProjectionAllowed !== false) {
  fail("hidden-info projection must be forbidden");
}
if (report.projectionPolicy.targetingAiAllowed !== false) {
  fail("targeting AI must be forbidden");
}
if (report.projectionPolicy.legalityGenerationAllowed !== false) {
  fail("legality generation must be forbidden");
}
if (report.batchAfterTargetContextExpansion.hardGateFailures !== 0) {
  fail("hard gate failures must be zero");
}
if (report.batchAfterTargetContextExpansion.actualDecisionOverrideCount !== 0) {
  fail("actual decision overrides must be zero");
}
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredCode of [
  "AI061_SR_TARGET_CONTEXT_EXPANSION_SCHEMA_VERSION",
  "AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS",
  "buildFixturesAfterTargetContextProjection",
  "buildAi061SrTargetContextProjectionExpansionReport",
  "hidden_info_guard_remains_blocked",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "createPlayerAction",
  "PlayerAction",
  "plannerWeight",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}

for (const runtimeFile of [
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
  "apps/server/src/multiplayer.ts",
  "apps/server/src/http-server.ts",
]) {
  if (read(runtimeFile).includes("shadow-readiness-expansion")) {
    fail(`runtime file imports shadow readiness expansion: ${runtimeFile}`);
  }
}

for (const requiredText of [
  "TargetContext Projection Expansion",
  "`target_context_unavailable` | 13 | 0",
  "Hidden-info guarded TargetContext not projected",
  "AI061-SR is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "projects only the side-safe target context gaps counted by AI058",
  "keeps hidden-info guarded target context unprojected",
  "does not reconstruct targets from board state or hidden information",
  "improves the diagnostic batch while keeping hard gates and effects clean",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI061-SR")) {
  fail("progress must include AI061-SR");
}
if (progress.currentStep !== "AI062-SR") {
  fail("progress currentStep must be AI062-SR");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai061-sr-target-context-projection-expansion.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI061-SR: ${unexpectedChanges.join(", ")}`);
}

console.log("AI061_SR_TARGET_CONTEXT_PROJECTION_EXPANSION OK target_gap=0");

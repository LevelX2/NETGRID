import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai058-shadow-evaluation-batch-report-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai058-shadow-evaluation-batch-report-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI058 check failed: ${message}`);
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

if (report.taskId !== "AI058") fail("JSON taskId must be AI058");
if (report.schemaVersion !== "shadow-evaluation-batch-v1")
  fail("schemaVersion mismatch");
if (report.scenarioCount !== 33) fail("scenarioCount mismatch");
if (report.decisionPointCount !== 33) fail("decisionPointCount mismatch");
if (report.hardGateFailures.length !== 0) fail("hardGateFailures must be empty");
if (report.knownBadDecisions.length !== 0) fail("knownBadDecisions must be empty");
if (report.actualDecisionOverrideCount !== 0)
  fail("actualDecisionOverrideCount must be zero");
if (report.runtimeEffectCount !== 0) fail("runtimeEffectCount must be zero");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

const expectedGaps = [
  ["target_context_unavailable", 13],
  ["card_semantics_unavailable", 7],
  ["ability_unresolved", 6],
  ["cost_unknown", 4],
  ["hidden_info_blocked", 3],
];
for (const [gapId, count] of expectedGaps) {
  const gap = report.topSemanticGaps.find((entry) => entry.gapId === gapId);
  if (!gap || gap.count !== count) fail(`topSemanticGaps mismatch: ${gapId}`);
}

for (const requiredCode of [
  "SHADOW_EVALUATION_BATCH_SCHEMA_VERSION",
  "ShadowEvaluationBatchReport",
  "buildShadowEvaluationBatchReport",
  "actualDecisionEqualsLegacyDecision",
  "knownBadDecisions",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "createPlayerAction",
  "liveScore",
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
  if (read(runtimeFile).includes("controlled-shadow-mode")) {
    fail(`runtime file imports controlled shadow mode: ${runtimeFile}`);
  }
}

for (const requiredText of [
  "Scenario count | 33",
  "Hard gate failures | 0",
  "`target_context_unavailable` | 13",
  "AI058 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "runs the diagnostic harness over every fixture",
  "proves every batch actualDecision remains the legacy decision",
  "summarizes top semantic gaps and recommended followups",
  "keeps the batch report diagnostic only",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI058")) {
  fail("progress must include AI058");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai058-shadow-evaluation-batch-report.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI058: ${unexpectedChanges.join(", ")}`);
}

console.log("AI058_SHADOW_EVALUATION_BATCH_REPORT OK scenarios=33");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai056-shadow-metrics-and-quality-gates-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai056-shadow-metrics-and-quality-gates-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI056 check failed: ${message}`);
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

if (report.step !== "AI056") fail("JSON step must be AI056");
if (report.schemaVersion !== "shadow-metrics-gates-v1")
  fail("schemaVersion mismatch");
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

for (const [gate, value] of Object.entries(report.hardGates ?? {})) {
  if (value !== 0) fail(`hard gate must be zero: ${gate}`);
}

if (report.qualityMetrics?.semanticDecisionAvailableRate !== 0.2424) {
  fail("semanticDecisionAvailableRate mismatch");
}
if (report.qualityMetrics?.semanticBlockedByGapRate !== 0.6667) {
  fail("semanticBlockedByGapRate mismatch");
}
if (report.qualityMetrics?.humanReviewRate !== 0.8049) {
  fail("humanReviewRate mismatch");
}

for (const requiredGate of [
  "initial_semantic_decision_available_rate",
  "future_semantic_decision_available_rate",
]) {
  const gate = report.qualityGates.find((entry) => entry.gateId === requiredGate);
  if (!gate) fail(`quality gate missing: ${requiredGate}`);
  if (gate.status !== "fail_quality_gap") {
    fail(`quality gate must be marked as quality gap: ${requiredGate}`);
  }
  if (gate.failurePolicy !== "carry_to_readiness_review") {
    fail(`quality gate failure policy mismatch: ${requiredGate}`);
  }
}

if (report.failurePolicy?.hardSafetyGateFailure !== "block_process") {
  fail("hard safety failure policy mismatch");
}
if (report.failurePolicy?.qualityGateFailure !== "carry_to_readiness_review") {
  fail("quality failure policy mismatch");
}

for (const requiredCode of [
  "SHADOW_METRICS_GATES_SCHEMA_VERSION",
  "ShadowMetricValue",
  "ShadowQualityGate",
  "buildShadowMetricsAndGatesReport",
  "semanticDecisionAvailableRate",
  "fail_quality_gap",
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
]) {
  if (read(runtimeFile).includes("controlled-shadow-mode")) {
    fail(`runtime file imports controlled shadow mode: ${runtimeFile}`);
  }
}

for (const requiredText of [
  "`illegalSemanticDecisionCount` | 0 | 0 | pass",
  "`semanticDecisionAvailableRate` | 0.2424",
  "`fail_quality_gap`",
  "carry to AI060",
  "AI056 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "defines hard gates with zero allowed safety failures",
  "measures current shadow quality",
  "documents initial and future quality thresholds",
  "keeps metrics and gates diagnostic only",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI056")) {
  fail("progress must include AI056");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai056-shadow-metrics-and-quality-gates.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI056: ${unexpectedChanges.join(", ")}`);
}

console.log("AI056_SHADOW_METRICS_AND_QUALITY_GATES OK hardGates=0");

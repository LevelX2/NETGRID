import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai066-sr-shadow-evaluation-rerun-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai066-sr-shadow-evaluation-rerun-2026-06-04.json";
const codePath = "packages/ai/src/shadow-readiness-expansion.ts";
const testPath = "packages/ai/src/shadow-readiness-expansion.test.ts";
const progressPath =
  "docs/reviews/ai/shadow-readiness-expansion-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI066-SR check failed: ${message}`);
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

if (report.step !== "AI066-SR") fail("JSON step must be AI066-SR");
if (report.schemaVersion !== "ai066-sr-shadow-evaluation-rerun-v1") {
  fail("schemaVersion mismatch");
}
if (report.scenarioCount !== 33) fail("scenario count mismatch");
if (report.decisionPointCount !== 33) fail("decision point count mismatch");
if (report.semanticDecisionAvailableRateBefore !== 0.2424) {
  fail("before availability mismatch");
}
if (report.semanticDecisionAvailableRateAfter !== 0.8788) {
  fail("after availability mismatch");
}
if (report.semanticBlockedByGapRateBefore !== 0.6667) {
  fail("before blocked-by-gap mismatch");
}
if (report.semanticBlockedByGapRateAfter !== 0.0303) {
  fail("after blocked-by-gap mismatch");
}
if (report.runtimeBackedFixtureRateAfter !== 0.2424) {
  fail("runtime-backed rate mismatch");
}
if (report.hardGateFailures.length !== 0) fail("hard gate failures must be empty");
if (report.knownBadDecisions.length !== 0) fail("known bad decisions must be empty");
if (report.actualDecisionOverrideCount !== 0)
  fail("actual decision overrides must be zero");
if (report.runtimeEffectCount !== 0) fail("runtime effect count must be zero");
if (report.readinessTrend !== "clear_improvement")
  fail("readiness trend must be clear_improvement");

const expectedGaps = new Map([
  ["target_context_unavailable", 0],
  ["card_semantics_unavailable", 0],
  ["ability_unresolved", 1],
  ["cost_unknown", 0],
  ["hidden_info_blocked", 3],
]);
for (const [gapId, count] of expectedGaps) {
  const gap = report.topSemanticGapsAfter.find((entry) => entry.gapId === gapId);
  if (!gap || gap.count !== count) fail(`gap mismatch: ${gapId}`);
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
  "AI066_SR_SHADOW_EVALUATION_RERUN_SCHEMA_VERSION",
  "buildAi066SrShadowEvaluationRerunReport",
  "semanticDecisionAvailableRateAfter",
  "semanticBlockedByGapRateAfter",
  "clear_improvement",
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
  "Shadow Evaluation Re-Run",
  "`semanticDecisionAvailableRate` | 0.2424 | 0.8788",
  "Readiness trend: `clear_improvement`",
  "AI066-SR is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "reruns shadow evaluation with improved availability and lower blocked-by-gap rate",
  "keeps hard gates, known bad decisions, runtime effects and overrides at zero",
  "reports only the intentional residual ability and hidden-info gaps",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

for (const step of [
  "AI061-SR",
  "AI062-SR",
  "AI063-SR",
  "AI064-SR",
  "AI065-SR",
  "AI066-SR",
]) {
  if (!progress.completedSteps.includes(step)) {
    fail(`progress must include ${step}`);
  }
}
if (!["AI067-SR", "integration_preflight"].includes(progress.currentStep)) {
  fail("progress currentStep must be AI067-SR or later");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai066-sr-shadow-evaluation-rerun.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI066-SR: ${unexpectedChanges.join(", ")}`);
}

console.log("AI066_SR_SHADOW_EVALUATION_RERUN OK availability=0.8788");

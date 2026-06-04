import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai064-sr-cost-timing-evidence-expansion-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai064-sr-cost-timing-evidence-expansion-2026-06-04.json";
const codePath = "packages/ai/src/shadow-readiness-expansion.ts";
const testPath = "packages/ai/src/shadow-readiness-expansion.test.ts";
const progressPath =
  "docs/reviews/ai/shadow-readiness-expansion-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI064-SR check failed: ${message}`);
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

if (report.step !== "AI064-SR") fail("JSON step must be AI064-SR");
if (report.schemaVersion !== "ai064-sr-cost-timing-evidence-expansion-v1") {
  fail("schemaVersion mismatch");
}
if (report.costUnknownBefore !== 4) fail("before gap must be 4");
if (report.normalizedCostTimingEvidenceCount !== 4) {
  fail("normalized evidence count must be 4");
}
if (report.costUnknownAfter !== 0) fail("after gap must be 0");
if (report.timingUnknownAfter !== 0) fail("timing gap must be 0");
if (report.evidencePolicy.costGuessingAllowed !== false) {
  fail("cost guessing must be forbidden");
}
if (report.evidencePolicy.hiddenInfoProjectionAllowed !== false) {
  fail("hidden-info projection must be forbidden");
}
if (report.evidencePolicy.runtimePaymentChangeAllowed !== false) {
  fail("runtime payment changes must be forbidden");
}
if (report.batchAfterCostTimingEvidenceExpansion.hardGateFailures !== 0) {
  fail("hard gate failures must be zero");
}
if (report.batchAfterCostTimingEvidenceExpansion.actualDecisionOverrideCount !== 0) {
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
  "AI064_SR_COST_TIMING_EVIDENCE_SCHEMA_VERSION",
  "AI064_SR_SIDE_SAFE_COST_TIMING_EVIDENCE",
  "buildFixturesAfterCostTimingEvidenceExpansion",
  "buildAi064SrCostTimingEvidenceExpansionReport",
  "variable_cost_range_from_legal_action",
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
  "Cost/Timing Evidence Expansion",
  "`cost_unknown` | 4 | 0",
  "Variable costs remain variable",
  "AI064-SR is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "normalizes side-safe cost and timing evidence for all AI058 cost gaps",
  "marks variable costs explicitly instead of guessing a paid amount",
  "leaves only intentional ability and hidden-info gaps after cost timing expansion",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

for (const step of ["AI061-SR", "AI062-SR", "AI063-SR", "AI064-SR"]) {
  if (!progress.completedSteps.includes(step)) {
    fail(`progress must include ${step}`);
  }
}
if (
  ![
    "AI065-SR",
    "AI066-SR",
    "AI067-SR",
    "integration_preflight",
  ].includes(progress.currentStep)
) {
  fail("progress currentStep must be AI065-SR or later");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai064-sr-cost-timing-evidence-expansion.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI064-SR: ${unexpectedChanges.join(", ")}`);
}

console.log("AI064_SR_COST_TIMING_EVIDENCE_EXPANSION OK cost_gap=0");

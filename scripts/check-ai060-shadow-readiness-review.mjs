import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/ai060-shadow-readiness-review-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai060-shadow-readiness-review-2026-06-04.json";
const finalMdPath =
  "docs/reviews/ai/ai051-060-controlled-shadow-mode-final-report-2026-06-04.md";
const finalJsonPath =
  "docs/reviews/ai/ai051-060-controlled-shadow-mode-final-report-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";
const statusPath = "docs/codex/CODEX_STATUS.md";
const indexPath = "KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md";
const logPath = "KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI060 check failed: ${message}`);
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
const finalReport = JSON.parse(read(finalJsonPath));
const finalMd = read(finalMdPath);
const code = read(codePath);
const test = read(testPath);
const progress = JSON.parse(read(progressPath));
const status = read(statusPath);
const index = read(indexPath);
const log = read(logPath);

if (report.step !== "AI060") fail("JSON step must be AI060");
if (report.schemaVersion !== "shadow-readiness-review-v1")
  fail("schemaVersion mismatch");
if (report.readinessStatus !== "limited_shadow_ready")
  fail("readinessStatus must be limited_shadow_ready");
if (report.cutoverAllowed !== false) fail("cutoverAllowed must be false");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");

for (const [gate, value] of Object.entries(report.hardGates ?? {})) {
  if (value !== 0) fail(`hard gate must be zero: ${gate}`);
}

if (report.metrics?.semanticDecisionAvailableRate !== 0.2424) {
  fail("semanticDecisionAvailableRate mismatch");
}
if (report.metrics?.hardGateFailureCount !== 0) {
  fail("hardGateFailureCount must be zero");
}
if (!report.qualityGaps.includes("runtime-backed fixture rate remains 0 in this process")) {
  fail("runtime-backed quality gap missing");
}

if (finalReport.status !== "ready_for_local_main_integration") {
  fail("final report status mismatch");
}
if (finalReport.shadowReadinessStatus !== "limited_shadow_ready") {
  fail("final shadow readiness mismatch");
}
if (finalReport.cutoverAllowed !== false) fail("final cutover must be false");
if (finalReport.completedSteps.length !== 10) fail("final completed step count");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredCode of [
  "SHADOW_READINESS_REVIEW_SCHEMA_VERSION",
  "ShadowReadinessReviewReport",
  "buildShadowReadinessReviewReport",
  "limited_shadow_ready",
  "cutoverAllowed: false",
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
  "Readiness status: `limited_shadow_ready`",
  "Cutover: not allowed",
  "Hard gate failure count | 0",
  "AI060 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}
for (const requiredText of [
  "AI051 through AI060 are complete in sequence",
  "Productive cutover remains excluded",
  "integration_preflight",
]) {
  if (!finalMd.includes(requiredText)) {
    fail(`Final Markdown report missing: ${requiredText}`);
  }
}
for (const [path, content] of [
  [statusPath, status],
  [indexPath, index],
  [logPath, log],
]) {
  if (!content.includes("limited_shadow_ready")) {
    fail(`Status knowledge missing limited_shadow_ready: ${path}`);
  }
  if (!content.includes("cutoverAllowed")) {
    fail(`Status knowledge missing cutoverAllowed: ${path}`);
  }
}

for (const requiredTest of [
  "marks controlled shadow mode as limited shadow ready without cutover",
  "keeps hard safety gates green while carrying quality gaps",
  "documents cutover prerequisites and rollback requirements",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

for (const step of [
  "AI051",
  "AI052",
  "AI053",
  "AI054",
  "AI055",
  "AI056",
  "AI057",
  "AI058",
  "AI059",
  "AI060",
]) {
  if (!progress.completedSteps.includes(step)) {
    fail(`progress missing completed step: ${step}`);
  }
}
if (progress.currentStep !== "integration_preflight") {
  fail("progress currentStep must be integration_preflight");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  finalMdPath,
  finalJsonPath,
  codePath,
  testPath,
  statusPath,
  indexPath,
  logPath,
  "scripts/check-ai060-shadow-readiness-review.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI060: ${unexpectedChanges.join(", ")}`);
}

console.log("AI060_SHADOW_READINESS_REVIEW OK status=limited_shadow_ready");

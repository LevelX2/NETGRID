import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai067-sr-shadow-readiness-rereview-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai067-sr-shadow-readiness-rereview-2026-06-04.json";
const finalMdPath =
  "docs/reviews/ai/ai061-sr-ai067-shadow-readiness-expansion-final-report-2026-06-04.md";
const finalJsonPath =
  "docs/reviews/ai/ai061-sr-ai067-shadow-readiness-expansion-final-report-2026-06-04.json";
const codePath = "packages/ai/src/shadow-readiness-expansion.ts";
const testPath = "packages/ai/src/shadow-readiness-expansion.test.ts";
const progressPath =
  "docs/reviews/ai/shadow-readiness-expansion-progress-2026-06-04.json";
const statusPath = "docs/codex/CODEX_STATUS.md";
const indexPath = "KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md";
const logPath = "KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI067-SR check failed: ${message}`);
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

if (report.step !== "AI067-SR") fail("JSON step must be AI067-SR");
if (report.schemaVersion !== "ai067-sr-shadow-readiness-rereview-v1") {
  fail("schemaVersion mismatch");
}
if (report.readinessStatus !== "broad_shadow_ready")
  fail("readiness must be broad_shadow_ready");
if (report.sourceReadinessStatus !== "limited_shadow_ready")
  fail("source readiness mismatch");
if (report.cutoverAllowed !== false) fail("cutoverAllowed must be false");
if (report.cutoverDesignStarted !== false)
  fail("cutoverDesignStarted must be false");
if (report.semanticAiShadowModeEnabledDefault !== false)
  fail("semanticAiShadowModeEnabled default must be false");
if (report.metrics.semanticDecisionAvailableRate !== 0.8788)
  fail("availability mismatch");
if (report.metrics.semanticBlockedByGapRate !== 0.0303)
  fail("blocked-by-gap mismatch");
if (report.metrics.runtimeBackedFixtureRate !== 0.2424)
  fail("runtime-backed rate mismatch");
for (const [gate, value] of Object.entries(report.hardGates ?? {})) {
  if (value !== 0) fail(`hard gate must be zero: ${gate}`);
}
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.semanticExecutionAllowed !== false)
  fail("semanticExecutionAllowed must be false");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");

if (finalReport.status !== "ready_for_local_main_integration") {
  fail("final report status mismatch");
}
if (finalReport.shadowReadinessStatus !== "broad_shadow_ready") {
  fail("final readiness mismatch");
}
if (finalReport.cutoverAllowed !== false) fail("final cutover must be false");
if (finalReport.completedSteps.length !== 7) fail("final completed step count");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredCode of [
  "AI067_SR_SHADOW_READINESS_REREVIEW_SCHEMA_VERSION",
  "buildAi067SrShadowReadinessRereviewReport",
  "broad_shadow_ready",
  "cutoverAllowed: false",
  "semanticAiShadowModeEnabledDefault: false",
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
  "Readiness status: `broad_shadow_ready`",
  "Cutover: not allowed",
  "`semanticDecisionAvailableRate` | 0.2424 | 0.8788",
  "AI067-SR is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}
for (const requiredText of [
  "AI061-SR through AI067-SR are complete in sequence",
  "Final Shadow readiness: `broad_shadow_ready`",
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
  if (!content.includes("broad_shadow_ready")) {
    fail(`Status knowledge missing broad_shadow_ready: ${path}`);
  }
  if (!content.includes("cutoverAllowed: false")) {
    fail(`Status knowledge missing cutoverAllowed false: ${path}`);
  }
}

for (const requiredTest of [
  "upgrades shadow readiness to broad without allowing cutover",
  "keeps every hard safety gate and runtime-effect counter at zero",
  "carries residual ability and hidden-info gaps without treating them as cutover approval",
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
  "AI067-SR",
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
  "scripts/check-ai067-sr-shadow-readiness-rereview.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI067-SR: ${unexpectedChanges.join(", ")}`);
}

console.log("AI067_SR_SHADOW_READINESS_REREVIEW OK status=broad_shadow_ready");

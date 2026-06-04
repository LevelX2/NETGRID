import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/meta14-low-risk-scope-expansion-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta14-low-risk-scope-expansion-report-2026-06-04.json";
const progressPath =
  "docs/reviews/ai/semantic-ai-meta13-meta18-progress-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath = "scripts/check-meta14-low-risk-scope-expansion.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META14 check failed: ${message}`);
  process.exit(1);
}

function gitLines(args) {
  const output = execFileSync("git", args, { encoding: "utf8" }).trim();
  return output ? output.split(/\r?\n/).map((line) => line.trim()) : [];
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only"]),
      ...gitLines(["diff", "--cached", "--name-only"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ]
    .filter(Boolean)
    .sort();
}

const md = read(mdPath);
const report = JSON.parse(read(jsonPath));
const progress = JSON.parse(read(progressPath));
const code = read(codePath);
const test = read(testPath);

if (report.schemaVersion !== "meta14-low-risk-scope-expansion-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META14") fail("step must be META14");
if (report.sourceStep !== "META13") fail("source step mismatch");
if (report.newScopeActivated !== "simple_rez") fail("new scope mismatch");
if (
  report.activeProductionScopesAfter.length !==
  report.activeProductionScopesBefore.length + 1
) {
  fail("exactly one new scope must be active");
}
if (!report.activeProductionScopesAfter.includes("simple_rez")) {
  fail("simple_rez must be active");
}
const productiveDossiers = report.dossiers.filter(
  (entry) => entry.productiveActivation === true,
);
if (productiveDossiers.length !== 1 || productiveDossiers[0].scopeId !== "simple_rez") {
  fail("only simple_rez may be productive");
}
const runChoice = report.dossiers.find((entry) => entry.scopeId === "simple_run_choice");
if (
  !runChoice ||
  runChoice.productiveActivation !== false ||
  runChoice.outputStatus !== "limited_candidate"
) {
  fail("simple_run_choice must remain candidate only");
}
const remoteContest = report.dossiers.find((entry) => entry.scopeId === "remote_contest");
if (
  !remoteContest ||
  remoteContest.productiveActivation !== false ||
  remoteContest.releaseDecision !== "calibrated_not_productive" ||
  remoteContest.hiddenInfoPolicy !== "side_safe_public_context_only"
) {
  fail("remote_contest calibration contract invalid");
}
for (const counter of [
  "bulkActivationCount",
  "humanReviewOpenCount",
  "unsafeDivergenceCount",
  "engineRejectCount",
  "hiddenInfoViolationCount",
  "knownBadDecisionCount",
]) {
  if (report.qualityGates[counter] !== 0) {
    fail(`quality counter must be zero: ${counter}`);
  }
}
if (report.qualityGates.oneNewScopeActivatedAtMost !== true) {
  fail("one-scope gate");
}
if (report.qualityGates.rollbackTested !== true) fail("rollback gate");
if (report.goNoGo.decision !== "simple_rez_limited_scoped_production_active") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.remoteContestDecision !== "agreement_ready_not_productive") {
  fail("remote contest decision");
}
if (report.goNoGo.fullProductionReady !== false) fail("fullProductionReady");
if (report.goNoGo.legacyRemovalReady !== false) fail("legacyRemovalReady");
if (!progress.completedSteps.includes("META14")) fail("progress missing META14");
if (!progress.newProductionScopes.includes("simple_rez")) {
  fail("progress missing simple_rez");
}

for (const requiredCode of [
  "META14_LOW_RISK_SCOPE_EXPANSION_SCHEMA_VERSION",
  "META14_CANDIDATE_ORDER",
  "META14_LOW_RISK_DOSSIERS",
  "META14_CALIBRATION_RESULTS",
  "buildMeta14LowRiskScopeExpansionReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "remote_contest_limited_scoped_production_active",
  "legacyRemovalReady: true",
  "fullProductionReady: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META14 Low-Risk Scope Expansion",
  "simple_rez as the only new production scope",
  "remote_contest out of production",
  "without bulk activation",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 14 Low-Risk Scope Expansion",
  "simple_rez_limited_scoped_production_active",
  "remote_contest = agreement_ready_not_productive",
  "keine verdeckte Remote-Identität",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  progressPath,
  codePath,
  testPath,
  scriptPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META14: ${unexpectedChanges.join(", ")}`);
}

console.log("META14_LOW_RISK_SCOPE_EXPANSION OK");

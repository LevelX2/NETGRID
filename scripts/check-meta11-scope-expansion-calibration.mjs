import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/meta11-scope-expansion-calibration-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta11-scope-expansion-calibration-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath = "scripts/check-meta11-scope-expansion-calibration.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META11 check failed: ${message}`);
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
const code = read(codePath);
const test = read(testPath);

if (report.schemaVersion !== "meta11-scope-expansion-calibration-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META11") fail("step must be META11");
if (report.sourceStep !== "META10") fail("source step mismatch");
if (report.newScopeActivated !== "basic_install") fail("new scope activated");
if (
  report.activeProductionScopesAfter.length -
    report.activeProductionScopesBefore.length !==
  1
) {
  fail("must activate exactly one new scope");
}
if (!report.activeProductionScopesAfter.includes("basic_install")) {
  fail("basic_install missing after expansion");
}
for (const [gate, value] of Object.entries(report.qualityGates)) {
  if (
    [
      "rollbackTested",
      "multiRunMetricsStable",
      "oneNewScopeActivated",
    ].includes(gate)
  ) {
    if (value !== true) fail(`quality gate must be true: ${gate}`);
  } else if (gate === "traceCompleteRate") {
    if (value !== 1) fail("traceCompleteRate");
  } else if (gate === "semanticDecisionAvailableRate") {
    if (value < 0.9) fail("semanticDecisionAvailableRate");
  } else if (gate === "blockedByGapRate") {
    if (value > 0.03) fail("blockedByGapRate");
  } else if (value !== 0) {
    fail(`quality counter must be zero: ${gate}`);
  }
}
const basicInstall = report.scopeDossiers.find(
  (entry) => entry.scopeId === "basic_install",
);
if (!basicInstall || basicInstall.releaseDecision !== "promote_one_scope") {
  fail("basic_install dossier");
}
const simpleRez = report.scopeDossiers.find((entry) => entry.scopeId === "simple_rez");
if (!simpleRez || simpleRez.releaseDecision !== "ready_but_not_activated") {
  fail("simple_rez must not activate in same iteration");
}
const remoteContest = report.scopeDossiers.find(
  (entry) => entry.scopeId === "remote_contest",
);
if (
  !remoteContest ||
  remoteContest.releaseDecision !== "blocked_by_calibration" ||
  !remoteContest.blockedReasons.includes("remote_target_scoring_calibration_open")
) {
  fail("remote_contest calibration block");
}
if (report.regressionSuite.length < 10) fail("regression suite count");
for (const guard of [
  "hidden_info_guard",
  "illegal_action_guard",
  "rollback_guard",
  "engine_reject_guard",
  "agreement_only_guard",
  "scoped_override_guard",
  "legacy_fallback_guard",
  "trace_scrubber_guard",
  "determinism_guard",
  "goal_persistence_guard",
]) {
  if (!report.regressionSuite.some((entry) => entry.guardId === guard)) {
    fail(`regression guard missing: ${guard}`);
  }
}
if (report.goNoGo.decision !== "one_scope_promoted") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.bulkActivationAllowed !== false) {
  fail("bulk activation must be false");
}
if (report.goNoGo.fullProductionReady !== false) fail("fullProductionReady");
if (report.goNoGo.legacyRemovalReady !== false) fail("legacyRemovalReady");
if (report.legacyFallbackAvailable !== true) fail("legacy fallback");
if (report.rollbackAvailable !== true) fail("rollback");

for (const requiredCode of [
  "META11_SCOPE_EXPANSION_CALIBRATION_SCHEMA_VERSION",
  "META11_CANDIDATE_ORDER",
  "META11_SCOPE_DOSSIERS",
  "META11_CALIBRATION_FINDINGS",
  "META11_REGRESSION_SUITE",
  "buildMeta11ScopeExpansionCalibrationReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "bulkActivationAllowed: true",
  "fullProductionReady: true",
  "legacyRemovalReady: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META11 Scope Expansion",
  "exactly one new scope",
  "remote_contest",
  "regression guards",
  "without full production or legacy removal",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 11 Scope Expansion + Calibration",
  "Neuer Scope: `basic_install`",
  "one_scope_promoted",
  "bulk_activation",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

const allowedChangedFiles = [mdPath, jsonPath, codePath, testPath, scriptPath];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META11: ${unexpectedChanges.join(", ")}`);
}

console.log("META11_SCOPE_EXPANSION_CALIBRATION OK");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta13-legacy-freeze-extended-monitoring-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta13-legacy-freeze-extended-monitoring-report-2026-06-04.json";
const progressPath =
  "docs/reviews/ai/semantic-ai-meta13-meta18-progress-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath = "scripts/check-meta13-legacy-freeze-extended-monitoring.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META13 check failed: ${message}`);
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

if (report.schemaVersion !== "meta13-legacy-freeze-extended-monitoring-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META13") fail("step must be META13");
if (report.sourceStep !== "META12") fail("source step mismatch");
for (const scope of [
  "basic_economy_draw",
  "tag_removal",
  "simple_score_advance",
  "basic_install",
]) {
  if (!report.legacyFreezeActiveForScopes.includes(scope)) {
    fail(`freeze-active scope missing: ${scope}`);
  }
}
if (report.legacyFreezeActiveForScopes.length !== 4) {
  fail("freeze-active scope count must stay 4");
}
if (report.freezeStatus.legacyFallbackAvailable !== true) {
  fail("legacy fallback unavailable");
}
if (report.freezeStatus.rollbackAvailable !== true) fail("rollback unavailable");
if (report.freezeStatus.legacyRemovalReady !== false) {
  fail("legacy removal must stay false");
}
if (report.freezeStatus.freezeMeansLegacyCodeRemoved !== false) {
  fail("freeze must not remove legacy code");
}
if (
  report.extendedMonitoring.observedObservationCycles <
  report.extendedMonitoring.minimumObservationCycles
) {
  fail("observation window too short");
}
if (
  report.extendedMonitoring.observedProductionDecisionCount <
  report.extendedMonitoring.minimumProductionDecisionCount
) {
  fail("production decision count too low");
}
if (report.extendedMonitoring.traceScrubPassRate !== 1) {
  fail("trace scrub pass rate");
}
for (const counter of [
  "engineRejectCount",
  "hiddenInfoViolationCount",
  "unsafeDivergenceCount",
  "publicPayloadDeltaCount",
  "rollbackFailureCount",
]) {
  if (report.qualityGates[counter] !== 0) {
    fail(`quality counter must be zero: ${counter}`);
  }
}
if (report.qualityGates.legacyFallbackAvailable !== true) {
  fail("quality fallback gate");
}
if (report.qualityGates.rollbackAvailable !== true) fail("quality rollback gate");
if (report.qualityGates.legacyRemovalReady !== false) {
  fail("quality legacy removal gate");
}
if (report.goNoGo.decision !== "legacy_freeze_active_for_selected_scopes") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.fullProductionReady !== false) fail("fullProductionReady");
if (report.goNoGo.legacyRemovalReady !== false) fail("legacyRemovalReady");
if (!progress.completedSteps.includes("META13")) fail("progress missing META13");

for (const requiredCode of [
  "META13_LEGACY_FREEZE_EXTENDED_MONITORING_SCHEMA_VERSION",
  "META13_LEGACY_FREEZE_ACTIVE_SCOPES",
  "META13_EXTENDED_MONITORING",
  "META13_REGRESSION_SUITE",
  "buildMeta13LegacyFreezeExtendedMonitoringReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "legacyRemoved: true",
  "fallback_removed",
  "legacyRemovalReady: true",
  "fullProductionReady: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META13 Legacy-Freeze",
  "activates legacy freeze",
  "extends monitoring",
  "without allowing legacy removal",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 13 Legacy-Freeze-Aktivierung",
  "legacy_freeze_active_for_selected_scopes",
  "Legacy bleibt als Fallback-Codepfad verfügbar",
  "Keine Legacy-Entfernung",
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
  fail(`Unexpected changed files for META13: ${unexpectedChanges.join(", ")}`);
}

console.log("META13_LEGACY_FREEZE_EXTENDED_MONITORING OK");

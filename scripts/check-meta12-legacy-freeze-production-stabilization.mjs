import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta12-legacy-freeze-production-stabilization-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta12-legacy-freeze-production-stabilization-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath =
  "scripts/check-meta12-legacy-freeze-production-stabilization.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META12 check failed: ${message}`);
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

if (report.schemaVersion !== "meta12-legacy-freeze-production-stabilization-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META12") fail("step must be META12");
if (report.sourceStep !== "META11") fail("source step mismatch");
if (report.stabilizedProductionScopes.length !== 4) {
  fail("stabilized production scope count");
}
for (const scope of [
  "basic_economy_draw",
  "tag_removal",
  "simple_score_advance",
  "basic_install",
]) {
  if (!report.stabilizedProductionScopes.includes(scope)) {
    fail(`stabilized scope missing: ${scope}`);
  }
  const decision = report.freezeDecisions.find((entry) => entry.scopeId === scope);
  if (
    !decision ||
    decision.productionStable !== true ||
    decision.legacyFreezeDecision !== "freeze_ready" ||
    decision.legacyFallbackAvailable !== true ||
    decision.rollbackAvailable !== true
  ) {
    fail(`freeze decision invalid: ${scope}`);
  }
}
for (const counter of [
  "engineRejectCount",
  "hiddenInfoViolationCount",
  "unsafeDivergenceCount",
]) {
  if (report.stabilityDashboard[counter] !== 0) {
    fail(`dashboard counter must be zero: ${counter}`);
  }
}
if (report.stabilityDashboard.traceScrubPassRate !== 1) {
  fail("traceScrubPassRate");
}
if (report.stabilityDashboard.scopeRegressionStatus !== "green") {
  fail("scope regression status");
}
for (const [gate, value] of Object.entries(report.qualityGates)) {
  if (
    [
      "legacyFreezeAllowedForSelectedScopes",
      "legacyFallbackAvailable",
      "rollbackAvailable",
      "traceScrubberPasses",
      "multiRunMetricsStable",
    ].includes(gate)
  ) {
    if (value !== true) fail(`quality gate must be true: ${gate}`);
  } else if (gate === "fullProductionReady" || gate === "legacyRemovalReady") {
    if (value !== false) fail(`${gate} must be false`);
  } else if (value !== 0) {
    fail(`quality counter must be zero: ${gate}`);
  }
}
if (report.goNoGo.decision !== "legacy_freeze_for_selected_scopes_ready") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.legacyRemoved !== false) fail("legacyRemoved");
if (report.goNoGo.fullReplacementWithoutFallback !== false) {
  fail("full replacement without fallback");
}
if (report.goNoGo.laterRetirementOnly !== true) fail("laterRetirementOnly");
if (report.legacyRemovalReady !== false) fail("legacyRemovalReady");
if (report.fullProductionReady !== false) fail("fullProductionReady");
if (report.legacyFallbackAvailable !== true) fail("legacy fallback");
if (report.rollbackAvailable !== true) fail("rollback");
if (
  !report.laterLegacyRetirementConditions.every(
    (entry) => entry.status === "future_required",
  )
) {
  fail("retirement conditions must remain future_required");
}

for (const requiredCode of [
  "META12_LEGACY_FREEZE_STABILIZATION_SCHEMA_VERSION",
  "META12_STABILIZED_PRODUCTION_SCOPES",
  "META12_FREEZE_DECISIONS",
  "META12_STABILITY_DASHBOARD",
  "META12_EXPANSION_POLICY",
  "META12_LATER_RETIREMENT_CONDITIONS",
  "buildMeta12LegacyFreezeProductionStabilizationReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "legacyRemoved: true",
  "fullReplacementWithoutFallback: true",
  "legacyRemovalReady: true",
  "fullProductionReady: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META12 Legacy Freeze",
  "freeze-ready",
  "green stability dashboard",
  "expansion policy",
  "not full production or legacy removal",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 12 Legacy Freeze + Production Stabilization",
  "legacy_freeze_for_selected_scopes_ready",
  "Legacy Removal ist nicht Teil von META 12",
  "Keine Legacy-Entfernung",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

const allowedChangedFiles = [mdPath, jsonPath, codePath, testPath, scriptPath];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META12: ${unexpectedChanges.join(", ")}`);
}

console.log("META12_LEGACY_FREEZE_PRODUCTION_STABILIZATION OK");

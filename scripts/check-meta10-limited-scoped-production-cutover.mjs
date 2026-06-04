import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta10-limited-scoped-production-cutover-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta10-limited-scoped-production-cutover-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath = "scripts/check-meta10-limited-scoped-production-cutover.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META10 check failed: ${message}`);
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

if (report.schemaVersion !== "meta10-limited-scoped-production-cutover-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META10") fail("step must be META10");
if (report.sourceStep !== "META9") fail("source step mismatch");
const selected = report.selectedProductionScopes.join(",");
if (selected !== "basic_economy_draw,tag_removal,simple_score_advance") {
  fail(`selected scopes mismatch: ${selected}`);
}
const semanticActual = report.cutoverResults.filter(
  (entry) => entry.actualDecisionSource === "semantic",
);
if (semanticActual.length !== 3) fail("semantic actual count");
for (const entry of semanticActual) {
  if (!report.selectedProductionScopes.includes(entry.scopeId)) {
    fail(`semantic actual outside selected scope: ${entry.scopeId}`);
  }
  if (entry.result !== "semantic_limited_production_actual") {
    fail(`semantic result mismatch: ${entry.fixtureId}`);
  }
}
for (const entry of report.cutoverResults) {
  if (entry.killSwitchAvailable !== true) {
    fail(`kill switch missing: ${entry.fixtureId}`);
  }
}
for (const rollbackResult of [
  "hidden_info_blocked_legacy",
  "semantic_not_legal_legacy",
  "rollback_forced_legacy",
  "engine_reject_guard_legacy",
  "public_payload_delta_guard_legacy",
]) {
  const entry = report.cutoverResults.find(
    (candidate) => candidate.result === rollbackResult,
  );
  if (!entry || entry.actualDecisionSource !== "legacy" || !entry.rollbackTriggered) {
    fail(`rollback result invalid: ${rollbackResult}`);
  }
}
for (const counter of [
  "engineRejectCount",
  "hiddenInfoViolationCount",
  "unsafeDivergenceCount",
  "publicPayloadDeltaCount",
]) {
  if (report.monitoring[counter] !== 0) {
    fail(`monitoring counter must be zero: ${counter}`);
  }
}
if (report.monitoring.semanticOverrideCount !== 3) {
  fail("semantic override count");
}
if (report.monitoring.legacyFallbackCount !== 6) {
  fail("legacy fallback count");
}
for (const [gate, value] of Object.entries(report.preActivationQualityGates)) {
  if (typeof value === "boolean" && value !== true) {
    fail(`pre gate must be true: ${gate}`);
  }
  if (typeof value === "number" && value !== 0) {
    fail(`pre counter must be zero: ${gate}`);
  }
}
for (const [gate, value] of Object.entries(report.postActivationQualityGates)) {
  if (value !== 0) fail(`post counter must be zero: ${gate}`);
}
if (
  report.goNoGo.decision !==
  "limited_scoped_production_active_with_rollback_constraints"
) {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.fullProductionReady !== false) fail("fullProductionReady");
if (report.goNoGo.legacyRemovalReady !== false) fail("legacyRemovalReady");
if (report.goNoGo.broadCutoverAllowed !== false) fail("broadCutoverAllowed");
if (report.limitedScopedProductionActive !== true) {
  fail("limited scoped production not active");
}
if (report.productiveUse !== "selected_scopes_only") fail("productiveUse");
if (report.legacyFallbackAvailable !== true) fail("legacy fallback");
if (report.rollbackAvailable !== true) fail("rollback");

for (const requiredCode of [
  "META10_LIMITED_SCOPED_CUTOVER_SCHEMA_VERSION",
  "META10_SELECTED_PRODUCTION_SCOPES",
  "META10_SCOPE_FREEZE_DOSSIERS",
  "META10_CUTOVER_FIXTURES",
  "buildMeta10LimitedScopedProductionCutoverReport",
  "evaluateMeta10CutoverFixture",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "fullProductionReady: true",
  "legacyRemovalReady: true",
  "broadCutoverAllowed: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META10 Limited Scoped Production Cutover",
  "freezes only selected",
  "allows semantic actual decisions only",
  "rolls back to legacy",
  "without full production or legacy removal",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 10 Limited Scoped Production Cutover",
  "basic_economy_draw",
  "limited_scoped_production_active_with_rollback_constraints",
  "Kein Legacy Removal",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

const allowedChangedFiles = [mdPath, jsonPath, codePath, testPath, scriptPath];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META10: ${unexpectedChanges.join(", ")}`);
}

console.log("META10_LIMITED_SCOPED_PRODUCTION_CUTOVER OK");

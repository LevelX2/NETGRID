import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/meta8-internal-semantic-canary-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta8-internal-semantic-canary-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath = "scripts/check-meta8-internal-semantic-canary.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META8 check failed: ${message}`);
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

if (report.schemaVersion !== "meta8-internal-semantic-canary-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META8") fail("step must be META8");
if (report.sourceStep !== "META7") fail("source step mismatch");
if (report.defaultConfig.semanticAiCutoverEnabled !== false) {
  fail("default cutover must be false");
}
if (report.defaultConfig.semanticAiScopedOverrideEnabled !== false) {
  fail("default scoped override must be false");
}
if (report.defaultConfig.semanticAiRollbackForceLegacy !== true) {
  fail("default rollback must force legacy");
}
if (report.internalCanaryConfig.semanticAiCutoverEnabled !== true) {
  fail("internal canary cutover flag");
}
if (report.internalCanaryConfig.semanticAiCanaryScope !== "internal") {
  fail("internal canary scope");
}
if (report.canaryRunSummary.decisionPointCount < 250) {
  fail("canary decision point count below gate");
}
if (report.qualityGates.semanticActualDecisionCount <= 0) {
  fail("semantic actual decision count must be positive");
}
for (const counter of [
  "illegalSemanticDecisionCount",
  "hiddenInfoViolationCount",
  "engineRejectCount",
  "nonEngineLegalAssumptionCount",
  "determinismFailureCount",
  "rollbackFailureCount",
  "unsafeDivergenceCount",
  "knownBadDecisionCount",
]) {
  if (report.qualityGates[counter] !== 0) {
    fail(`quality counter must be zero: ${counter}`);
  }
}
if (report.qualityGates.traceCompleteRate !== 1) fail("traceCompleteRate");
if (report.qualityGates.runtimeOverheadDocumented !== true) {
  fail("runtime overhead not documented");
}
if (report.qualityGates.defaultConfigLegacyOnly !== true) {
  fail("default config legacy-only gate");
}
for (const rollbackCase of [
  "rollback_forced",
  "semantic_not_in_legal_actions",
  "hidden_info_blocked",
  "missing_trace",
  "engine_reject_simulated",
]) {
  if (!report.rollbackCases.includes(rollbackCase)) {
    fail(`rollback case missing: ${rollbackCase}`);
  }
  const result = report.fixtureResults.find(
    (candidate) => candidate.result === rollbackCase,
  );
  if (!result || result.actualDecisionSource !== "legacy") {
    fail(`rollback fixture does not fall back to legacy: ${rollbackCase}`);
  }
}
if (report.goNoGo.decision !== "production_safe_shadow_candidate") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.productionCutoverAllowed !== false) {
  fail("production cutover must remain false");
}
if (report.goNoGo.legacyRemovalReady !== false) {
  fail("legacy removal must remain false");
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionScope !== "internal_canary_only") {
  fail("semanticExecutionScope");
}
if (report.noProductionRuntimeEffect !== true) fail("no production runtime effect");

for (const requiredCode of [
  "META8_INTERNAL_SEMANTIC_CANARY_SCHEMA_VERSION",
  "META8_DEFAULT_CONFIG",
  "META8_INTERNAL_CANARY_CONFIG",
  "META8_INTERNAL_CANARY_FIXTURES",
  "META8_RUNTIME_OVERHEAD",
  "buildMeta8InternalSemanticCanaryReport",
  "evaluateMeta8InternalCanaryFixture",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "productionCutoverAllowed: true",
  "legacyRemovalReady: true",
  "productiveUseAllowed: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META8 Internal Semantic Canary",
  "default config legacy-only",
  "internal-canary-ready scopes",
  "falls back to legacy",
  "without enabling production cutover",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 8 Internal Semantic Canary",
  "Default bleibt Legacy-only",
  "production_safe_shadow_candidate",
  "Kein Produktiv-Cutover",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

const allowedChangedFiles = [mdPath, jsonPath, codePath, testPath, scriptPath];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META8: ${unexpectedChanges.join(", ")}`);
}

console.log("META8_INTERNAL_SEMANTIC_CANARY OK");

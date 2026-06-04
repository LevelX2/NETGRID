import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta9-production-safe-shadow-agreement-canary-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta9-production-safe-shadow-agreement-canary-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath =
  "scripts/check-meta9-production-safe-shadow-agreement-canary.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META9 check failed: ${message}`);
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

if (report.schemaVersion !== "meta9-production-safe-shadow-agreement-canary-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META9") fail("step must be META9");
if (report.sourceStep !== "META8") fail("source step mismatch");
if (report.shadowConfig.semanticAiShadowModeEnabled !== true) {
  fail("shadow mode must be enabled for META9");
}
if (report.shadowConfig.semanticAiCutoverEnabled !== false) {
  fail("cutover must be disabled");
}
if (report.shadowConfig.semanticAiScopedOverrideEnabled !== false) {
  fail("scoped override must be disabled");
}
if (report.shadowConfig.semanticAiRollbackForceLegacy !== true) {
  fail("rollback must force legacy");
}
if (
  !report.agreementResults.every(
    (entry) =>
      entry.actualDecisionSource === "legacy" &&
      entry.behaviorDelta === false &&
      entry.publicPayloadDelta === false,
  )
) {
  fail("agreement results must be legacy/no-delta");
}
if (!report.traceScrubResults.some((entry) => entry.safelyDropped === true)) {
  fail("expected at least one safely dropped trace");
}
if (!report.traceScrubResults.every((entry) => entry.safe || entry.safelyDropped)) {
  fail("trace must be safe or safely dropped");
}
for (const payloadCheck of report.publicPayloadChecks) {
  if (payloadCheck.publicPayloadDeltaCount !== 0) {
    fail(`public payload delta: ${payloadCheck.surface}`);
  }
}
for (const counter of [
  "behaviorDeltaCount",
  "publicPayloadDeltaCount",
  "hiddenInfoViolationCount",
  "traceScrubViolationCount",
  "engineRejectCount",
  "rollbackFailureCount",
]) {
  if (report.qualityGates[counter] !== 0) {
    fail(`quality counter must be zero: ${counter}`);
  }
}
if (report.qualityGates.traceCompleteOrSafelyDroppedRate !== 1) {
  fail("traceCompleteOrSafelyDroppedRate");
}
if (report.qualityGates.semanticScopedOverrideEnabled !== false) {
  fail("semantic scoped override must be false");
}
if (report.qualityGates.actualDecisionAlwaysLegacy !== true) {
  fail("actual decisions must be legacy");
}
if (report.metrics.publicPayloadDeltaCount !== 0) fail("metrics payload delta");
if (report.metrics.traceScrubPassRate !== 1) fail("trace scrub pass rate");
if (report.goNoGo.decision !== "limited_cutover_candidate_for_selected_scopes") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.broadCutoverAllowed !== false) {
  fail("broad cutover must remain false");
}
if (report.goNoGo.legacyRemovalReady !== false) {
  fail("legacy removal must remain false");
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.actualDecisionContract !== "actualDecision_always_legacy_in_meta9") {
  fail("actualDecisionContract");
}
if (report.noBehaviorDelta !== true) fail("noBehaviorDelta");

for (const requiredCode of [
  "META9_PRODUCTION_SAFE_SHADOW_SCHEMA_VERSION",
  "META9_PRODUCTION_SAFE_SHADOW_CONFIG",
  "META9_TRACE_SCRUB_FIXTURES",
  "META9_AGREEMENT_SHADOW_FIXTURES",
  "META9_PUBLIC_PAYLOAD_CHECKS",
  "buildMeta9ProductionSafeShadowAgreementCanaryReport",
  "evaluateMeta9TraceScrubFixture",
  "evaluateMeta9AgreementShadowFixture",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "broadCutoverAllowed: true",
  "legacyRemovalReady: true",
  "productiveUseAllowed: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META9 Production-Safe Shadow",
  "scrubs or safely drops",
  "keeps actual decisions legacy",
  "without behavior or public-payload delta",
  "without allowing broad cutover",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 9 Production-Safe Shadow / Agreement Canary",
  "`actualDecision` bleibt in jedem Fall Legacy",
  "limited_cutover_candidate_for_selected_scopes",
  "Kein Behavior Delta",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

const allowedChangedFiles = [mdPath, jsonPath, codePath, testPath, scriptPath];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META9: ${unexpectedChanges.join(", ")}`);
}

console.log("META9_PRODUCTION_SAFE_SHADOW_AGREEMENT_CANARY OK");

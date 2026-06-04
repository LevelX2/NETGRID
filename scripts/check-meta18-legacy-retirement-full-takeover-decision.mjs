import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta18-legacy-retirement-full-takeover-decision-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta18-legacy-retirement-full-takeover-decision-report-2026-06-04.json";
const progressPath =
  "docs/reviews/ai/semantic-ai-meta13-meta18-progress-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath =
  "scripts/check-meta18-legacy-retirement-full-takeover-decision.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META18 check failed: ${message}`);
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

if (
  report.schemaVersion !==
  "meta18-legacy-retirement-full-takeover-decision-v0"
) {
  fail("schemaVersion mismatch");
}
if (report.step !== "META18") fail("step must be META18");
if (report.sourceStep !== "META17") fail("source step mismatch");
if (report.semanticDefaultForEligibleScopes !== true) {
  fail("semantic default must be active for eligible scopes");
}
if (report.chosenModel !== "legacy_retained_as_fallback") {
  fail("chosen model mismatch");
}
const fullRetirement = report.decisionOptions.find(
  (entry) => entry.model === "full_legacy_retirement_ready",
);
if (!fullRetirement || fullRetirement.status !== "blocked_without_signoff") {
  fail("full retirement must be blocked without signoff");
}
for (const conditionId of ["human_signoff_completed", "rollback_replacement_plan"]) {
  const condition = report.prerequisites.find(
    (entry) => entry.conditionId === conditionId,
  );
  if (!condition || condition.status !== "blocked") {
    fail(`condition must be blocked: ${conditionId}`);
  }
}
if (!report.scopeDisposition.semanticDefaultScopes.includes("remote_contest")) {
  fail("remote_contest semantic default missing");
}
for (const scope of ["trace_payment", "multi_target_multi_ability"]) {
  if (!report.scopeDisposition.legacyOnlyScopes.includes(scope)) {
    fail(`legacy-only scope missing: ${scope}`);
  }
}
if (report.qualityGates.legacyRemovalReady !== false) {
  fail("legacyRemovalReady must stay false");
}
if (report.qualityGates.fallbackReplacementAvailable !== false) {
  fail("fallback replacement must not be claimed");
}
if (report.qualityGates.humanSignoffRequired !== "not_requested") {
  fail("human signoff status");
}
for (const counter of [
  "hardGateFailureCount",
  "engineRejectCount",
  "hiddenInfoViolationCount",
  "publicPayloadDeltaCount",
  "unsafeDivergenceCount",
]) {
  if (report.qualityGates[counter] !== 0) {
    fail(`quality counter must be zero: ${counter}`);
  }
}
if (report.goNoGo.decision !== "legacy_retained_as_fallback") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.fullLegacyRetirementReady !== false) {
  fail("full legacy retirement ready");
}
if (report.goNoGo.scopewiseRetirementAllowedNow !== false) {
  fail("scopewise retirement allowed now");
}
if (report.legacyFallbackAvailable !== true) fail("fallback unavailable");
if (report.rollbackAvailable !== true) fail("rollback unavailable");
if (report.legacyRemovalReady !== false) fail("legacy removal ready");
if (!progress.completedSteps.includes("META18")) fail("progress missing META18");
if (progress.legacyRetirementDecision !== "legacy_retained_as_fallback") {
  fail("progress decision mismatch");
}

for (const requiredCode of [
  "META18_LEGACY_RETIREMENT_DECISION_SCHEMA_VERSION",
  "META18_DECISION_OPTIONS",
  "META18_PREREQUISITES",
  "buildMeta18LegacyRetirementFullTakeoverDecisionReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "fallbackRemoved: true",
  "fullLegacyRetirementReady: true",
  "scopewiseRetirementAllowedNow: true",
  "legacyRemovalReady: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META18 Legacy Retirement",
  "instead of legacy removal",
  "until signoff and rollback replacement exist",
  "retained fallback as final decision",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 18 Legacy Retirement",
  "legacy_retained_as_fallback",
  "Legacy Removal ist nicht freigegeben",
  "kein explizites Human Signoff",
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
  fail(`Unexpected changed files for META18: ${unexpectedChanges.join(", ")}`);
}

console.log("META18_LEGACY_RETIREMENT_FULL_TAKEOVER_DECISION OK");

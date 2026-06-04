import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta17-semantic-default-eligible-scopes-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta17-semantic-default-eligible-scopes-report-2026-06-04.json";
const progressPath =
  "docs/reviews/ai/semantic-ai-meta13-meta18-progress-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath =
  "scripts/check-meta17-semantic-default-eligible-scopes.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META17 check failed: ${message}`);
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

if (report.schemaVersion !== "meta17-semantic-default-eligible-scopes-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META17") fail("step must be META17");
if (report.sourceStep !== "META16") fail("source step mismatch");
if (report.semanticDefaultActive !== true) fail("semantic default inactive");
if (report.eligibleSemanticDefaultScopes.length !== 8) {
  fail("eligible semantic default scope count");
}
for (const scope of ["trace_payment", "damage_prevention", "multi_target_multi_ability"]) {
  if (!report.nonEligibleScopes.includes(scope)) fail(`non-eligible missing: ${scope}`);
}
const legacyOnly = report.fixtureResults.find(
  (entry) => entry.fixtureId === "meta17-trace-payment-legacy-only",
);
if (!legacyOnly || legacyOnly.actualDecisionSource !== "legacy") {
  fail("trace payment must remain legacy");
}
const rollback = report.fixtureResults.find(
  (entry) => entry.fixtureId === "meta17-rollback-forced",
);
if (!rollback || rollback.result !== "rollback_forced_legacy") {
  fail("rollback fixture invalid");
}
if (report.runtimeRule.semanticDefaultOnlyForEligibleScopes !== true) {
  fail("eligible scope runtime rule");
}
if (report.runtimeRule.semanticActionMustBeEngineLegal !== true) {
  fail("engine legal runtime rule");
}
if (report.runtimeRule.rollbackOverridesSemanticDefault !== true) {
  fail("rollback runtime rule");
}
if (report.goNoGo.decision !== "semantic_default_for_eligible_scopes") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.fallbackRemoved !== false) fail("fallback removed");
if (report.goNoGo.blockedScopesSemanticDefault !== false) {
  fail("blocked scopes defaulted");
}
if (report.goNoGo.legacyRemovalReady !== false) fail("legacyRemovalReady");
for (const counter of [
  "engineRejectCount",
  "hiddenInfoViolationCount",
  "unsafeDivergenceCount",
  "publicPayloadDeltaCount",
  "determinismFailureCount",
]) {
  if (report.qualityGates[counter] !== 0) {
    fail(`quality counter must be zero: ${counter}`);
  }
}
if (!progress.completedSteps.includes("META17")) fail("progress missing META17");
if (progress.semanticDefaultActive !== true) fail("progress default inactive");

for (const requiredCode of [
  "META17_SEMANTIC_DEFAULT_ELIGIBLE_SCOPES_SCHEMA_VERSION",
  "META17_ELIGIBLE_SEMANTIC_DEFAULT_SCOPES",
  "META17_SEMANTIC_DEFAULT_FIXTURES",
  "buildMeta17SemanticDefaultEligibleScopesReport",
  "evaluateMeta17SemanticDefaultFixture",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "fallbackRemoved: true",
  "blockedScopesSemanticDefault: true",
  "legacyRemovalReady: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META17 Semantic Default for Eligible Scopes",
  "only for eligible scopes",
  "rollback guards",
  "fallback available",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 17 Semantic Default for Eligible Scopes",
  "semantic_default_for_eligible_scopes",
  "Nicht eligible Scopes bleiben Legacy-only",
  "Legacy-Fallback bleibt verfügbar",
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
  fail(`Unexpected changed files for META17: ${unexpectedChanges.join(", ")}`);
}

console.log("META17_SEMANTIC_DEFAULT_ELIGIBLE_SCOPES OK");

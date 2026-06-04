import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta16-broad-scoped-production-expansion-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta16-broad-scoped-production-expansion-report-2026-06-04.json";
const progressPath =
  "docs/reviews/ai/semantic-ai-meta13-meta18-progress-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath =
  "scripts/check-meta16-broad-scoped-production-expansion.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META16 check failed: ${message}`);
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

if (report.schemaVersion !== "meta16-broad-scoped-production-expansion-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META16") fail("step must be META16");
if (report.sourceStep !== "META15") fail("source step mismatch");
for (const scope of [
  "simple_run_choice",
  "remote_contest",
  "simple_hq_or_rnd_pressure",
]) {
  if (!report.activeProductionScopesAfter.includes(scope)) {
    fail(`active scope missing: ${scope}`);
  }
}
const productive = report.productionIterations.filter(
  (entry) => entry.productiveActivation === true,
);
if (productive.length !== 3) fail("productive iteration count");
if (new Set(productive.map((entry) => entry.iteration)).size !== productive.length) {
  fail("multiple scopes in one iteration");
}
const tracePayment = report.productionIterations.find(
  (entry) => entry.scopeId === "trace_payment",
);
if (!tracePayment || tracePayment.productiveActivation !== false) {
  fail("trace_payment must remain non-productive");
}
for (const counter of [
  "bulkActivationCount",
  "engineRejectCount",
  "hiddenInfoViolationCount",
  "unsafeDivergenceCount",
  "publicPayloadDeltaCount",
  "rollbackFailureCount",
  "humanReviewOpenCount",
]) {
  if (report.qualityGates[counter] !== 0) {
    fail(`quality counter must be zero: ${counter}`);
  }
}
if (report.qualityGates.oneScopePerIteration !== true) {
  fail("one-scope iteration gate");
}
if (report.qualityGates.scopeRegressionStatus !== "green") {
  fail("scope regression status");
}
if (report.goNoGo.decision !== "broad_scoped_production_active") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.globalSemanticDefaultAllowed !== false) {
  fail("global semantic default must stay false");
}
if (report.goNoGo.legacyRemovalReady !== false) fail("legacyRemovalReady");
if (!progress.completedSteps.includes("META16")) fail("progress missing META16");
if (!progress.activeProductionScopes.includes("remote_contest")) {
  fail("progress missing remote_contest");
}

for (const requiredCode of [
  "META16_BROAD_SCOPED_PRODUCTION_EXPANSION_SCHEMA_VERSION",
  "META16_PRODUCTION_ITERATIONS",
  "META16_SCOPE_GROUPS",
  "buildMeta16BroadScopedProductionExpansionReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "globalSemanticDefaultAllowed: true",
  "bulkActivationCount: 1",
  "legacyRemovalReady: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META16 Broad Scoped Production Expansion",
  "without a global semantic default",
  "one activation per iteration",
  "preserving rollback and fallback",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 16 Broad Scoped Production Expansion",
  "broad_scoped_production_active",
  "global_semantic_default",
  "keinen globalen Semantic Default",
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
  fail(`Unexpected changed files for META16: ${unexpectedChanges.join(", ")}`);
}

console.log("META16_BROAD_SCOPED_PRODUCTION_EXPANSION OK");

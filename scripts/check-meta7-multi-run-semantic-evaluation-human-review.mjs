import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta7-multi-run-semantic-evaluation-human-review-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta7-multi-run-semantic-evaluation-human-review-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath =
  "scripts/check-meta7-multi-run-semantic-evaluation-human-review.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META7 check failed: ${message}`);
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

if (report.schemaVersion !== "meta7-multi-run-semantic-evaluation-human-review-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META7") fail("step must be META7");
if (report.sourceStep !== "META6") fail("source step mismatch");
if (report.multiRunCorpus.runSetCount < 3) fail("run set count below minimum");
if (report.multiRunCorpus.decisionPointCount < 100) {
  fail("decision points below required minimum");
}
if (report.multiRunCorpus.decisionPointCount < 250) {
  fail("preferred decision point target not met");
}
if (report.multiRunCorpus.preferredDecisionPointTargetMet !== true) {
  fail("preferredDecisionPointTargetMet must be true");
}
if (report.humanReviewClosure.openHumanReviewItems !== 0) {
  fail("open human review items");
}
if (report.tacticalGoalLifecycleMetrics.goalWrongAbandonRate !== 0) {
  fail("goalWrongAbandonRate");
}
if (report.qualityGates.semanticDecisionAvailableRate < 0.85) {
  fail("semanticDecisionAvailableRate below gate");
}
if (report.qualityGates.semanticBlockedByGapRate > 0.05) {
  fail("semanticBlockedByGapRate above gate");
}
for (const counter of [
  "illegalSemanticDecisionCount",
  "hiddenInfoViolationCount",
  "engineRejectCount",
  "nonEngineLegalAssumptionCount",
  "determinismFailureCount",
  "publicPayloadDeltaCount",
  "unsafeDivergenceCount",
  "knownBadDecisionCount",
  "openHumanReviewItems",
  "goalWrongAbandonRate",
]) {
  if (report.qualityGates[counter] !== 0) {
    fail(`quality counter must be zero: ${counter}`);
  }
}
if (report.qualityGates.traceCompleteRate !== 1) fail("traceCompleteRate");
if (report.goNoGo.decision !== "internal_canary_ready_for_selected_scopes") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.productionReady !== false) fail("productionReady must be false");
if (report.goNoGo.legacyRemovalReady !== false) {
  fail("legacyRemovalReady must be false");
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.actualDecisionContract !== "legacy_only_during_meta7") {
  fail("actualDecisionContract");
}
if (!Array.isArray(report.scopeReadinessPromotions)) fail("scope promotions");
for (const blockedScope of [
  "access_trash_steal",
  "trace_payment",
  "damage_prevention",
  "multi_target_multi_ability",
]) {
  const entry = report.scopeReadinessPromotions.find(
    (candidate) => candidate.scopeId === blockedScope,
  );
  if (!entry || entry.outputStatus !== "blocked" || entry.promoted !== false) {
    fail(`blocked scope promotion invalid: ${blockedScope}`);
  }
}
for (const scope of [
  "basic_economy_draw",
  "tag_removal",
  "simple_score_advance",
  "simple_run_choice",
]) {
  const entry = report.scopeReadinessPromotions.find(
    (candidate) => candidate.scopeId === scope,
  );
  if (!entry || entry.outputStatus !== "internal_canary_ready") {
    fail(`limited candidate not promoted to internal canary: ${scope}`);
  }
}

for (const requiredCode of [
  "META7_MULTI_RUN_EVALUATION_SCHEMA_VERSION",
  "META7_MULTI_RUN_SETS",
  "META7_TACTICAL_GOAL_LIFECYCLE_METRICS",
  "META7_HUMAN_REVIEW_CLOSURE_ITEMS",
  "buildMeta7MultiRunSemanticEvaluationHumanReviewReport",
  "buildMeta7ScopeReadinessPromotions",
  "promoteMeta7ScopeStatus",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "productionReady: true",
  "legacyRemovalReady: true",
  "productiveUseAllowed: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "builds a multi-run corpus",
  "keeps all META7 hard gates green",
  "closes human review",
  "promotes only allowed readiness statuses",
  "not production ready",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 7 Multi-Run Semantic Evaluation + Human Review Closure",
  "actualDecision` bleibt in META 7 immer Legacy",
  "internal_canary_ready_for_selected_scopes",
  "Kein Legacy Removal",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

const allowedChangedFiles = [mdPath, jsonPath, codePath, testPath, scriptPath];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META7: ${unexpectedChanges.join(", ")}`);
}

console.log("META7_MULTI_RUN_SEMANTIC_EVALUATION_HUMAN_REVIEW OK");

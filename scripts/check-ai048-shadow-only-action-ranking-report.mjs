import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai048-shadow-only-action-ranking-report-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai048-shadow-only-action-ranking-report-2026-06-04.json";
const codePath = "packages/ai/src/shadow-scoring-diagnostics.ts";
const testPath = "packages/ai/src/shadow-scoring-diagnostics.test.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI048 check failed: ${message}`);
  process.exit(1);
}

function changedFiles() {
  const names = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
  ]) {
    const output = execFileSync("git", args, { encoding: "utf8" }).trim();
    if (!output) continue;
    for (const line of output.split(/\r?\n/)) names.add(line.trim());
  }
  return [...names].filter(Boolean).sort();
}

const md = read(mdPath);
const report = JSON.parse(read(jsonPath));
const code = read(codePath);
const test = read(testPath);

if (report.step !== "AI048") fail("JSON step must be AI048");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.schemaVersion !== "shadow-action-ranking-report-v1")
  fail("schemaVersion mismatch");
if (report.semanticExecutionAllowed !== false)
  fail("semanticExecutionAllowed must be false");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.rankingPolicy !== "status_bucket_then_fixture_order")
  fail("rankingPolicy mismatch");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

const expectedSummary = {
  scenarioCount: 14,
  candidateCount: 26,
  scoreDraftAvailable: 15,
  blockedByGap: 10,
  blockedByGate: 1,
  notScored: 0,
};
for (const [field, expected] of Object.entries(expectedSummary)) {
  if (report.fixtureSummary[field] !== expected) {
    fail(`fixtureSummary.${field} expected ${expected}`);
  }
}

for (const requiredBucket of [
  "score_draft_available",
  "blocked_by_gap",
  "blocked_by_gate",
  "not_scored",
]) {
  if (!report.reportOnlyBuckets.includes(requiredBucket)) {
    fail(`report bucket missing: ${requiredBucket}`);
  }
}

for (const requiredCode of [
  "SHADOW_ACTION_RANKING_REPORT_SCHEMA_VERSION",
  "buildShadowActionRankingReport",
  "status_bucket_then_fixture_order",
  "reportOnlyOrderIndex",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "chooseSemanticAiAction",
  "applyAction(",
  "getLegalActions(",
  "selectedActionId",
  "rankedAlternatives",
  "plannerWeight",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}

for (const runtimeFile of [
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
]) {
  if (read(runtimeFile).includes("shadow-scoring-diagnostics")) {
    fail(`runtime file imports shadow diagnostics: ${runtimeFile}`);
  }
}

for (const requiredText of [
  "keine produktive Rangfolge",
  "keine Action-Auswahl",
  "kein Live-Scoring",
  "keine Planner-Gewichte",
  "keine Runtime-Anbindung",
  "keine Hidden-Info-Projektion",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "creates report-only shadow ordering",
  "Orders available report-only candidates before blocked gap candidates".replace(
    "Orders",
    "orders",
  ),
  "keeps hidden-info fixtures blocked by gate",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai048-shadow-only-action-ranking-report.mjs",
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI048: ${unexpectedChanges.join(", ")}`);
}

console.log("AI048_SHADOW_ONLY_ACTION_RANKING_REPORT OK candidates=26");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai055-deviation-taxonomy-and-triage-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai055-deviation-taxonomy-and-triage-2026-06-04.json";
const humanReviewPath =
  "docs/reviews/ai/ai055-deviation-human-review-list-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI055 check failed: ${message}`);
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
const humanReview = JSON.parse(read(humanReviewPath));
const code = read(codePath);
const test = read(testPath);
const progress = JSON.parse(read(progressPath));

if (report.step !== "AI055") fail("JSON step must be AI055");
if (report.schemaVersion !== "shadow-deviation-triage-v1")
  fail("schemaVersion mismatch");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.humanReviewStopsProcess !== false)
  fail("humanReviewStopsProcess must be false");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

const expectedSummary = {
  comparisonCount: 33,
  triageEntryCount: 41,
  humanReviewItemCount: 33,
  acceptableDifference: 8,
  missingTargetContext: 13,
  missingAbilityBinding: 6,
  missingCostOrTiming: 4,
  needsCardSemanticsReview: 7,
  hiddenInfoBlocker: 3,
};
for (const [field, value] of Object.entries(expectedSummary)) {
  if (report.summary?.[field] !== value) {
    fail(`summary mismatch for ${field}: ${report.summary?.[field]}`);
  }
}

for (const triageClass of [
  "acceptable_difference",
  "semantic_improvement_candidate",
  "legacy_preferred",
  "semantic_gap",
  "missing_tactic_signal",
  "missing_target_context",
  "missing_ability_binding",
  "missing_cost_or_timing",
  "bad_goal_mapping",
  "bad_doctrine_context",
  "bad_risk_evaluation",
  "hidden_info_blocker",
  "legal_or_reachability_blocker",
  "needs_card_semantics_review",
  "needs_engine_payload_projection",
]) {
  if (!report.taxonomy.includes(triageClass)) {
    fail(`taxonomy class missing: ${triageClass}`);
  }
}

if (humanReview.summary?.humanReviewItemCount !== 33) {
  fail("human review list count mismatch");
}
if (humanReview.humanReviewStopsProcess !== false) {
  fail("human review list must not stop process");
}
if (humanReview.productiveChangeAllowed !== false) {
  fail("human review list must not allow productive change");
}
if (!Array.isArray(humanReview.items) || humanReview.items.length !== 33) {
  fail("human review items length mismatch");
}

for (const requiredCode of [
  "DEVIATION_TRIAGE_SCHEMA_VERSION",
  "DeviationTriageClass",
  "buildDeviationTriageReport",
  "buildHumanReviewList",
  "separate_semantics_followup",
  "productiveChangeAllowed: false",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "createPlayerAction",
  "liveScore",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}

for (const runtimeFile of [
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
]) {
  if (read(runtimeFile).includes("controlled-shadow-mode")) {
    fail(`runtime file imports controlled shadow mode: ${runtimeFile}`);
  }
}

for (const requiredText of [
  "Human-Review list",
  "Human-review items | 33",
  "`missing_target_context` | 13",
  "separate_semantics_followup",
  "AI055 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "assigns a triage class to every comparison delta",
  "generates a human-review list without stopping the process",
  "maps target, ability, cost, card and hidden-info gaps",
  "keeps triage followups separate from shadow code changes",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI055")) {
  fail("progress must include AI055");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  humanReviewPath,
  codePath,
  testPath,
  "scripts/check-ai055-deviation-taxonomy-and-triage.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI055: ${unexpectedChanges.join(", ")}`);
}

console.log("AI055_DEVIATION_TAXONOMY_AND_TRIAGE OK humanReview=33");

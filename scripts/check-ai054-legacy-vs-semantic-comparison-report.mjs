import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai054-legacy-vs-semantic-comparison-report-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai054-legacy-vs-semantic-comparison-report-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI054 check failed: ${message}`);
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
const progress = JSON.parse(read(progressPath));

if (report.step !== "AI054") fail("JSON step must be AI054");
if (report.schemaVersion !== "legacy-semantic-shadow-comparison-v1")
  fail("schemaVersion mismatch");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.semanticExecutionAllowed !== false)
  fail("semanticExecutionAllowed must be false");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");
if (report.legacyReferenceSource !== "synthetic_fixture_legal_action_order") {
  fail("legacyReferenceSource mismatch");
}

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

const expectedSummary = {
  comparisonCount: 33,
  sameAction: 8,
  sameActionType: 0,
  differentButPlausible: 0,
  semanticBetterCandidate: 0,
  legacyBetterCandidate: 0,
  semanticBlocked: 25,
  comparisonUnavailable: 0,
  hardGateErrorCount: 0,
  hiddenInfoBasedSemanticDecisionCount: 0,
  unreachableSemanticDecisionCount: 0,
  nonEngineLegalSemanticDecisionCount: 0,
};
for (const [field, value] of Object.entries(expectedSummary)) {
  if (report.summary?.[field] !== value) {
    fail(`summary mismatch for ${field}: ${report.summary?.[field]}`);
  }
}

for (const category of [
  "same_exact_action",
  "semantic_blocked_by_target_context",
  "semantic_blocked_by_ability_gap",
  "semantic_blocked_by_cost_gap",
  "semantic_lacks_card_semantics",
  "semantic_avoids_hidden_info",
]) {
  if (!report.deltaCategories.includes(category)) {
    fail(`delta category missing: ${category}`);
  }
}

for (const requiredCode of [
  "LEGACY_SEMANTIC_SHADOW_COMPARISON_SCHEMA_VERSION",
  "LegacySemanticComparison",
  "buildLegacySemanticComparisonReport",
  "synthetic_fixture_legal_action_order",
  "semantic_blocked_by_target_context",
  "semantic_avoids_hidden_info",
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
  "synthetic_fixture_legal_action_order",
  "`same_action` | 8",
  "`semantic_blocked` | 25",
  "Hard gate errors | 0",
  "AI054 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "creates one comparison for every semantic shadow fixture",
  "marks ranked synthetic legacy and semantic references as same action",
  "categorizes semantic target and ability gap blocks",
  "keeps hidden-info semantic cases blocked instead of selecting them",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI054")) {
  fail("progress must include AI054");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai053-semantic-shadow-decision-v0.mjs",
  "scripts/check-ai054-legacy-vs-semantic-comparison-report.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI054: ${unexpectedChanges.join(", ")}`);
}

console.log("AI054_LEGACY_VS_SEMANTIC_COMPARISON_REPORT OK comparisons=33");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai050-hard-gate-rollback-readiness-review-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai050-hard-gate-rollback-readiness-review-2026-06-04.json";
const codePath = "packages/ai/src/shadow-scoring-diagnostics.ts";
const testPath = "packages/ai/src/shadow-scoring-diagnostics.test.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI050 check failed: ${message}`);
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

if (report.step !== "AI050") fail("JSON step must be AI050");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.schemaVersion !== "hard-gate-rollback-readiness-review-v1")
  fail("schemaVersion mismatch");
if (report.broaderShadowSimulationReadiness !== "ready_with_constraints")
  fail("broader shadow readiness mismatch");
if (report.productiveCutoverReadiness !== "blocked")
  fail("productive cutover must be blocked");
if (report.recommendedNextStep !== "broader_shadow_simulation")
  fail("recommendedNextStep mismatch");
if (report.semanticExecutionAllowed !== false)
  fail("semanticExecutionAllowed must be false");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredGate of [
  "target_context",
  "ability_resolution",
  "card_semantics",
  "runtime_feature_flag",
]) {
  if (!report.blockedCutoverGates.includes(requiredGate)) {
    fail(`blocked cutover gate missing: ${requiredGate}`);
  }
}

for (const flag of report.proposedFeatureFlags) {
  if (flag.defaultState !== "off") {
    fail(`feature flag must default off: ${flag.flagId}`);
  }
}

for (const requiredMissing of [
  "broader_shadow_simulation_results",
  "zero_hidden_info_violations_in_shadow",
  "zero_illegal_semantic_references",
  "runtime_feature_flags_with_rollback",
]) {
  if (!report.missingBeforeCutover.includes(requiredMissing)) {
    fail(`missingBeforeCutover entry missing: ${requiredMissing}`);
  }
}

for (const requiredCode of [
  "HARD_GATE_ROLLBACK_READINESS_REVIEW_SCHEMA_VERSION",
  "buildHardGateRollbackReadinessReviewReport",
  "productiveCutoverReadiness",
  "proposedSemanticFeatureFlags",
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
  "Produktiver Cutover ist nicht freigegeben",
  "keine produktive Action-Auswahl",
  "keine semantische Ausführung",
  "kein Live-Scoring",
  "keine Planner-Gewichte",
  "keine Runtime-Anbindung",
  "keine Hidden-Info-Projektion",
  "keinen Feature-Flag-Cutover",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "allows broader shadow simulation but blocks productive cutover",
  "keeps unresolved top gaps as cutover blockers",
  "documents proposed feature flags as default-off rollback candidates",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai050-hard-gate-rollback-readiness-review.mjs",
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI050: ${unexpectedChanges.join(", ")}`);
}

console.log("AI050_HARD_GATE_ROLLBACK_READINESS_REVIEW OK cutover=blocked");

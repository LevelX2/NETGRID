import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai053-semantic-shadow-decision-v0-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai053-semantic-shadow-decision-v0-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI053 check failed: ${message}`);
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

if (report.step !== "AI053") fail("JSON step must be AI053");
if (report.schemaVersion !== "semantic-shadow-decision-v0")
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

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

const expectedSummary = {
  scenarioCount: 33,
  rankedShadowOnly: 8,
  blockedByGate: 3,
  blockedByGap: 22,
  noCandidate: 0,
  notScored: 0,
  selectedActionCount: 8,
  runtimeConsumerCount: 0,
  illegalSemanticDecisionCount: 0,
  hiddenInfoViolationCount: 0,
};
for (const [field, value] of Object.entries(expectedSummary)) {
  if (report.summary?.[field] !== value) {
    fail(`summary mismatch for ${field}: ${report.summary?.[field]}`);
  }
}

if (report.scoreStatusPolicy?.rankingPolicy !==
  "deterministic_input_order_without_numeric_planner_weight") {
  fail("rankingPolicy must remain deterministic input order");
}

for (const requiredCode of [
  "SEMANTIC_SHADOW_DECISION_SCHEMA_VERSION",
  "SemanticShadowDecision",
  "buildSemanticShadowDecisionForFixture",
  "buildSemanticShadowDecisionReport",
  "blocked_by_gate",
  "blocked_by_gap",
  "ranked_shadow_only",
  "noRuntimeEffect: true",
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
  "Hard gates before ranking",
  "`blocked_by_gate` | 3",
  "`blocked_by_gap` | 22",
  "Runtime consumers | 0",
  "AI053 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "computes semantic shadow decisions for every AI052 fixture",
  "selects only a synthetic LegalAction candidate",
  "blocks target, ability, card and cost gaps without guessing semantics",
  "keeps hidden-info boundary scenarios blocked by gate",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI053")) {
  fail("progress must include AI053");
}
if (progress.currentStep !== "AI054") fail("progress currentStep must be AI054");
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai052-shadow-scenario-corpus.mjs",
  "scripts/check-ai053-semantic-shadow-decision-v0.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI053: ${unexpectedChanges.join(", ")}`);
}

console.log("AI053_SEMANTIC_SHADOW_DECISION_V0 OK ranked=8 blocked=25");

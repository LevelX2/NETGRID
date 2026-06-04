import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai047-shadow-scoring-fixture-design-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai047-shadow-scoring-fixture-design-2026-06-04.json";
const codePath = "packages/ai/src/shadow-scoring-diagnostics.ts";
const testPath = "packages/ai/src/shadow-scoring-diagnostics.test.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI047 check failed: ${message}`);
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

if (report.step !== "AI047") fail("JSON step must be AI047");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.schemaVersion !== "shadow-scoring-fixture-design-v1")
  fail("schemaVersion mismatch");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");
if (report.fixtureCorpus.runnerFixtureCount < 7)
  fail("runner fixture count must be at least 7");
if (report.fixtureCorpus.corpFixtureCount < 7)
  fail("corp fixture count must be at least 7");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredGap of [
  "target_context_unavailable",
  "ability_unresolved",
  "card_semantics_unavailable",
]) {
  if (!report.blockedGapPolicy.topGaps.includes(requiredGap)) {
    fail(`top gap missing: ${requiredGap}`);
  }
}

for (const requiredGate of [
  "engine_legal_action",
  "hidden_info",
  "side_visibility",
  "runtime_no_effect",
  "target_context",
  "ability_resolution",
  "cost_known",
  "timing_known",
]) {
  if (!report.hardGateMatrix.includes(requiredGate)) {
    fail(`hard gate missing: ${requiredGate}`);
  }
}

for (const forbiddenField of ["liveScore", "runtimeRank", "selectedAction"]) {
  if (!report.scoreDraftSchema.forbiddenFields.includes(forbiddenField)) {
    fail(`score draft forbidden field missing: ${forbiddenField}`);
  }
}

for (const requiredCode of [
  "SHADOW_SCORING_FIXTURE_DESIGN_SCHEMA_VERSION",
  "DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS",
  "DEFAULT_SHADOW_HARD_GATE_MATRIX",
  "buildShadowScoringFixtureDesignReport",
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
  "kein produktives Scoring",
  "keine Action-Auswahl",
  "keine Planner-Gewichte",
  "keine Runtime-Anbindung",
  "keine Hidden-Info-Projektion",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "defines a runner and corp fixture corpus",
  "carries the documented top gaps",
  "keeps the score draft schema report-only",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai047-shadow-scoring-fixture-design.mjs",
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI047: ${unexpectedChanges.join(", ")}`);
}

console.log("AI047_SHADOW_SCORING_FIXTURE_DESIGN OK fixtures=14");

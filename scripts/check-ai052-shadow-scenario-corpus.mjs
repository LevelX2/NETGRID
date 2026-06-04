import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/ai052-shadow-scenario-corpus-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai052-shadow-scenario-corpus-2026-06-04.json";
const corpusPath =
  "data/scenarios/ai052-shadow-scenario-corpus-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI052 check failed: ${message}`);
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
const corpus = JSON.parse(read(corpusPath));
const code = read(codePath);
const test = read(testPath);
const progress = JSON.parse(read(progressPath));

if (report.step !== "AI052") fail("JSON step must be AI052");
if (report.schemaVersion !== "shadow-scenario-corpus-v1")
  fail("schemaVersion mismatch");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.fixtureRef !== corpusPath) fail("fixtureRef mismatch");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

if (corpus.schemaVersion !== "shadow-scenario-corpus-v1")
  fail("corpus schemaVersion mismatch");
if (!Array.isArray(corpus.fixtures)) fail("corpus fixtures must be an array");
if (corpus.fixtures.length !== 33) fail("corpus must contain 33 fixtures");

for (const scenarioId of report.requiredScenarioIds) {
  if (!corpus.fixtures.some((fixture) => fixture.scenarioId === scenarioId)) {
    fail(`required scenario missing from corpus: ${scenarioId}`);
  }
}

const runnerCount = corpus.fixtures.filter((fixture) => fixture.side === "runner")
  .length;
const corpCount = corpus.fixtures.filter((fixture) => fixture.side === "corp")
  .length;
if (runnerCount < 13) fail("runner scenario count must be at least 13");
if (corpCount < 13) fail("corp scenario count must be at least 13");

for (const fixture of corpus.fixtures) {
  if (fixture.setupKind !== "synthetic_legal_actions") {
    fail(`AI052 fixture must stay synthetic: ${fixture.scenarioId}`);
  }
  if (!Array.isArray(fixture.expectedLegalActionTypes)) {
    fail(`expectedLegalActionTypes missing: ${fixture.scenarioId}`);
  }
  if (fixture.expectedLegalActionTypes.length === 0) {
    fail(`expectedLegalActionTypes empty: ${fixture.scenarioId}`);
  }
  if (!Array.isArray(fixture.expectedTacticalGoals)) {
    fail(`expectedTacticalGoals missing: ${fixture.scenarioId}`);
  }
  if (fixture.expectedTacticalGoals.length === 0) {
    fail(`expectedTacticalGoals empty: ${fixture.scenarioId}`);
  }
  if (!Array.isArray(fixture.requiredCandidateFields)) {
    fail(`requiredCandidateFields missing: ${fixture.scenarioId}`);
  }
  if (!Array.isArray(fixture.hiddenInfoBoundary)) {
    fail(`hiddenInfoBoundary missing: ${fixture.scenarioId}`);
  }
  if (fixture.hiddenInfoBoundary.length < 2) {
    fail(`hiddenInfoBoundary too small: ${fixture.scenarioId}`);
  }
  if (fixture.allowedShadow !== true) {
    fail(`allowedShadow must be true for AI052: ${fixture.scenarioId}`);
  }
}

for (const requiredGap of [
  "target_context_unavailable",
  "ability_unresolved",
  "card_semantics_unavailable",
  "cost_unknown",
  "hidden_info_blocked",
]) {
  if (!report.knownProjectionGaps.includes(requiredGap)) {
    fail(`knownProjectionGaps missing: ${requiredGap}`);
  }
}

for (const requiredCode of [
  "SHADOW_SCENARIO_CORPUS_SCHEMA_VERSION",
  "ShadowScenarioFixture",
  "DEFAULT_SHADOW_SCENARIO_CORPUS",
  "buildShadowScenarioCorpusReport",
  "hiddenInfoBoundary",
  "knownProjectionGaps",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
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
  "Scenario count | 33",
  "Runtime-backed scenarios | 0",
  "Known gaps are documented, not guessed",
  "AI052 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "defines the required runner, corp and advanced shadow scenarios",
  "marks known projection gaps instead of guessing missing semantics",
  "requires an explicit hidden-info boundary on every fixture",
  "keeps the corpus diagnostic with no runtime effect",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI052")) {
  fail("progress must include AI052");
}
if (progress.currentStep !== "AI053") fail("progress currentStep must be AI053");
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  corpusPath,
  codePath,
  testPath,
  "scripts/check-ai051-shadow-mode-trace-contract.mjs",
  "scripts/check-ai052-shadow-scenario-corpus.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI052: ${unexpectedChanges.join(", ")}`);
}

console.log("AI052_SHADOW_SCENARIO_CORPUS OK scenarios=33");

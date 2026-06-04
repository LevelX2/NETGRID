import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta1-deck-doctrine-tactical-goal-engine-v0-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta1-deck-doctrine-tactical-goal-engine-v0-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-core-meta.ts";
const testPath = "packages/ai/src/semantic-ai-core-meta.test.ts";
const progressPath =
  "docs/reviews/ai/semantic-ai-core-meta-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META1 check failed: ${message}`);
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
const progress = JSON.parse(read(progressPath));

if (report.schemaVersion !== "meta1-deck-doctrine-tactical-goal-engine-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META1") fail("step must be META1");
if (report.inputBaseline.previousReadiness !== "broad_shadow_ready") {
  fail("baseline readiness mismatch");
}
if (report.inputBaseline.cutoverAllowed !== false) fail("cutover must be false");
if (report.schemaCoverage.deckStrategicProfileSchema !== true) {
  fail("DeckStrategicProfile schema not covered");
}
if (report.schemaCoverage.deckDoctrineSchema !== true) {
  fail("DeckDoctrine schema not covered");
}
if (report.schemaCoverage.tacticalGoalStateSchema !== true) {
  fail("TacticalGoalState schema not covered");
}
if (report.schemaCoverage.neutralDoctrineRule !== true) {
  fail("NeutralDoctrine rule not covered");
}
if (report.schemaCoverage.runnerGoalFamilies !== 13) fail("runner goal count");
if (report.schemaCoverage.corpGoalFamilies !== 11) fail("corp goal count");
if (report.schemaCoverage.boardstatePivotRules < 8) fail("pivot rule count");
if (report.boardstateOverrideExampleCount < 4) {
  fail("boardstate override examples missing");
}
if (report.tacticalGoalStateCount <= 0) fail("goal states missing");

for (const [gate, value] of Object.entries(report.gates ?? {})) {
  if (value !== true) fail(`gate must pass: ${gate}`);
}
for (const [gate, value] of Object.entries(report.hardGates ?? {})) {
  if (value !== 0) fail(`hard gate must be zero: ${gate}`);
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect");

for (const requiredCode of [
  "type DeckStrategicProfile",
  "type DeckDoctrine",
  "type TacticalGoalState",
  "neutralDoctrine",
  "META1_PIVOT_RULES",
  "META1_BOARDSTATE_OVERRIDE_EXAMPLES",
  "buildMeta1DeckDoctrineTacticalGoalEngineReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "PlayerAction",
  "plannerWeight:",
  "selectedActionId",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "keeps NeutralDoctrine from inventing a primary strategy",
  "models multi-turn TacticalGoalState lifecycle",
  "makes Boardstate able to override Doctrine",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 1 DeckDoctrine + Multi-Turn TacticalGoal Engine v0",
  "NeutralDoctrine",
  "Boardstate-Pivot-Regeln",
  "Keine produktive Action-Auswahl",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

if (!progress.completedSteps.includes("META1")) {
  fail("progress missing META1");
}
if (progress.currentStep !== "META1_done") {
  fail("progress currentStep must be META1_done");
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-meta1-deck-doctrine-tactical-goal-engine-v0.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META1: ${unexpectedChanges.join(", ")}`);
}

console.log("META1_DECK_DOCTRINE_TACTICAL_GOAL_ENGINE OK");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/ai045-tactical-goal-taxonomy-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai045-tactical-goal-taxonomy-2026-06-04.json";
const codePath = "packages/ai/src/action-doctrine-goal-diagnostics.ts";
const testPath = "packages/ai/src/action-doctrine-goal-diagnostics.test.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI045 check failed: ${message}`);
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

if (report.step !== "AI045") fail("JSON step must be AI045");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.schemaVersion !== "tactical-goal-taxonomy-diagnostic-schema-v1")
  fail("schemaVersion mismatch");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.numericPriorityDeferred !== true)
  fail("numeric priorities must be deferred");
if (report.goalCount !== 10 || report.runnerGoalCount !== 5 || report.corpGoalCount !== 5)
  fail("expected 10 goals split 5/5");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredFamily of [
  "runner_remote_contest",
  "runner_survival",
  "corp_remote_score_window",
  "corp_tag_trace_punish",
]) {
  if (!report.goalFamilies.includes(requiredFamily)) {
    fail(`goal family missing: ${requiredFamily}`);
  }
}

for (const requiredCode of [
  "TACTICAL_GOAL_TAXONOMY_SCHEMA_VERSION",
  "DEFAULT_TACTICAL_GOAL_TAXONOMY",
  "buildTacticalGoalTaxonomyDiagnosticReport",
  "validateTacticalGoalTaxonomy",
  "removalCondition",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "chooseSemanticAiAction",
  "applyAction(",
  "getLegalActions(",
  "rankedAlternatives",
  "selectedActionId",
  "numericActionScore",
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
  if (read(runtimeFile).includes("action-doctrine-goal-diagnostics")) {
    fail(`runtime file imports diagnostics: ${runtimeFile}`);
  }
}

for (const requiredText of [
  "keine produktive TacticalGoal-Generation",
  "keine numerischen Action-Scores",
  "keine Rangliste",
  "keine Action-Auswahl",
  "keine Runtime-Anbindung",
  "keine Hidden-Info-Projektion",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "reports a side-balanced diagnostic TacticalGoal taxonomy",
  "keeps blocker removal conditions explicit",
  "surfaces invalid taxonomy definitions",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai045-tactical-goal-taxonomy.mjs",
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI045: ${unexpectedChanges.join(", ")}`);
}

console.log("AI045_TACTICAL_GOAL_TAXONOMY OK goals=10");

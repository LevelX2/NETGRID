import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai046-action-goal-mapping-report-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai046-action-goal-mapping-report-2026-06-04.json";
const codePath = "packages/ai/src/action-doctrine-goal-diagnostics.ts";
const testPath = "packages/ai/src/action-doctrine-goal-diagnostics.test.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI046 check failed: ${message}`);
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

if (report.step !== "AI046") fail("JSON step must be AI046");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.schemaVersion !== "action-to-goal-mapping-diagnostic-report-v1")
  fail("schemaVersion mismatch");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

const expectedFixture = {
  candidateFixtureCount: 3,
  tacticalGoalCount: 10,
  totalMappings: 30,
  compatible: 3,
  blocked: 2,
  unknown: 10,
  notApplicable: 15,
};
for (const [field, expected] of Object.entries(expectedFixture)) {
  if (report.fixtureSummary[field] !== expected) {
    fail(`fixtureSummary.${field} expected ${expected}`);
  }
}

for (const requiredStatus of [
  "compatible",
  "blocked",
  "unknown",
  "not_applicable",
]) {
  if (!report.mappingStatuses.includes(requiredStatus)) {
    fail(`mapping status missing: ${requiredStatus}`);
  }
}

for (const requiredCode of [
  "ACTION_TO_GOAL_MAPPING_DIAGNOSTIC_SCHEMA_VERSION",
  "buildActionToGoalDiagnosticMappingReport",
  "buildActionGoalDiagnosticMapping",
  "candidateSatisfiesRequirement",
  "inputOrder",
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
  "nichts sortiert",
  "nichts gerankt",
  "nichts numerisch bewertet",
  "keine Action ausgewählt",
  "keine Runtime-Anbindung",
  "keine Hidden-Info-Projektion",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "builds an input-ordered diagnostic mapping table",
  "blocks hidden-info mappings",
  "marks missing evidence as unknown",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai046-action-goal-mapping-report.mjs",
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI046: ${unexpectedChanges.join(", ")}`);
}

console.log("AI046_ACTION_GOAL_MAPPING_REPORT OK mappings=30");

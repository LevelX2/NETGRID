import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai049-legacy-vs-semantic-comparison-harness-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai049-legacy-vs-semantic-comparison-harness-2026-06-04.json";
const codePath = "packages/ai/src/shadow-scoring-diagnostics.ts";
const testPath = "packages/ai/src/shadow-scoring-diagnostics.test.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI049 check failed: ${message}`);
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

if (report.step !== "AI049") fail("JSON step must be AI049");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.schemaVersion !== "legacy-semantic-comparison-harness-v1")
  fail("schemaVersion mismatch");
if (report.semanticExecutionAllowed !== false)
  fail("semanticExecutionAllowed must be false");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

const expectedSummary = {
  scenarioCount: 14,
  comparedScenarios: 6,
  sameReference: 2,
  safeDivergence: 1,
  riskyDivergence: 1,
  insufficientEvidence: 2,
  notCompared: 8,
};
for (const [field, expected] of Object.entries(expectedSummary)) {
  if (report.summary[field] !== expected) {
    fail(`summary.${field} expected ${expected}`);
  }
}

for (const requiredCategory of [
  "same_reference",
  "safe_divergence",
  "risky_divergence",
  "insufficient_evidence",
  "not_compared",
]) {
  if (!report.comparisonCategories.includes(requiredCategory)) {
    fail(`comparison category missing: ${requiredCategory}`);
  }
}

for (const requiredCode of [
  "LEGACY_SEMANTIC_COMPARISON_HARNESS_SCHEMA_VERSION",
  "buildLegacySemanticComparisonHarnessReport",
  "DEFAULT_LEGACY_ACTION_REFERENCES",
  "risky_divergence",
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
  "keine produktive Action-Auswahl",
  "keine semantische Ausführung",
  "kein Live-Scoring",
  "keine Planner-Gewichte",
  "keine Runtime-Anbindung",
  "keine Hidden-Info-Projektion",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "compares legacy references against semantic report-only references",
  "surfaces risky legacy divergence",
  "marks fully blocked semantic references as insufficient evidence",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai049-legacy-vs-semantic-comparison-harness.mjs",
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI049: ${unexpectedChanges.join(", ")}`);
}

console.log("AI049_LEGACY_VS_SEMANTIC_COMPARISON_HARNESS OK compared=6");

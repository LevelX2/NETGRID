import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/ai042-action-semantics-coverage-report-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai042-action-semantics-coverage-report-2026-06-04.json";
const sharedPath = "packages/shared/src/index.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI042 check failed: ${message}`);
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

function extractActionTypes(sharedSource) {
  const match = sharedSource.match(/export type ActionType =([\s\S]*?);/);
  if (!match) fail("ActionType union not found");
  return [...match[1].matchAll(/\|\s*"([^"]+)"/g)].map((entry) => entry[1]);
}

const md = read(mdPath);
const report = JSON.parse(read(jsonPath));
const actionTypes = extractActionTypes(read(sharedPath));

if (report.step !== "AI042") fail("JSON step must be AI042");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");
if (report.totalLegalActions !== actionTypes.length)
  fail("totalLegalActions must match shared ActionType count");
if (report.neutralProjected !== report.totalLegalActions)
  fail("neutralProjected must equal totalLegalActions");
if (report.gates.neutralProjectionCoveragePercent !== 100)
  fail("neutralProjectionCoveragePercent must be 100");
for (const zeroGate of [
  "hiddenInfoLeaks",
  "runtimeBehaviorChanges",
  "actionSelectionChanges",
  "nonEngineLegalAssumptions",
  "plannerConsumers",
  "scoringConsumers",
]) {
  if (report.gates[zeroGate] !== 0) fail(`${zeroGate} must be 0`);
}

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

if (!Array.isArray(report.scenarioCoverage) || report.scenarioCoverage.length < 8)
  fail("scenarioCoverage must include the documented minimum groups");
for (const scenario of report.scenarioCoverage) {
  if (scenario.neutralProjected !== scenario.totalLegalActions)
    fail(`Scenario ${scenario.scenarioId} is not 100 percent neutral projected`);
}

for (const requiredGap of [
  "target_context_unavailable",
  "ability_unresolved",
  "card_semantics_unavailable",
]) {
  if (!report.topGapCategories.some((entry) => entry.category === requiredGap))
    fail(`Missing top gap category ${requiredGap}`);
}

for (const requiredText of [
  "32/32",
  "Hidden-Info-Leaks | 0",
  "Runtime-Verhaltensänderungen | 0",
  "Action-Selection-Änderungen | 0",
  "keine Action-Auswahl",
  "kein Scoring",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  "docs/reviews/ai/action-semantics-bridge-progress-2026-06-04.json",
  "scripts/check-ai042-action-semantics-coverage-report.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI042: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI042_ACTION_SEMANTICS_COVERAGE_REPORT OK total=${report.totalLegalActions} neutral=${report.neutralProjected}`,
);

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const schemaPath = "packages/ai/src/action-semantic-candidate.ts";
const testPath = "packages/ai/src/action-semantic-candidate.test.ts";
const sharedPath = "packages/shared/src/index.ts";
const mdPath = "docs/reviews/ai/ai036-neutral-legal-action-projection-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai036-neutral-legal-action-projection-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI036 check failed: ${message}`);
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
  return [...match[1].matchAll(/\|\s*"([^"]+)"/g)].map((entry) => entry[1]).sort();
}

function extractFixtureActionTypes(testSource) {
  const match = testSource.match(/const ALL_ACTION_TYPES = \[([\s\S]*?)\] as const/);
  if (!match) fail("ALL_ACTION_TYPES fixture not found");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]).sort();
}

const schema = read(schemaPath);
const testSource = read(testPath);
const md = read(mdPath);
const report = JSON.parse(read(jsonPath));
const sharedActionTypes = extractActionTypes(read(sharedPath));
const fixtureActionTypes = extractFixtureActionTypes(testSource);

if (report.step !== "AI036") fail("JSON step must be AI036");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");
if (report.metrics.totalLegalActions !== sharedActionTypes.length)
  fail("totalLegalActions must match current shared ActionType count");
if (report.metrics.neutralProjected !== report.metrics.totalLegalActions)
  fail("neutralProjected must be 100 percent of the documented corpus");
if (report.metrics.semanticActionTypeKnown !== 0)
  fail("AI036 must not classify semanticActionType");
if (JSON.stringify(fixtureActionTypes) !== JSON.stringify(sharedActionTypes))
  fail("AI036 fixture must contain exactly the current shared ActionType union");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredText of [
  "export function buildActionSemanticCandidates",
  "export function buildNeutralActionSemanticCandidate",
  'primaryProjectionStatus: "neutral_projected"',
  'semanticActionType: "unknown"',
  "projectionIssues: []",
]) {
  if (!schema.includes(requiredText)) fail(`Builder missing required text: ${requiredText}`);
}

for (const forbiddenText of ["applyAction", "chooseAction", "rankAction", "scoreAction"]) {
  if (schema.includes(forbiddenText)) fail(`Builder must not reference ${forbiddenText}`);
}

for (const requiredText of [
  "keine Legalität",
  "wählt keine Aktion",
  "scored keine Aktion",
  "Payload-Werte werden in AI036 nicht in den Candidate projiziert",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

const forbiddenRuntimeFiles = [
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
  "packages/engine/src/game/legal-actions.ts",
  "packages/shared/src/index.ts",
];

for (const file of forbiddenRuntimeFiles) {
  if (read(file).includes("action-semantic-candidate")) {
    fail(`Runtime/decision file imports action-semantic-candidate: ${file}`);
  }
}

const allowedChangedFiles = [
  schemaPath,
  testPath,
  mdPath,
  jsonPath,
  "docs/reviews/ai/action-semantics-bridge-progress-2026-06-04.json",
  "scripts/check-ai036-neutral-legal-action-projection.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI036: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI036_NEUTRAL_LEGAL_ACTION_PROJECTION OK total=${report.metrics.totalLegalActions} neutral=${report.metrics.neutralProjected}`,
);

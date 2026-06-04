import { execFileSync } from "node:child_process";
import fs from "node:fs";

const schemaPath = "packages/ai/src/action-semantic-candidate.ts";
const testPath = "packages/ai/src/action-semantic-candidate.test.ts";
const mdPath = "docs/reviews/ai/ai038-card-action-source-binding-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai038-card-action-source-binding-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI038 check failed: ${message}`);
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

const schema = read(schemaPath);
const testSource = read(testPath);
const md = read(mdPath);
const report = JSON.parse(read(jsonPath));

if (report.step !== "AI038") fail("JSON step must be AI038");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");
if (report.metrics.sourceBound !== 4) fail("AI038 fixture sourceBound must be 4");
if (report.metrics.abilityUnresolved !== 1) fail("AI038 fixture must keep one unresolved ability case");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredText of [
  "export type SideSafeActionAbilityBinding",
  "function sourceCardIdForAction",
  "function abilityBindingForAction",
  '"explicit_ability_id"',
  '"engine_payload"',
  '"single_legal_ability_inferred"',
  '"unresolved"',
]) {
  if (!schema.includes(requiredText)) fail(`Schema missing ${requiredText}`);
}

for (const forbiddenText of [
  "ai-card-hints",
  "hint-ontology",
  "inspector",
  "deck-doctrine",
  "fullGameState",
  "hiddenZone",
  "cardImplementationAbilityIndex",
]) {
  if (schema.includes(forbiddenText)) fail(`AI038 builder must not reference ${forbiddenText}`);
}

for (const requiredText of [
  "binds card source and ability only from side-safe LegalAction evidence",
  "sideSafeAbilityBindings",
  "explicit_ability_id",
  "engine_payload",
  "single_legal_ability_inferred",
  "ability_unresolved",
]) {
  if (!testSource.includes(requiredText)) fail(`Test missing ${requiredText}`);
}

for (const requiredText of [
  "keine Card-Hint",
  "cardImplementationAbilityIndex",
  "Multi-Ability-Karten ohne eindeutige ID bleiben `ability_unresolved`",
  "keine Action-Auswahl",
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
  "scripts/check-ai038-card-action-source-binding.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI038: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI038_CARD_ACTION_SOURCE_BINDING OK sourceBound=${report.metrics.sourceBound} abilityUnresolved=${report.metrics.abilityUnresolved}`,
);

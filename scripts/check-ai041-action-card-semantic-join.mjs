import { execFileSync } from "node:child_process";
import fs from "node:fs";

const schemaPath = "packages/ai/src/action-semantic-candidate.ts";
const testPath = "packages/ai/src/action-semantic-candidate.test.ts";
const mdPath = "docs/reviews/ai/ai041-action-card-semantic-join-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai041-action-card-semantic-join-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI041 check failed: ${message}`);
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

if (report.step !== "AI041") fail("JSON step must be AI041");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");
if (report.metrics.cardContextJoined !== 3) fail("cardContextJoined must be 3");
if (report.metrics.actionTacticSignalsJoined !== 2) fail("actionTacticSignalsJoined must be 2");
if (report.metrics.multiAbilityWithoutIdBroadOnly !== 1)
  fail("multiAbilityWithoutIdBroadOnly must be 1");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredText of [
  "export type ActionCardSemanticProfile",
  "export type ActionCardAbilitySemanticProfile",
  "function applyCardSemanticJoin",
  "cardSemanticProfilesByCardId",
  "card_semantics_unavailable",
]) {
  if (!schema.includes(requiredText)) fail(`Schema missing ${requiredText}`);
}

for (const forbiddenText of [
  "ai-card-hints",
  "hint-ontology",
  "inspectorIndex",
  "compiledAiHints",
  "deck-doctrine",
  "chooseSemanticAiAction",
  "rankSemantic",
]) {
  if (schema.includes(forbiddenText)) fail(`AI041 builder must not reference ${forbiddenText}`);
}

for (const requiredText of [
  "joins card semantics only when source and ability binding are side-safe",
  "cardSemanticProfilesByCardId",
  "card.context.multi",
  "ability_unresolved",
  "targetProfileMatches",
]) {
  if (!testSource.includes(requiredText)) fail(`Test missing ${requiredText}`);
}

for (const requiredText of [
  "Card-Level-`tacticSignals`",
  "Multi-Ability ohne `abilityId`",
  "keine Zielbewertung",
  "keine Zielauswahl",
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
  "scripts/check-ai041-action-card-semantic-join.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI041: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI041_ACTION_CARD_SEMANTIC_JOIN OK cardContext=${report.metrics.cardContextJoined} actionSignals=${report.metrics.actionTacticSignalsJoined}`,
);

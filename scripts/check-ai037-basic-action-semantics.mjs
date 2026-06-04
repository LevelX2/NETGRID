import { execFileSync } from "node:child_process";
import fs from "node:fs";

const schemaPath = "packages/ai/src/action-semantic-candidate.ts";
const testPath = "packages/ai/src/action-semantic-candidate.test.ts";
const sharedPath = "packages/shared/src/index.ts";
const mdPath = "docs/reviews/ai/ai037-basic-action-semantics-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai037-basic-action-semantics-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI037 check failed: ${message}`);
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

function extractClassifiedActionTypes(schemaSource) {
  const match = schemaSource.match(/const BASIC_ACTION_SEMANTICS:[\s\S]*?= \{([\s\S]*?)\};/);
  if (!match) fail("BASIC_ACTION_SEMANTICS map not found");
  return [...match[1].matchAll(/\n\s{2}([a-z_]+): \{/g)].map((entry) => entry[1]).sort();
}

const schema = read(schemaPath);
const testSource = read(testPath);
const md = read(mdPath);
const report = JSON.parse(read(jsonPath));
const sharedActionTypes = extractActionTypes(read(sharedPath));
const classifiedActionTypes = extractClassifiedActionTypes(schema);

if (report.step !== "AI037") fail("JSON step must be AI037");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");
if (JSON.stringify(classifiedActionTypes) !== JSON.stringify(sharedActionTypes))
  fail("BASIC_ACTION_SEMANTICS must document a broad classification for every current ActionType");
if (report.metrics.broadActionTypesClassified !== sharedActionTypes.length)
  fail("Report broadActionTypesClassified must match shared ActionType count");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredActionType of [
  "gain_credit",
  "draw_card",
  "mandatory_draw",
  "start_run",
  "continue_run",
  "jack_out",
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
  "decline_trash",
  "rez_ice",
  "decline_rez",
  "end_turn",
  "forgo_action",
  "remove_tag",
  "purge_virus_counters",
  "purge_runner_virus_counters",
  "resolve_choice",
]) {
  if (!schema.includes(`${requiredActionType}:`))
    fail(`Missing required basic action classification ${requiredActionType}`);
}

for (const forbiddenText of [
  "ai-card-hints",
  "hint-ontology",
  "inspector",
  "deck-doctrine",
  "chooseAction",
  "applyAction",
]) {
  if (schema.includes(forbiddenText)) fail(`AI037 schema file must not reference ${forbiddenText}`);
}

for (const requiredText of [
  "adds controlled basic action semantics without card hints",
  'semanticActionType).toBe("economy.gain_credit")',
  'semanticActionType).toBe("choice.resolve")',
  'semanticActionType).toBe("install.card")',
]) {
  if (!testSource.includes(requiredText)) fail(`Test missing: ${requiredText}`);
}

const requiredFamilies = [
  "install_runner_program",
  "install_runner_hardware",
  "install_runner_resource",
  "play_runner_event",
  "play_runner_prep",
  "install_corp_card",
  "install_ice",
  "install_remote_card",
  "play_corp_operation",
  "advance_card",
  "score_agenda",
  "rez_card",
  "rez_ice",
  "break_subroutine",
  "boost_breaker_strength",
  "pay_trace",
  "boost_trace",
  "prevent_damage",
  "remove_tag",
  "trash_installed_card",
  "discard_cleanup",
];
const reportFamilies = new Set(report.requiredFamilyInventory.map((entry) => entry.family));
for (const family of requiredFamilies) {
  if (!reportFamilies.has(family)) fail(`Report missing required family ${family}`);
}

for (const requiredText of [
  "keine Card-Hints",
  "keine Action-Auswahl",
  "kein Scoring",
  "Pay-/Boost-Trace",
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
  "scripts/check-ai037-basic-action-semantics.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI037: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI037_BASIC_ACTION_SEMANTICS OK classified=${classifiedActionTypes.length} core=${report.metrics.coreRequiredFamiliesClassified}`,
);

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/ai034-legal-action-shape-inventory-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai034-legal-action-shape-inventory-2026-06-04.json";
const sharedPath = "packages/shared/src/index.ts";
const inputDtoPath = "packages/ai/src/input-dto.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI034 check failed: ${message}`);
  process.exit(1);
}

function extractActionTypes(sharedSource) {
  const match = sharedSource.match(/export type ActionType =([\s\S]*?);/);
  if (!match) fail("ActionType union not found");
  return [...match[1].matchAll(/\|\s*"([^"]+)"/g)].map((entry) => entry[1]).sort();
}

function extractAllowedPayloadKeys(inputDtoSource) {
  const match = inputDtoSource.match(/const LEGAL_ACTION_PAYLOAD_KEYS = new Set<string>\(\[([\s\S]*?)\]\);/);
  if (!match) fail("LEGAL_ACTION_PAYLOAD_KEYS not found");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]).sort();
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

const report = JSON.parse(read(jsonPath));
const md = read(mdPath);
const sharedActionTypes = extractActionTypes(read(sharedPath));
const reportActionTypes = [...report.actionTypes].sort();

if (report.step !== "AI034") fail("JSON step must be AI034");
if (!Array.isArray(report.actionShapes) || report.actionShapes.length === 0)
  fail("actionShapes must be a non-empty array");
if (JSON.stringify(reportActionTypes) !== JSON.stringify(sharedActionTypes))
  fail("JSON actionTypes do not match shared ActionType union");

const shapeTypes = report.actionShapes.map((shape) => shape.actionType).sort();
if (JSON.stringify(shapeTypes) !== JSON.stringify(sharedActionTypes))
  fail("actionShapes must contain exactly one entry per shared ActionType");

for (const shape of report.actionShapes) {
  if (typeof shape.actionType !== "string") fail("shape without actionType");
  if (!Array.isArray(shape.payloadKeys)) fail(`${shape.actionType} missing payloadKeys array`);
}

const allowedKeys = extractAllowedPayloadKeys(read(inputDtoPath));
for (const required of ["serverId", "cardId", "targetCardId", "abilityId", "payOrEndRunSubroutinePayment"]) {
  if (!allowedKeys.includes(required)) fail(`AI DTO allowlist missing expected key ${required}`);
}

const lost = report.lostBetweenEngineAndAiDto ?? [];
for (const requiredLost of ["selectedCardId", "selectedSubtype", "cardImplementationAbilityIndex"]) {
  if (!lost.some((entry) => entry.field === requiredLost && entry.presentInEngine === true && entry.presentInAiDecisionInput === false))
    fail(`lostBetweenEngineAndAiDto missing required field ${requiredLost}`);
}

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const expectedText of [
  "32 ActionTypes",
  "No-Effect-Flags bleiben `false`",
  "AI035 ActionSemanticCandidate Schema",
]) {
  if (!md.includes(expectedText)) fail(`Markdown report missing: ${expectedText}`);
}

const forbiddenChangedPrefixes = [
  "packages/engine/",
  "packages/shared/",
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
];
const illegalChanges = changedFiles().filter((file) =>
  forbiddenChangedPrefixes.some((prefix) => file.startsWith(prefix)),
);
if (illegalChanges.length > 0)
  fail(`AI034 must not change runtime/type files: ${illegalChanges.join(", ")}`);

console.log(
  `AI034_LEGAL_ACTION_SHAPE_INVENTORY OK actionTypes=${sharedActionTypes.length} shapes=${shapeTypes.length} lostFields=${lost.length}`,
);

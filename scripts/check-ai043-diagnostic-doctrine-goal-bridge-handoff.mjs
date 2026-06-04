import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/ai043-diagnostic-doctrine-goal-bridge-handoff-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai043-diagnostic-doctrine-goal-bridge-handoff-2026-06-04.json";
const finalMdPath = "docs/reviews/ai/action-semantics-bridge-final-report-2026-06-04.md";
const finalJsonPath = "docs/reviews/ai/action-semantics-bridge-final-report-2026-06-04.json";
const progressPath = "docs/reviews/ai/action-semantics-bridge-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI043 check failed: ${message}`);
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
const finalMd = read(finalMdPath);
const finalReport = JSON.parse(read(finalJsonPath));
const progress = JSON.parse(read(progressPath));

if (report.step !== "AI043") fail("JSON step must be AI043");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus must be none");
if (report.handoffScope !== "diagnostic_only") fail("handoffScope must be diagnostic_only");
if (report.fieldReadinessMatrix.length !== 4) fail("fieldReadinessMatrix must cover four follow-up fields");
if (finalReport.status !== "ready_for_integration_preflight")
  fail("Final report must be ready_for_integration_preflight");
if (progress.state !== "integration_preflight") fail("Progress state must be integration_preflight");
if (!progress.completedSteps.includes("AI043")) fail("Progress must include AI043");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const [flag, value] of Object.entries(finalReport.noEffectFlags ?? {})) {
  if (value !== false) fail(`Final no-effect flag must be false: ${flag}`);
}

for (const requiredText of [
  "DeckDoctrine v2",
  "TacticalGoal generation",
  "Action-to-goal matching",
  "Shadow-only Fixtures",
  "keine numerischen Action-Scores",
  "keine Rangliste",
  "keine Action-Auswahl-Simulation",
]) {
  if (!md.includes(requiredText)) fail(`Markdown handoff missing: ${requiredText}`);
}

for (const requiredText of [
  "AI034 bis AI043 wurden sequenziell abgeschlossen",
  "0 Hidden-Info-Leaks",
  "0 Runtime-Verhaltensänderungen",
  "integration_preflight",
]) {
  if (!finalMd.includes(requiredText)) fail(`Final report missing: ${requiredText}`);
}

for (const forbiddenRuntimeFile of [
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
]) {
  if (read(forbiddenRuntimeFile).includes("action-semantic-candidate")) {
    fail(`Runtime/decision file imports action-semantic-candidate: ${forbiddenRuntimeFile}`);
  }
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  finalMdPath,
  finalJsonPath,
  progressPath,
  "scripts/check-ai043-diagnostic-doctrine-goal-bridge-handoff.mjs",
];

const unexpectedChanges = changedFiles().filter((file) => !allowedChangedFiles.includes(file));
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI043: ${unexpectedChanges.join(", ")}`);
}

console.log(
  `AI043_DIAGNOSTIC_DOCTRINE_GOAL_BRIDGE_HANDOFF OK readiness=${report.fieldReadinessMatrix.length}`,
);

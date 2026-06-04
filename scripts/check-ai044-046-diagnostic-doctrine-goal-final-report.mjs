import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai044-046-diagnostic-doctrine-goal-final-report-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai044-046-diagnostic-doctrine-goal-final-report-2026-06-04.json";
const statusPath = "docs/codex/CODEX_STATUS.md";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI044-AI046 final check failed: ${message}`);
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
const status = read(statusPath);

if (report.step !== "AI044-AI046-FINAL")
  fail("JSON step must be AI044-AI046-FINAL");
if (report.status !== "done") fail("Final status must be done");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.verificationStatus !== "passed")
  fail("verificationStatus must be passed");
if (report.completedSteps.length !== 4)
  fail("completedSteps must include AI043-R through AI046");
if (report.nextAllowedStep !== "Shadow-only scoring fixture design")
  fail("nextAllowedStep must stay shadow-only");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredStep of ["AI043-R", "AI044", "AI045", "AI046"]) {
  if (!report.completedSteps.some((step) => step.step === requiredStep)) {
    fail(`completed step missing: ${requiredStep}`);
  }
}

for (const forbidden of [
  "productive scoring",
  "action selection",
  "planner weights",
  "runtime consumer",
  "hidden-info projection",
  "legality generation",
  "feature flag cutover",
]) {
  if (!report.stillForbidden.includes(forbidden)) {
    fail(`forbidden item missing: ${forbidden}`);
  }
}

for (const requiredText of [
  "Die nächste benötigte Schicht",
  "Shadow-only Scoring-/Evaluation-Design",
  "Eine Action-Auswahl oder ein Cutover ist weiterhin nicht freigegeben",
  "AI043-R",
  "AI044",
  "AI045",
  "AI046",
]) {
  if (!md.includes(requiredText)) fail(`Markdown final report missing: ${requiredText}`);
}

for (const requiredStatusText of [
  "AI043-R/AI044-AI046",
  "Shadow-only Scoring-/Evaluation-Fixtures",
  "keine produktive Action-Auswahl",
]) {
  if (!status.includes(requiredStatusText)) {
    fail(`CODEX_STATUS missing: ${requiredStatusText}`);
  }
}

const allowedChangedFiles = [mdPath, jsonPath, statusPath, "scripts/check-ai044-046-diagnostic-doctrine-goal-final-report.mjs"];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for final report: ${unexpectedChanges.join(", ")}`);
}

console.log("AI044_046_DIAGNOSTIC_DOCTRINE_GOAL_FINAL_REPORT OK");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai063-sr-card-semantics-join-coverage-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai063-sr-card-semantics-join-coverage-2026-06-04.json";
const codePath = "packages/ai/src/shadow-readiness-expansion.ts";
const testPath = "packages/ai/src/shadow-readiness-expansion.test.ts";
const progressPath =
  "docs/reviews/ai/shadow-readiness-expansion-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI063-SR check failed: ${message}`);
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
const progress = JSON.parse(read(progressPath));

if (report.step !== "AI063-SR") fail("JSON step must be AI063-SR");
if (report.schemaVersion !== "ai063-sr-card-semantics-join-coverage-v1") {
  fail("schemaVersion mismatch");
}
if (report.cardSemanticsUnavailableBefore !== 7) fail("before gap must be 7");
if (report.joinedCardSemanticsCount !== 7) fail("joined count must be 7");
if (report.cardSemanticsUnavailableAfter !== 0) fail("after gap must be 0");
if (report.joinPolicy.blindSignalTransferAllowed !== false) {
  fail("blind signal transfer must be forbidden");
}
if (report.joinPolicy.actionTacticSignalsOnlyWhenAbilityResolvedOrBasic !== true) {
  fail("action tactic signal policy missing");
}
if (report.joinPolicy.hiddenInfoProjectionAllowed !== false) {
  fail("hidden-info projection must be forbidden");
}
if (report.batchAfterCardSemanticsJoinCoverage.hardGateFailures !== 0) {
  fail("hard gate failures must be zero");
}
if (report.batchAfterCardSemanticsJoinCoverage.actualDecisionOverrideCount !== 0) {
  fail("actual decision overrides must be zero");
}
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredCode of [
  "AI063_SR_CARD_SEMANTICS_JOIN_SCHEMA_VERSION",
  "AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS",
  "buildFixturesAfterCardSemanticsJoinCoverage",
  "buildAi063SrCardSemanticsJoinCoverageReport",
  "card_context_only",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "createPlayerAction",
  "PlayerAction",
  "plannerWeight",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}

for (const runtimeFile of [
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
  "apps/server/src/multiplayer.ts",
  "apps/server/src/http-server.ts",
]) {
  if (read(runtimeFile).includes("shadow-readiness-expansion")) {
    fail(`runtime file imports shadow readiness expansion: ${runtimeFile}`);
  }
}

for (const requiredText of [
  "Card-Semantics Join Coverage",
  "`card_semantics_unavailable` | 7 | 0",
  "ActionTacticSignals",
  "AI063-SR is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "joins side-safe card semantics for all AI058 card-semantics gaps",
  "separates card context signals from ability-resolved action tactics",
  "keeps batch safety green after card semantics coverage",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

for (const step of ["AI061-SR", "AI062-SR", "AI063-SR"]) {
  if (!progress.completedSteps.includes(step)) {
    fail(`progress must include ${step}`);
  }
}
if (progress.currentStep !== "AI064-SR") {
  fail("progress currentStep must be AI064-SR");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai063-sr-card-semantics-join-coverage.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI063-SR: ${unexpectedChanges.join(", ")}`);
}

console.log("AI063_SR_CARD_SEMANTICS_JOIN_COVERAGE OK card_gap=0");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/ai057-runtime-shadow-harness-2026-06-04.md";
const jsonPath = "docs/reviews/ai/ai057-runtime-shadow-harness-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI057 check failed: ${message}`);
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

if (report.step !== "AI057") fail("JSON step must be AI057");
if (report.schemaVersion !== "runtime-shadow-harness-v1")
  fail("schemaVersion mismatch");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");
if (report.configContract?.semanticAiShadowModeEnabled !== false) {
  fail("semanticAiShadowModeEnabled must default false");
}
if (report.actualDecisionContract !== "actualDecision_equals_legacyDecision") {
  fail("actualDecision contract mismatch");
}
if (report.publicPayloadChangesAllowed !== false) {
  fail("public payload changes must be disallowed");
}

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredCode of [
  "RUNTIME_SHADOW_HARNESS_SCHEMA_VERSION",
  "DEFAULT_SEMANTIC_AI_SHADOW_MODE_CONFIG",
  "semanticAiShadowModeEnabled: false",
  "runRuntimeShadowHarness",
  "actualDecision: params.legacyDecision",
  "actualDecisionEqualsLegacyDecision: true",
  "buildRuntimeShadowHarnessReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "createPlayerAction",
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
  if (read(runtimeFile).includes("controlled-shadow-mode")) {
    fail(`runtime file imports controlled shadow mode: ${runtimeFile}`);
  }
}

for (const requiredText of [
  '"semanticAiShadowModeEnabled": false',
  "actualDecision === legacyDecision",
  "No productive AI",
  "AI057 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "is disabled by default and returns the exact legacy decision",
  "can run diagnostics when explicitly enabled while actualDecision remains legacy",
  "keeps hidden-info fixtures diagnostic and blocked when enabled",
  "documents the default-off diagnostic-only harness contract",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI057")) {
  fail("progress must include AI057");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai057-runtime-shadow-harness.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI057: ${unexpectedChanges.join(", ")}`);
}

console.log("AI057_RUNTIME_SHADOW_HARNESS OK default=false actual=legacy");

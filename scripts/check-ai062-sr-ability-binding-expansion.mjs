import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai062-sr-ability-binding-expansion-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai062-sr-ability-binding-expansion-2026-06-04.json";
const codePath = "packages/ai/src/shadow-readiness-expansion.ts";
const testPath = "packages/ai/src/shadow-readiness-expansion.test.ts";
const progressPath =
  "docs/reviews/ai/shadow-readiness-expansion-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI062-SR check failed: ${message}`);
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

if (report.step !== "AI062-SR") fail("JSON step must be AI062-SR");
if (report.schemaVersion !== "ai062-sr-ability-binding-expansion-v1") {
  fail("schemaVersion mismatch");
}
if (report.abilityUnresolvedBefore !== 6) fail("before gap must be 6");
if (report.resolvedAbilityBindingCount !== 5) fail("resolved count must be 5");
if (report.abilityUnresolvedAfter !== 1) fail("after gap must be 1");
if (!report.unresolved.some((item) => item.scenarioId === "multi_ability_card_unresolved")) {
  fail("multi-ability unresolved guard missing");
}
if (report.bindingPolicy.multiAbilityWithoutExplicitIdRemainsUnresolved !== true) {
  fail("multi-ability unresolved policy missing");
}
if (report.bindingPolicy.hiddenInfoProjectionAllowed !== false) {
  fail("hidden-info projection must be forbidden");
}
if (report.batchAfterAbilityBindingExpansion.hardGateFailures !== 0) {
  fail("hard gate failures must be zero");
}
if (report.batchAfterAbilityBindingExpansion.actualDecisionOverrideCount !== 0) {
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
  "AI062_SR_ABILITY_BINDING_EXPANSION_SCHEMA_VERSION",
  "AI062_SR_SIDE_SAFE_ABILITY_BINDINGS",
  "buildFixturesAfterAbilityBindingExpansion",
  "buildAi062SrAbilityBindingExpansionReport",
  "multi_ability_without_explicit_side_safe_id",
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
  "Ability Binding Expansion",
  "`ability_unresolved` | 6 | 1",
  "Multi-Ability unresolved guard",
  "AI062-SR is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "binds side-safe ability references without resolving the multi-ability guard",
  "keeps every binding side-safe and diagnostic only",
  "reduces ability gaps after target context projection while keeping actual decisions legacy",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI061-SR")) {
  fail("progress must include AI061-SR");
}
if (!progress.completedSteps.includes("AI062-SR")) {
  fail("progress must include AI062-SR");
}
if (
  ![
    "AI063-SR",
    "AI064-SR",
    "AI065-SR",
    "AI066-SR",
    "AI067-SR",
    "integration_preflight",
  ].includes(progress.currentStep)
) {
  fail("progress currentStep must be AI063-SR or later");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai062-sr-ability-binding-expansion.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI062-SR: ${unexpectedChanges.join(", ")}`);
}

console.log("AI062_SR_ABILITY_BINDING_EXPANSION OK ability_gap=1");

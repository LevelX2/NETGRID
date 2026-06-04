import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai059-shadow-regression-fixtures-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai059-shadow-regression-fixtures-2026-06-04.json";
const fixturePath =
  "data/scenarios/ai059-shadow-regression-fixtures-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI059 check failed: ${message}`);
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
const fixtureFile = JSON.parse(read(fixturePath));
const code = read(codePath);
const test = read(testPath);
const progress = JSON.parse(read(progressPath));

if (report.step !== "AI059") fail("JSON step must be AI059");
if (report.schemaVersion !== "shadow-regression-fixtures-v1")
  fail("schemaVersion mismatch");
if (report.fixtureFile !== fixturePath) fail("fixtureFile mismatch");
if (report.fixtureCount !== 8) fail("fixtureCount mismatch");
if (report.activeFixtureCount !== 7) fail("activeFixtureCount mismatch");
if (report.inactiveFixtureCount !== 1) fail("inactiveFixtureCount mismatch");
if (report.deterministicOutput !== true) fail("deterministicOutput must be true");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

if (!Array.isArray(fixtureFile.fixtures) || fixtureFile.fixtures.length !== 8) {
  fail("fixture file must contain 8 fixtures");
}

for (const fixtureType of [
  "golden_same_as_legacy",
  "golden_semantic_improvement",
  "golden_semantic_blocked_by_gap",
  "golden_hidden_info_guard",
  "golden_illegal_action_guard",
  "golden_target_context_required",
  "golden_ability_resolution_required",
  "golden_cost_known_required",
]) {
  if (!report.fixtureTypes.includes(fixtureType)) {
    fail(`fixture type missing: ${fixtureType}`);
  }
}

const improvement = fixtureFile.fixtures.find(
  (fixture) => fixture.fixtureType === "golden_semantic_improvement",
);
if (!improvement || improvement.active !== false) {
  fail("semantic improvement fixture must stay inactive without AI058 evidence");
}

for (const requiredCode of [
  "SHADOW_REGRESSION_FIXTURES_SCHEMA_VERSION",
  "ShadowRegressionFixture",
  "buildShadowRegressionFixturesReport",
  "golden_hidden_info_guard",
  "golden_illegal_action_guard",
  "determinismKey",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "createPlayerAction",
  "liveScore",
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
  "`golden_semantic_improvement` | no",
  "Fixtures | 8",
  "Deterministic output | yes",
  "AI059 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "defines all required shadow regression fixture types",
  "does not fabricate a semantic improvement fixture",
  "captures hidden-info, illegal-action and required-gap guards",
  "is deterministic and diagnostic-only",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI059")) {
  fail("progress must include AI059");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  fixturePath,
  codePath,
  testPath,
  "scripts/check-ai059-shadow-regression-fixtures.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI059: ${unexpectedChanges.join(", ")}`);
}

console.log("AI059_SHADOW_REGRESSION_FIXTURES OK fixtures=8");

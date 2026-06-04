import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai065-sr-runtime-backed-shadow-fixture-promotion-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai065-sr-runtime-backed-shadow-fixture-promotion-2026-06-04.json";
const fixturePath =
  "data/scenarios/ai065-sr-runtime-backed-shadow-fixtures-2026-06-04.json";
const codePath = "packages/ai/src/shadow-readiness-expansion.ts";
const testPath = "packages/ai/src/shadow-readiness-expansion.test.ts";
const progressPath =
  "docs/reviews/ai/shadow-readiness-expansion-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI065-SR check failed: ${message}`);
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
const fixture = JSON.parse(read(fixturePath));
const code = read(codePath);
const test = read(testPath);
const progress = JSON.parse(read(progressPath));

if (report.step !== "AI065-SR") fail("JSON step must be AI065-SR");
if (
  report.schemaVersion !==
  "ai065-sr-runtime-backed-shadow-fixture-promotion-v1"
) {
  fail("schemaVersion mismatch");
}
if (report.runtimeBackedFixtureCountBefore !== 0) fail("before count must be 0");
if (report.promotedFixtureCount !== 8) fail("promoted count must be 8");
if (report.runtimeBackedFixtureCountAfter !== 8) fail("after count must be 8");
if (report.runtimeBackedFixtureRateAfter !== 0.2424) fail("rate mismatch");
if (report.fixtureFile !== fixturePath) fail("fixture file mismatch");
if (fixture.promotedFixtures.length !== 8) fail("fixture promoted count mismatch");
if (
  fixture.promotedFixtures.some((item) =>
    [
      "hidden_info_boundary_unrezzed_ice",
      "hidden_resource_boundary",
      "corp_ambush_or_remote_bait",
      "multi_ability_card_unresolved",
    ].includes(item.scenarioId),
  )
) {
  fail("guard fixture was promoted");
}
if (
  !fixture.promotedFixtures.every(
    (item) =>
      item.setupKind === "saved_state" &&
      item.deterministicReference === true &&
      item.hiddenInfoRisk === "low",
  )
) {
  fail("promoted fixtures must be deterministic low-risk saved states");
}
if (report.notPromotedPolicy.hiddenInfoBoundaryFixturesRemainSynthetic !== true) {
  fail("hidden-info not-promoted policy missing");
}
if (report.notPromotedPolicy.multiAbilityUnresolvedGuardRemainsSynthetic !== true) {
  fail("multi-ability not-promoted policy missing");
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
  "AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTION_SCHEMA_VERSION",
  "AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS",
  "buildFixturesAfterRuntimeBackedShadowFixturePromotion",
  "buildAi065SrRuntimeBackedShadowFixturePromotionReport",
  "multi_ability_unresolved_guard",
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
  "Runtime-backed Shadow Fixture Promotion",
  "Runtime-backed fixture count | 0 | 8",
  "Hidden-Info guards",
  "AI065-SR is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "promotes selected safe fixtures to saved-state references",
  "does not promote hidden-info or unresolved multi-ability guards",
  "updates fixture setup kinds while preserving diagnostic safety",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

for (const step of [
  "AI061-SR",
  "AI062-SR",
  "AI063-SR",
  "AI064-SR",
  "AI065-SR",
]) {
  if (!progress.completedSteps.includes(step)) {
    fail(`progress must include ${step}`);
  }
}
if (progress.currentStep !== "AI066-SR") {
  fail("progress currentStep must be AI066-SR");
}
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  fixturePath,
  codePath,
  testPath,
  "scripts/check-ai065-sr-runtime-backed-shadow-fixture-promotion.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI065-SR: ${unexpectedChanges.join(", ")}`);
}

console.log("AI065_SR_RUNTIME_BACKED_SHADOW_FIXTURE_PROMOTION OK rate=0.2424");

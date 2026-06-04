import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai068-sr-runtime-backed-shadow-fixture-coverage-expansion-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai068-sr-runtime-backed-shadow-fixture-coverage-expansion-report-2026-06-04.json";
const fixturePath =
  "data/scenarios/ai068-sr-runtime-backed-shadow-fixtures-2026-06-04.json";
const codePath = "packages/ai/src/shadow-readiness-expansion.ts";
const testPath = "packages/ai/src/shadow-readiness-expansion.test.ts";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI068-SR check failed: ${message}`);
  process.exit(1);
}

function gitLines(args) {
  const output = execFileSync("git", args, { encoding: "utf8" }).trim();
  return output ? output.split(/\r?\n/).map((line) => line.trim()) : [];
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only"]),
      ...gitLines(["diff", "--cached", "--name-only"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ]
    .filter(Boolean)
    .sort();
}

const md = read(mdPath);
const report = JSON.parse(read(jsonPath));
const fixture = JSON.parse(read(fixturePath));
const code = read(codePath);
const test = read(testPath);

if (report.taskId !== "AI068-SR") fail("taskId must be AI068-SR");
if (report.step !== "AI068-SR") fail("step must be AI068-SR");
if (
  report.schemaVersion !==
  "ai068-sr-runtime-backed-shadow-fixture-coverage-expansion-v1"
) {
  fail("schemaVersion mismatch");
}
if (report.baseline.readinessStatus !== "broad_shadow_ready") {
  fail("baseline readiness must be broad_shadow_ready");
}
if (report.baseline.cutoverAllowed !== false) fail("baseline cutover must be false");
if (report.countsBefore.runtimeBackedFixtureCount !== 8) fail("before count");
if (report.countsAfter.runtimeBackedFixtureCount !== 16) fail("after count");
if (
  report.countsAfter.runtimeBackedFixtureCount <=
  report.countsBefore.runtimeBackedFixtureCount
) {
  fail("runtime-backed fixture count did not increase");
}
if (report.runtimeBackedFixtureRateBefore !== 0.2424) fail("before rate");
if (report.runtimeBackedFixtureRateAfter !== 0.4848) fail("after rate");
if (report.runtimeBackedFixtureRateAfter <= 0.2424) fail("rate did not increase");
if (report.semanticDecisionAvailableRateAfter !== 0.8788) fail("availability");
if (report.semanticBlockedByGapRateAfter !== 0.0303) fail("blocked-by-gap");
if (report.hardGateFailures.length !== 0) fail("hardGateFailures must be empty");
if (report.knownBadDecisions.length !== 0) fail("knownBadDecisions must be empty");
if (report.actualDecisionOverrideCount !== 0) fail("actual decision override");
if (report.runtimeEffectCount !== 0) fail("runtime effect count");
if (report.hiddenInfoViolationCount !== 0) fail("hidden info violation");
if (report.readinessDecision.status !== "broad_shadow_ready") {
  fail("readinessDecision status mismatch");
}
if (report.readinessDecision.cutoverAllowed !== false) fail("cutoverAllowed");
if (report.readinessDecision.cutoverDesignStarted !== false) {
  fail("cutoverDesignStarted");
}
if (report.semanticAiShadowModeEnabledDefault !== false) {
  fail("semanticAiShadowModeEnabled default must remain false");
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}
for (const flag of [
  "actualDecisionOverride",
  "runtimeEffect",
  "hiddenInfoLeak",
  "featureFlagCutover",
]) {
  const mappedFlag = flag === "runtimeEffect" ? "engineMutation" : flag;
  if (report.noEffectFlags[mappedFlag] !== false) {
    fail(`No-effect safety flag must be false: ${mappedFlag}`);
  }
}

const forbiddenPromotions = [
  "hidden_info_boundary_unrezzed_ice",
  "hidden_resource_boundary",
  "corp_ambush_or_remote_bait",
  "multi_ability_card_unresolved",
];
for (const promoted of report.promotedFixtures) {
  if (forbiddenPromotions.includes(promoted.scenarioId)) {
    fail(`forbidden report promotion: ${promoted.scenarioId}`);
  }
  if (
    promoted.promotedSetupKind !== "saved_state" ||
    promoted.deterministicReference !== true ||
    promoted.hiddenInfoRisk !== "low" ||
    promoted.productiveChangeAllowed !== false
  ) {
    fail(`unsafe promotion contract: ${promoted.scenarioId}`);
  }
}
if (report.promotedFixtures.length !== 8) fail("report promoted count");

if (fixture.promotedFixtures.length !== 8) fail("fixture promoted count");
if (fixture.previousRuntimeBackedFixtures.length !== 8) {
  fail("previous runtime-backed fixture count");
}
if (fixture.runtimeBackedFixtureCountAfter !== 16) fail("fixture after count");
for (const promoted of fixture.promotedFixtures) {
  if (forbiddenPromotions.includes(promoted.scenarioId)) {
    fail(`forbidden fixture promotion: ${promoted.scenarioId}`);
  }
}
if (fixture.notPromotedPolicy.hiddenInfoBoundaryFixturesRemainSynthetic !== true) {
  fail("hidden-info not-promoted policy");
}
if (fixture.notPromotedPolicy.multiAbilityUnresolvedGuardRemainsSynthetic !== true) {
  fail("multi-ability not-promoted policy");
}

for (const requiredBlocked of [
  ["hidden_info_boundary_unrezzed_ice", "hidden_info_blocked_guard"],
  ["hidden_resource_boundary", "hidden_info_blocked_guard"],
  ["corp_ambush_or_remote_bait", "hidden_info_blocked_guard"],
  ["multi_ability_card_unresolved", "multi_ability_card_unresolved_guard"],
]) {
  const [scenarioId, reason] = requiredBlocked;
  const candidate = report.blockedPromotionCandidates.find(
    (entry) => entry.scenarioId === scenarioId,
  );
  if (!candidate || candidate.reason !== reason) {
    fail(`blocked candidate missing: ${scenarioId}`);
  }
}

for (const requiredGap of [
  ["ability_unresolved", 1],
  ["hidden_info_blocked", 3],
]) {
  const [gapId, count] = requiredGap;
  const gap = report.residualGaps.find((entry) => entry.gapId === gapId);
  if (!gap || gap.count !== count) fail(`residual gap mismatch: ${gapId}`);
}

for (const requiredCode of [
  "AI068_SR_RUNTIME_BACKED_FIXTURE_COVERAGE_EXPANSION_SCHEMA_VERSION",
  "AI068_SR_RUNTIME_BACKED_FIXTURE_COVERAGE_PROMOTIONS",
  "buildFixturesAfterRuntimeBackedShadowFixtureCoverageExpansion",
  "buildAi068SrRuntimeBackedShadowFixtureCoverageExpansionReport",
  "semanticAiShadowModeEnabledDefault: false",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const requiredTest of [
  "promotes a minimal second batch of safe runtime-backed fixtures",
  "does not promote hidden-info or unresolved multi-ability guard fixtures",
  "keeps broad readiness, residual gaps and every no-effect gate unchanged",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "AI068-SR Runtime-backed Shadow Fixture Coverage Expansion",
  "Runtime-backed fixture count | 8 | 16",
  "Preferred target is reached",
  "cutoverAllowed = false",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
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

for (const content of [md, JSON.stringify(report), JSON.stringify(fixture)]) {
  if (/chronicle/i.test(content)) fail("Chronicle reference is forbidden");
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  fixturePath,
  codePath,
  testPath,
  "scripts/check-ai068-sr-runtime-backed-shadow-fixture-coverage-expansion.mjs",
];
const unexpectedChanges = changedFiles().filter((file) => {
  if (file.toLowerCase().includes("chronicle")) {
    fail(`Chronicle file changed: ${file}`);
  }
  return !allowedChangedFiles.includes(file);
});
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI068-SR: ${unexpectedChanges.join(", ")}`);
}

console.log("AI068_SR_RUNTIME_BACKED_SHADOW_FIXTURE_COVERAGE_EXPANSION OK rate=0.4848");


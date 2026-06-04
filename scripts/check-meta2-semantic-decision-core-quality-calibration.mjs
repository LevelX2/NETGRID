import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta2-semantic-decision-core-quality-calibration-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta2-semantic-decision-core-quality-calibration-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-core-meta.ts";
const testPath = "packages/ai/src/semantic-ai-core-meta.test.ts";
const progressPath =
  "docs/reviews/ai/semantic-ai-core-meta-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META2 check failed: ${message}`);
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
const code = read(codePath);
const test = read(testPath);
const progress = JSON.parse(read(progressPath));

if (report.schemaVersion !== "meta2-semantic-decision-core-quality-calibration-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META2") fail("step must be META2");
if (report.sourceStep !== "META1") fail("source step mismatch");
if (report.consumerGroupCount !== 12) fail("consumer group count");
if (report.evaluationOrder[0] !== "Engine LegalAction membership") {
  fail("evaluation order must start with Engine LegalAction membership");
}
if (report.evaluationOrder[1] !== "HiddenInfo / side visibility") {
  fail("hidden info must be second evaluation stage");
}
for (const requiredField of [
  "goalFit",
  "doctrineFit",
  "boardUrgency",
  "reachability",
  "costFit",
  "timingFit",
  "targetFit",
  "riskPenalty",
  "opportunityValue",
]) {
  if (!report.scoreSchema.componentFields.includes(requiredField)) {
    fail(`score component missing: ${requiredField}`);
  }
}
if (report.scoreSchema.hardGateBlocksTotal !== true) {
  fail("hard gate must block total");
}
if (report.scoreSchema.requiredEvidenceMissingBlocksByGap !== true) {
  fail("missing evidence must block by gap");
}
if (report.summary.archetypeFixtureCount !== 14) fail("archetype count");
if (report.summary.boardstateOverrideFixtureCount !== 6) fail("override count");
if (report.summary.shadowScoreAvailableCount !== 1) fail("score available count");
if (report.summary.blockedByGateCount !== 1) fail("blocked by gate count");
if (report.summary.blockedByGapCount !== 1) fail("blocked by gap count");
if (report.summary.whyNotCount !== 2) fail("whyNot count");
for (const requiredFixture of [
  "rnd-pressure-runner-must-contest-remote",
  "tag-punish-corp-without-tag-cannot-punish",
  "runner-tagged-kill-threat-removes-tag",
  "corp-score-not-affordable-stabilizes-economy",
  "runner-missing-breaker-coverage-prioritizes-setup",
  "corp-open-rnd-prioritizes-central-defense",
]) {
  if (!report.requiredBoardstateOverrideFixtures.includes(requiredFixture)) {
    fail(`override fixture missing: ${requiredFixture}`);
  }
}
for (const [gate, value] of Object.entries(report.qualityGates ?? {})) {
  if (gate === "actualDecision") {
    if (value !== "legacy") fail("actualDecision must remain legacy");
  } else if (value !== 0) {
    fail(`quality gate must be zero: ${gate}`);
  }
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect");

for (const requiredCode of [
  "type SignalConsumerGroupMatch",
  "type SemanticDecisionScore",
  "type WhyNotEntry",
  "META2_EVALUATION_ORDER",
  "META2_ARCHETYPE_FIXTURES",
  "META2_BOARDSTATE_OVERRIDE_FIXTURES",
  "buildMeta2SemanticDecisionCoreReport",
  "buildSemanticDecisionScore",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "semanticExecutionAllowed: true",
  "productiveUseAllowed: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "defines consumer groups, ordered scoring stages",
  "blocks totals when hard gates fail",
  "covers archetype and boardstate-override fixtures",
  "keeps quality gates green while actual decisions remain legacy",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 2 Semantic Decision Core + Quality Calibration",
  "Consumer-Gruppen",
  "WhyNotEntry",
  "`actualDecision` | Legacy",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

if (!progress.completedSteps.includes("META2")) {
  fail("progress missing META2");
}
if (
  !["META2_done", "integration_preflight", "merged_to_main", "worktree_removed", "complete"].includes(
    progress.currentStep,
  )
) {
  fail("progress currentStep must be META2_done or a later integration state");
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-meta2-semantic-decision-core-quality-calibration.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META2: ${unexpectedChanges.join(", ")}`);
}

console.log("META2_SEMANTIC_DECISION_CORE_QUALITY_CALIBRATION OK");

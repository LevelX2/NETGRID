import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta5-scoped-semantic-override-pilot-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta5-scoped-semantic-override-pilot-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-core-meta.ts";
const testPath = "packages/ai/src/semantic-ai-core-meta.test.ts";
const progressPath =
  "docs/reviews/ai/semantic-ai-core-meta-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META5 check failed: ${message}`);
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

if (report.schemaVersion !== "meta5-scoped-semantic-override-pilot-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META5") fail("step must be META5");
if (report.sourceStep !== "META4") fail("source step mismatch");
if (report.allowedScopes.length !== 5) fail("allowed scope count");
if (report.blockedScopes.length !== 7) fail("blocked scope count");
for (const scope of [
  "runner_basic_economy_vs_draw",
  "corp_basic_economy",
  "runner_remove_tag_when_tagged",
  "corp_score_agenda_when_engine_legal_and_clear",
  "simple_hq_or_rnd_run_when_goal_evidence_ready",
]) {
  if (!report.allowedScopes.includes(scope)) fail(`allowed scope missing: ${scope}`);
}
for (const scope of [
  "hidden_info_access_choices",
  "trace_boost_or_payment",
  "x_value_decisions",
  "multi_target_unresolved",
  "multi_ability_unresolved",
]) {
  if (!report.blockedScopes.includes(scope)) fail(`blocked scope missing: ${scope}`);
}
if (report.summary.fixtureCount !== 8) fail("fixture count");
if (report.summary.overrideAllowedCount !== 5) fail("overrideAllowed count");
if (report.summary.blockedFixtureCount !== 3) fail("blocked fixture count");
if (report.summary.allDivergencesTriaged !== true) fail("triage summary");
for (const [gate, value] of Object.entries(report.qualityGates ?? {})) {
  if (gate === "overrideAllowedCount") {
    if (value <= 0) fail("overrideAllowedCount must be > 0");
  } else if (gate === "rollbackTested" || gate === "allDivergencesTriaged") {
    if (value !== true) fail(`quality gate must be true: ${gate}`);
  } else if (value !== 0) {
    fail(`quality counter must be zero: ${gate}`);
  }
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.runtimeConsumerStatus !== "test_internal_only") {
  fail("runtimeConsumerStatus");
}
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect");

for (const requiredCode of [
  "type ScopedOverridePilotFixture",
  "type ScopedOverridePilotResult",
  "META5_ALLOWED_OVERRIDE_SCOPES",
  "META5_BLOCKED_OVERRIDE_SCOPES",
  "META5_OVERRIDE_FIXTURES",
  "evaluateScopedOverridePilotFixture",
  "buildMeta5ScopedSemanticOverridePilotReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "productionFlagEnabled: true",
  "unsafeDivergenceCount: 1",
  "productiveUseAllowed: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "defines a narrow test/internal whitelist",
  "allows overrides only when every override gate passes",
  "blocks forbidden scopes, hidden info",
  "triages every divergence",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 5 Scoped Semantic Override Pilot",
  "`overrideAllowedCount` | 5",
  "`unsafeDivergenceCount` | 0",
  "No production flag enabled",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

if (!progress.completedSteps.includes("META5")) fail("progress missing META5");
if (
  !["META5_done", "integration_preflight", "merged_to_main", "worktree_removed", "complete"].includes(
    progress.currentStep,
  )
) {
  fail("progress currentStep must be META5_done or a later integration state");
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-meta5-scoped-semantic-override-pilot.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META5: ${unexpectedChanges.join(", ")}`);
}

console.log("META5_SCOPED_SEMANTIC_OVERRIDE_PILOT OK");

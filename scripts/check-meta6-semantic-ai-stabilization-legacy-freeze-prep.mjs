import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta6-semantic-ai-stabilization-legacy-freeze-prep-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta6-semantic-ai-stabilization-legacy-freeze-prep-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-core-meta.ts";
const testPath = "packages/ai/src/semantic-ai-core-meta.test.ts";
const progressPath =
  "docs/reviews/ai/semantic-ai-core-meta-progress-2026-06-04.json";
const statusPath = "docs/codex/CODEX_STATUS.md";
const indexPath = "KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md";
const logPath = "KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md";
const readmePath = "docs/architecture/ai/README.md";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META6 check failed: ${message}`);
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
const status = read(statusPath);
const index = read(indexPath);
const log = read(logPath);
const readme = read(readmePath);

if (report.schemaVersion !== "meta6-semantic-ai-stabilization-legacy-freeze-prep-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META6") fail("step must be META6");
if (report.sourceStep !== "META5") fail("source step mismatch");
if (report.scopeReadinessMatrixCount < 10) fail("scope readiness count");
if (report.traceScrubber.forbiddenSignalCount !== 7) fail("scrubber signals");
if (report.traceScrubber.passes !== true) fail("scrubber must pass");
if (report.legacyFreezeCriteria.criteriaCount !== 7) fail("freeze criteria count");
if (report.legacyFreezeCriteria.blockedCount !== 2) fail("freeze blocked count");
if (report.expansionPlanCount !== 11) fail("expansion plan count");
if (report.goNoGo.decision !== "limited_rollout_candidate_for_selected_scopes") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.fullProductionReady !== false) fail("fullProductionReady");
if (report.goNoGo.legacyRemovalReady !== false) fail("legacyRemovalReady");
if (report.goNoGo.legacyFallbackAvailable !== true) fail("fallback");
if (report.goNoGo.rollbackAvailable !== true) fail("rollback");
for (const [gate, value] of Object.entries(report.qualityGates ?? {})) {
  if (
    [
      "scopeReadinessMatrixExists",
      "traceScrubberPasses",
      "legacyFallbackAvailable",
      "rollbackAvailable",
    ].includes(gate)
  ) {
    if (value !== true) fail(`quality gate must be true: ${gate}`);
  } else if (gate === "fullProductionReady" || gate === "legacyRemovalReady") {
    if (value !== false) fail(`${gate} must be false`);
  } else if (value !== 0) {
    fail(`quality counter must be zero: ${gate}`);
  }
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.runtimeConsumerStatus !== "stabilization_contract_only") {
  fail("runtimeConsumerStatus");
}
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect");

for (const requiredCode of [
  "type SemanticAiScopeReadinessEntry",
  "type TraceScrubberResult",
  "META6_SCOPE_READINESS_MATRIX",
  "META6_TRACE_SCRUBBER_FORBIDDEN_SIGNALS",
  "META6_LEGACY_FREEZE_CRITERIA",
  "META6_EXPANSION_PLAN",
  "scrubTraceForProduction",
  "buildMeta6SemanticAiStabilizationLegacyFreezePrepReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "fullProductionReady: true",
  "legacyRemovalReady: true",
  "productiveUseAllowed: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "builds a scope readiness matrix",
  "scrubs production traces",
  "keeps legacy freeze criteria strict",
  "defines the expansion plan",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 6 Semantic AI Stabilization + Legacy-Freeze Prep",
  "`fullProductionReady` | false",
  "`legacyRemovalReady` | false",
  "limited_rollout_candidate_for_selected_scopes",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}
for (const [path, content] of [
  [statusPath, status],
  [indexPath, index],
  [logPath, log],
  [readmePath, readme],
]) {
  if (!content.includes("Semantic AI Core META 1 bis META 6")) {
    fail(`knowledge/status missing semantic core entry: ${path}`);
  }
  if (!content.includes("fullProductionReady: false")) {
    fail(`knowledge/status missing fullProductionReady false: ${path}`);
  }
  if (!content.includes("legacyRemovalReady: false")) {
    fail(`knowledge/status missing legacyRemovalReady false: ${path}`);
  }
}

if (!progress.completedSteps.includes("META6")) fail("progress missing META6");
if (progress.currentStep !== "integration_preflight") {
  fail("progress currentStep must be integration_preflight");
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-meta6-semantic-ai-stabilization-legacy-freeze-prep.mjs",
  progressPath,
  statusPath,
  indexPath,
  logPath,
  readmePath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META6: ${unexpectedChanges.join(", ")}`);
}

console.log("META6_SEMANTIC_AI_STABILIZATION_LEGACY_FREEZE_PREP OK");

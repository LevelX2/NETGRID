import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/meta4-agreement-only-runtime-canary-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta4-agreement-only-runtime-canary-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-core-meta.ts";
const testPath = "packages/ai/src/semantic-ai-core-meta.test.ts";
const progressPath =
  "docs/reviews/ai/semantic-ai-core-meta-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META4 check failed: ${message}`);
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

if (report.schemaVersion !== "meta4-agreement-only-runtime-canary-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META4") fail("step must be META4");
if (report.sourceStep !== "META3") fail("source step mismatch");
if (report.rule !== "semantic_may_confirm_same_action_only") fail("rule mismatch");
if (report.fixtureCount !== 7) fail("fixture count");
for (const requiredResult of [
  "default_legacy",
  "same_action_confirmed",
  "semantic_differs_legacy",
  "semantic_not_in_legal_actions",
  "hidden_info_blocked",
  "rollback_forced",
  "missing_trace",
]) {
  if (!report.fixtureResults.includes(requiredResult)) {
    fail(`fixture result missing: ${requiredResult}`);
  }
}
for (const [gate, value] of Object.entries(report.qualityGates ?? {})) {
  if (gate === "rollbackTested" || gate === "defaultConfigLegacyOnly") {
    if (value !== true) fail(`quality gate must be true: ${gate}`);
  } else if (gate === "traceCompleteRate") {
    if (value !== 1) fail("traceCompleteRate must be 1");
  } else if (value !== 0) {
    fail(`quality counter must be zero: ${gate}`);
  }
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.runtimeConsumerStatus !== "test_harness_only") {
  fail("runtimeConsumerStatus");
}
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect");

for (const requiredCode of [
  "type AgreementOnlyCanaryInput",
  "type AgreementOnlyCanaryResult",
  "META4_CANARY_FIXTURES",
  "runAgreementOnlyCanary",
  "buildMeta4AgreementOnlyRuntimeCanaryReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "semanticDifferingActionExecutedCount: 1",
  "behaviorDelta: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "keeps default config legacy-only",
  "confirms only same semantic and legacy action ids",
  "falls back to legacy for differing",
  "reports canary quality gates",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 4 Agreement-only Runtime Canary",
  "Same action wird nur als Confirmation gezählt",
  "`behaviorDeltaCount` | 0",
  "Default config Legacy-only",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

if (!progress.completedSteps.includes("META4")) fail("progress missing META4");
if (progress.currentStep !== "META4_done") {
  fail("progress currentStep must be META4_done");
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-meta4-agreement-only-runtime-canary.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META4: ${unexpectedChanges.join(", ")}`);
}

console.log("META4_AGREEMENT_ONLY_RUNTIME_CANARY OK");

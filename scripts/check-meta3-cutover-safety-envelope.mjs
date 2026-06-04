import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/meta3-cutover-safety-envelope-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta3-cutover-safety-envelope-report-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-core-meta.ts";
const testPath = "packages/ai/src/semantic-ai-core-meta.test.ts";
const progressPath =
  "docs/reviews/ai/semantic-ai-core-meta-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META3 check failed: ${message}`);
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

if (report.schemaVersion !== "meta3-cutover-safety-envelope-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META3") fail("step must be META3");
if (report.cutoverGate.cutoverDesignAllowed !== true) fail("design gate");
if (report.cutoverGate.cutoverExecutionAllowed !== false) fail("execution gate");
if (report.cutoverGate.productiveCutoverAllowed !== false) {
  fail("productive cutover gate");
}
if (report.defaultFlags.semanticAiShadowModeEnabled !== false) {
  fail("shadow flag default");
}
if (report.defaultFlags.semanticAiCutoverEnabled !== false) {
  fail("cutover flag default");
}
if (report.defaultFlags.semanticAiAgreementOnlyMode !== false) {
  fail("agreement flag default");
}
if (report.defaultFlags.semanticAiScopedOverrideEnabled !== false) {
  fail("override flag default");
}
if (report.defaultFlags.semanticAiRollbackForceLegacy !== true) {
  fail("rollbackForceLegacy default");
}
if (report.rollbackTriggerCount !== 10) fail("rollback trigger count");
if (!report.scopeMatrix.agreementOnlyScopes.includes("gain_credit")) {
  fail("agreement scope missing");
}
if (!report.scopeMatrix.testOnlyOverrideScopes.includes("runner_remove_tag_when_tagged")) {
  fail("test override scope missing");
}
if (!report.scopeMatrix.blockedScopes.includes("hidden_info_choices")) {
  fail("blocked hidden-info scope missing");
}
if (report.adapterSamples.actualActionIdAlwaysLegacy !== true) {
  fail("adapter must keep actual legacy");
}
if (report.adapterSamples.semanticNotInLegalActionsRollsBack !== true) {
  fail("semantic-not-legal rollback");
}
if (report.traceContract.visibilityScope !== "developer_only") {
  fail("trace must be developer-only");
}
if (report.traceContract.publicPayloadChangesAllowed !== false) {
  fail("public payload change not allowed");
}
for (const [gate, value] of Object.entries(report.qualityGates ?? {})) {
  if (
    [
      "productiveFlagsDefaultOff",
      "rollbackForceLegacyDefaultTrue",
      "adapterCannotCreateActions",
    ].includes(gate)
  ) {
    if (value !== true) fail(`quality gate must be true: ${gate}`);
  } else if (gate === "cutoverExecutionAllowed") {
    if (value !== false) fail("cutoverExecutionAllowed must be false");
  } else if (gate === "actualDecision") {
    if (value !== "legacy") fail("actualDecision must be legacy");
  } else if (value !== 0) {
    fail(`quality counter must be zero: ${gate}`);
  }
}
if (report.productiveUseAllowed !== false) fail("productiveUseAllowed");
if (report.semanticExecutionAllowed !== false) fail("semanticExecutionAllowed");
if (report.runtimeConsumerStatus !== "none") fail("runtimeConsumerStatus");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect");

for (const requiredCode of [
  "type SemanticAiControlFlags",
  "type SemanticDecisionAdapterInput",
  "type SemanticAiTraceContract",
  "META3_DEFAULT_FLAGS",
  "META3_SCOPE_MATRIX",
  "adaptSemanticDecisionToLegacyActual",
  "buildMeta3CutoverSafetyEnvelopeReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "semanticAiCutoverEnabled: true",
  "semanticAiScopedOverrideEnabled: true",
  "visibilityScope: \"public\"",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "keeps cutover design allowed but execution",
  "adapts semantic decisions to legacy actual actions",
  "defines rollback triggers, scope matrix",
  "keeps every META3 safety quality gate",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 3 Cutover Safety Envelope",
  "`cutoverExecutionAllowed = false`",
  "Adapter erzeugt keine Actions",
  "Public Payload Delta | 0",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

if (!progress.completedSteps.includes("META3")) fail("progress missing META3");
if (
  !["META3_done", "integration_preflight", "merged_to_main", "worktree_removed", "complete"].includes(
    progress.currentStep,
  )
) {
  fail("progress currentStep must be META3_done or a later integration state");
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-meta3-cutover-safety-envelope.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META3: ${unexpectedChanges.join(", ")}`);
}

console.log("META3_CUTOVER_SAFETY_ENVELOPE OK");

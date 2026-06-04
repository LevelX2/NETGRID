import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai051-shadow-mode-trace-contract-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai051-shadow-mode-trace-contract-2026-06-04.json";
const codePath = "packages/ai/src/controlled-shadow-mode.ts";
const testPath = "packages/ai/src/controlled-shadow-mode.test.ts";
const progressPath =
  "docs/reviews/ai/controlled-shadow-mode-progress-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI051 check failed: ${message}`);
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

if (report.step !== "AI051") fail("JSON step must be AI051");
if (report.schemaVersion !== "shadow-mode-trace-contract-v1")
  fail("schemaVersion mismatch");
if (report.scope !== "trace_contract_only") fail("scope mismatch");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.visibilityScope !== "developer_only")
  fail("visibilityScope must be developer_only");
if (report.noRuntimeEffect !== true) fail("noRuntimeEffect must be true");
if (report.productiveUseAllowed !== false)
  fail("productiveUseAllowed must be false");
if (report.actualDecisionContract !== "actualDecision_equals_legacyDecision") {
  fail("actualDecision contract mismatch");
}
if (report.runtimeFilesTouched.length !== 0)
  fail("runtimeFilesTouched must be empty");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredField of [
  "traceId",
  "stateVersion",
  "actorSide",
  "legacyDecision",
  "legalActionSummary",
  "candidateSummary",
  "tacticalGoals",
  "doctrineReadiness",
  "hardGates",
  "visibilityScope",
  "noRuntimeEffect",
]) {
  if (!report.requiredTraceFields.includes(requiredField)) {
    fail(`required trace field missing: ${requiredField}`);
  }
}

for (const requiredField of [
  "selectedActionId",
  "selectedActionType",
  "source",
]) {
  if (!report.requiredLegacyDecisionFields.includes(requiredField)) {
    fail(`required legacy decision field missing: ${requiredField}`);
  }
}

for (const requiredField of [
  "scoreStatus",
  "topCandidates",
  "blockedCandidates",
  "whyNot",
]) {
  if (!report.requiredSemanticDecisionFields.includes(requiredField)) {
    fail(`required semantic decision field missing: ${requiredField}`);
  }
}

for (const requiredConsumer of [
  "applyAction",
  "PlayerAction",
  "PublicEvent",
  "PlayerView",
  "WebSocket payload",
  "Reconnect payload",
  "Undo preview",
  "Replay payload",
  "Client error",
  "Planner weights",
  "Productive feature flag",
]) {
  if (!report.forbiddenConsumers.includes(requiredConsumer)) {
    fail(`forbidden consumer missing: ${requiredConsumer}`);
  }
}

for (const [counter, value] of Object.entries(report.hardGateCounters ?? {})) {
  if (value !== 0) fail(`hard gate counter must be zero: ${counter}`);
}

for (const requiredCode of [
  "SHADOW_MODE_TRACE_CONTRACT_SCHEMA_VERSION",
  "ShadowDecisionTrace",
  "LegacyDecisionTrace",
  "SemanticShadowDecisionTrace",
  "LegalActionTraceSummary",
  "ActionSemanticCandidateSummary",
  "TacticalGoalTrace",
  "DeckDoctrineReadinessTrace",
  "ShadowHardGateSummary",
  "visibilityScope: ShadowTraceVisibilityScope",
  "noRuntimeEffect: true",
  "actualDecision_equals_legacyDecision",
  "buildShadowModeTraceContractReport",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}

for (const runtimeFile of [
  "packages/ai/src/index.ts",
  "packages/ai/src/input-dto.ts",
  "packages/ai/src/runner-plans.ts",
  "packages/ai/src/corp-plans.ts",
]) {
  if (read(runtimeFile).includes("controlled-shadow-mode")) {
    fail(`runtime file imports controlled shadow mode: ${runtimeFile}`);
  }
}

for (const requiredText of [
  "actualDecision remains the legacy decision",
  "diagnostic only",
  "No runtime file imports",
  "AI051 is complete",
]) {
  if (!md.includes(requiredText)) fail(`Markdown report missing: ${requiredText}`);
}

for (const requiredTest of [
  "defines a developer-only no-runtime-effect trace contract",
  "requires legacy and semantic shadow decision evidence",
  "names public and runtime consumers as forbidden trace consumers",
  "can represent legacy execution and semantic shadow diagnostics side by side",
]) {
  if (!test.includes(requiredTest)) fail(`test coverage missing: ${requiredTest}`);
}

if (!progress.completedSteps.includes("AI051")) {
  fail("progress must include AI051");
}
if (progress.currentStep !== "AI052") fail("progress currentStep must be AI052");
if (progress.blocked !== false) fail("progress blocked must be false");

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  codePath,
  testPath,
  "scripts/check-ai051-shadow-mode-trace-contract.mjs",
  progressPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for AI051: ${unexpectedChanges.join(", ")}`);
}

console.log("AI051_SHADOW_MODE_TRACE_CONTRACT OK visibility=developer_only");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath = "docs/reviews/ai/meta15-complex-scope-enablement-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/meta15-complex-scope-enablement-report-2026-06-04.json";
const progressPath =
  "docs/reviews/ai/semantic-ai-meta13-meta18-progress-2026-06-04.json";
const codePath = "packages/ai/src/semantic-ai-production-readiness.ts";
const testPath = "packages/ai/src/semantic-ai-production-readiness.test.ts";
const scriptPath = "scripts/check-meta15-complex-scope-enablement.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`META15 check failed: ${message}`);
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
const progress = JSON.parse(read(progressPath));
const code = read(codePath);
const test = read(testPath);

if (report.schemaVersion !== "meta15-complex-scope-enablement-v0") {
  fail("schemaVersion mismatch");
}
if (report.step !== "META15") fail("step must be META15");
if (report.sourceStep !== "META14") fail("source step mismatch");
if (report.productiveActivationCount !== 0) fail("productive activation");
for (const scope of [
  "access_trash_steal",
  "trace_payment",
  "damage_prevention",
  "multi_target_multi_ability",
]) {
  if (!report.evaluatedScopes.includes(scope)) fail(`scope missing: ${scope}`);
  const dossier = report.dossiers.find((entry) => entry.scopeId === scope);
  if (!dossier) fail(`dossier missing: ${scope}`);
  if (dossier.productiveActivationAllowed !== false) {
    fail(`productive activation allowed: ${scope}`);
  }
}
const multi = report.dossiers.find(
  (entry) => entry.scopeId === "multi_target_multi_ability",
);
if (
  !multi ||
  multi.outputStatus !== "still_blocked_with_requirements" ||
  !multi.blockedReasons.includes("multi_ability_card_unresolved")
) {
  fail("multi-target/multi-ability blocker");
}
for (const [gate, value] of Object.entries(report.qualityGates)) {
  if (gate === "unsafeDivergenceCount") {
    if (value !== 0) fail("unsafe divergence");
  } else if (value !== true) {
    fail(`quality gate must be true: ${gate}`);
  }
}
if (report.goNoGo.decision !== "complex_scopes_shadow_or_blocked") {
  fail("go/no-go decision mismatch");
}
if (report.goNoGo.fullProductionReady !== false) fail("fullProductionReady");
if (report.goNoGo.legacyRemovalReady !== false) fail("legacyRemovalReady");
if (!progress.completedSteps.includes("META15")) fail("progress missing META15");
if (
  progress.complexScopeStatuses.multi_target_multi_ability !==
  "still_blocked_with_requirements"
) {
  fail("progress complex blocker missing");
}

for (const requiredCode of [
  "META15_COMPLEX_SCOPE_ENABLEMENT_SCHEMA_VERSION",
  "META15_COMPLEX_SCOPE_DOSSIERS",
  "buildMeta15ComplexScopeEnablementReport",
  "productiveActivationCount: 0",
]) {
  if (!code.includes(requiredCode)) fail(`code missing: ${requiredCode}`);
}
for (const forbiddenCode of [
  "chooseRunnerPlanAction",
  "chooseCorpPlanAction",
  "applyAction(",
  "complex_scope_productive_activation",
  "productiveActivationAllowed: true",
  "legacyRemovalReady: true",
  "fullProductionReady: true",
]) {
  if (code.includes(forbiddenCode)) fail(`forbidden code token: ${forbiddenCode}`);
}
for (const requiredTest of [
  "META15 Complex Scope Enablement",
  "without productive activation",
  "blocked with explicit requirements",
  "shadow/agreement ready or safely blocked",
]) {
  if (!test.includes(requiredTest)) fail(`test missing: ${requiredTest}`);
}
for (const requiredText of [
  "META 15 Complex Scope Enablement",
  "complex_scopes_shadow_or_blocked",
  "multi_ability_card_unresolved",
  "Produktivaktivierung komplexer Scopes ist in META 15 nicht erlaubt",
]) {
  if (!md.includes(requiredText)) fail(`Markdown missing: ${requiredText}`);
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  progressPath,
  codePath,
  testPath,
  scriptPath,
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for META15: ${unexpectedChanges.join(", ")}`);
}

console.log("META15_COMPLEX_SCOPE_ENABLEMENT OK");

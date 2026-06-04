import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai047-050-shadow-scoring-final-report-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai047-050-shadow-scoring-final-report-2026-06-04.json";
const statusPath = "docs/codex/CODEX_STATUS.md";

const stepReportPaths = [
  "docs/reviews/ai/ai047-shadow-scoring-fixture-design-2026-06-04.json",
  "docs/reviews/ai/ai048-shadow-only-action-ranking-report-2026-06-04.json",
  "docs/reviews/ai/ai049-legacy-vs-semantic-comparison-harness-2026-06-04.json",
  "docs/reviews/ai/ai050-hard-gate-rollback-readiness-review-2026-06-04.json",
];

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI047-AI050 final check failed: ${message}`);
  process.exit(1);
}

function changedFiles() {
  const names = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    const output = execFileSync("git", args, { encoding: "utf8" }).trim();
    if (!output) continue;
    for (const line of output.split(/\r?\n/)) names.add(line.trim());
  }
  return [...names].filter(Boolean).sort();
}

const md = read(mdPath);
const report = JSON.parse(read(jsonPath));
const status = read(statusPath);
const stepReports = stepReportPaths.map((path) => JSON.parse(read(path)));

if (report.step !== "AI047-AI050-FINAL")
  fail("JSON step must be AI047-AI050-FINAL");
if (report.status !== "done") fail("Final status must be done");
if (report.runtimeConsumerStatus !== "none")
  fail("runtimeConsumerStatus must be none");
if (report.verificationStatus !== "passed")
  fail("verificationStatus must be passed");
if (report.broaderShadowSimulationReadiness !== "ready_with_constraints")
  fail("broaderShadowSimulationReadiness must be ready_with_constraints");
if (report.productiveCutoverReadiness !== "blocked")
  fail("productiveCutoverReadiness must be blocked");
if (report.recommendedNextStep !== "broader_shadow_simulation")
  fail("recommendedNextStep must be broader_shadow_simulation");
if (report.completedSteps.length !== 4)
  fail("completedSteps must include AI047 through AI050");

for (const [flag, value] of Object.entries(report.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const requiredStep of ["AI047", "AI048", "AI049", "AI050"]) {
  if (!report.completedSteps.some((step) => step.step === requiredStep)) {
    fail(`completed step missing: ${requiredStep}`);
  }
  if (!stepReports.some((stepReport) => stepReport.step === requiredStep)) {
    fail(`source step report missing: ${requiredStep}`);
  }
}

for (const stepReport of stepReports) {
  if (stepReport.status !== "done") {
    fail(`source step report not done: ${stepReport.step}`);
  }
  if (stepReport.runtimeConsumerStatus !== "none") {
    fail(`source step has runtime consumer: ${stepReport.step}`);
  }
  if (stepReport.productiveUseAllowed !== false) {
    fail(`source step productive use must be false: ${stepReport.step}`);
  }
  for (const [flag, value] of Object.entries(stepReport.noEffectFlags ?? {})) {
    if (value !== false) {
      fail(`source no-effect flag must be false: ${stepReport.step}.${flag}`);
    }
  }
}

for (const forbidden of [
  "productive scoring",
  "live numeric scoring",
  "productive ranking",
  "action selection",
  "planner weights",
  "runtime consumer",
  "hidden-info projection",
  "legality generation",
  "feature flag cutover",
]) {
  if (!report.stillForbidden.includes(forbidden)) {
    fail(`forbidden item missing: ${forbidden}`);
  }
}

for (const requiredText of [
  "AI047 bis AI050",
  "Shadow-only Fixture-Design",
  "Produktiver Cutover bleibt blockiert",
  "ready_with_constraints",
  "blocked",
  "Broader Shadow Simulation",
]) {
  if (!md.includes(requiredText)) fail(`Markdown final report missing: ${requiredText}`);
}

for (const requiredStatusText of [
  "AI047-AI050",
  "Shadow-only Scoring-/Evaluation-Folgeblock",
  "ready_with_constraints",
  "Produktiver Cutover bleibt blockiert",
  "keine produktive Action-Auswahl",
]) {
  if (!status.includes(requiredStatusText)) {
    fail(`CODEX_STATUS missing: ${requiredStatusText}`);
  }
}

const allowedChangedFiles = [
  mdPath,
  jsonPath,
  statusPath,
  "scripts/check-ai047-050-shadow-scoring-final-report.mjs",
];
const unexpectedChanges = changedFiles().filter(
  (file) => !allowedChangedFiles.includes(file),
);
if (unexpectedChanges.length > 0) {
  fail(`Unexpected changed files for final report: ${unexpectedChanges.join(", ")}`);
}

console.log("AI047_050_SHADOW_SCORING_FINAL_REPORT OK");

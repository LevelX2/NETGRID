import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  buildReplayAcceptanceHarnessReport,
  renderReplayAcceptanceHarnessMarkdown,
} from "../packages/ai/src/evaluation/replay-acceptance-harness";
import type { ReplayDecisionCaseExtractionReport } from "../packages/ai/src/evaluation/replay-decision-case-extraction";
import type { ReplayDecisionCandidateClusterReport } from "../packages/ai/src/evaluation/replay-decision-case-clustering";

const repoRoot = findRepoRoot(process.cwd());
const runId = safeRunId(optionValue("--run-id") ?? "latest");
const outputDir = resolve(
  repoRoot,
  optionValue("--out-dir") ?? `data/local/ai-replay/${runId}`,
);
const casesPath =
  optionValue("--cases") ?? resolve(outputDir, `${runId}-decision-cases.json`);
const clustersPath =
  optionValue("--clusters") ??
  resolve(outputDir, `${runId}-candidate-clusters.json`);
const report = buildReplayAcceptanceHarnessReport(
  JSON.parse(readFileSync(casesPath, "utf8")) as ReplayDecisionCaseExtractionReport,
  JSON.parse(readFileSync(clustersPath, "utf8")) as ReplayDecisionCandidateClusterReport,
  {
    runId,
    fixedPattern: {
      selectedActionType: "draw_card",
      selectedPlanKind: "runner.obtain_breaker_coverage",
      challengerActionType: "start_run",
      challengerPlanKind: "simple_hq_or_rnd_pressure",
    },
    portableReproFixtures: numberOption("--portable-repro-fixtures") ?? 0,
    currentAiHoldoutEvaluated: booleanOption("--current-ai-holdout-evaluated"),
    fullAiTestGreen: booleanOption("--full-ai-test-green"),
  },
);

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  resolve(outputDir, `${runId}-acceptance-report.json`),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  resolve(outputDir, `${runId}-acceptance-report.md`),
  renderReplayAcceptanceHarnessMarkdown(report),
  "utf8",
);
console.log(JSON.stringify({ status: report.status, aggregate: report.aggregate }, null, 2));

function optionValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function booleanOption(name: string): boolean {
  const value = optionValue(name);
  return value === "true" || value === "1" || value === "yes";
}

function numberOption(name: string): number | undefined {
  const value = optionValue(name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function safeRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "-").slice(0, 80) || "latest";
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(current, "package.json"), "utf8"),
      ) as { name?: string };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) throw new Error(`Could not find NETGRID repo root from ${start}`);
    current = parent;
  }
}

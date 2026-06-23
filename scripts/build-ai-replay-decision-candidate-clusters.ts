import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import {
  buildReplayDecisionCandidateClusterReport,
  type ReplayDecisionCandidateClusterReport,
} from "../packages/ai/src/evaluation/replay-decision-case-clustering";
import type { ReplayDecisionCaseExtractionReport } from "../packages/ai/src/evaluation/replay-decision-case-extraction";

const repoRoot = findRepoRoot(process.cwd());
const runId = safeRunId(optionValue("--run-id") ?? "latest");
const outputDir = resolve(
  repoRoot,
  optionValue("--out-dir") ?? `data/local/ai-replay/${runId}`,
);
const inputPath =
  optionValue("--input") ??
  resolve(outputDir, `${runId}-decision-cases.json`);
const jsonOut = resolve(outputDir, `${runId}-candidate-clusters.json`);
const mdOut = resolve(outputDir, `${runId}-candidate-clusters.md`);

const source = JSON.parse(readFileSync(inputPath, "utf8")) as ReplayDecisionCaseExtractionReport;
const report = buildReplayDecisionCandidateClusterReport(source);

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(report), "utf8");
console.log(JSON.stringify(report.aggregate, null, 2));

function renderMarkdown(report: ReplayDecisionCandidateClusterReport): string {
  const clusterRows = report.clusters
    .slice(0, 20)
    .map(
      (cluster) =>
        `| \`${cluster.clusterId}\` | ${cluster.candidateCount} | ${cluster.selectedActionTypes.map(code).join(", ")} | ${cluster.challengerActionTypes.map(code).join(", ")} | ${cluster.averageScoreGap} | ${cluster.mistakeClasses.map(code).join(", ")} |`,
    )
    .join("\n");
  return `# KI-Replay-Kandidatencluster

Run-ID: \`${runId}\`

Quelle: \`${safeDisplayPath(inputPath)}\`

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Source-Cases | ${report.aggregate.sourceCases} |
| Discovery-Cases | ${report.aggregate.discoveryCases} |
| Holdout ignoriert | ${report.aggregate.holdoutCasesIgnored} |
| Kandidaten fuer Same-State-Repro | ${report.aggregate.candidates} |
| Blockiert als Shadow-only/zu schwach | ${report.aggregate.blockedShadowOnly} |
| Blockiert wegen Trace-Qualitaet | ${report.aggregate.blockedTraceQuality} |
| Cluster | ${report.aggregate.clusters} |

Ausgewaehlter Repro-Cluster: ${report.selectedClusterForRepro ? code(report.selectedClusterForRepro) : "keiner"}

## Top-Cluster

| Cluster | Kandidaten | Gewaehlte Aktion | Challenger | Ø Score-Gap | Fehlerklassen |
| --- | ---: | --- | --- | ---: | --- |
${clusterRows}

## Adjudikation

Die Cluster sind bewusst noch nicht als behobene oder bestaetigte KI-Fehler markiert. Die Einstufung lautet \`candidate_cluster_needs_repro\`, weil eine Semantic-/Debug-Rangliste allein nicht beweist, dass die historische Entscheidung aus legaler Same-State-Sicht falsch war. Das naechste Paket muss fuer den ausgewaehlten Cluster mindestens einen Same-State-Repro und Gegenkontrollen liefern.

## Verifikation

- \`corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-decision-case-clustering.test.ts --maxWorkers=1 --testTimeout=30000\`
- \`corepack pnpm --filter @netgrid/ai typecheck\`
`;
}

function code(value: string): string {
  return `\`${value}\``;
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

function optionValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function safeRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "-").slice(0, 80) || "latest";
}

function safeDisplayPath(path: string): string {
  const resolved = resolve(path);
  const relativePath = relative(repoRoot, resolved);
  return relativePath && !relativePath.startsWith("..")
    ? relativePath.replaceAll("\\", "/")
    : "external_local_file";
}

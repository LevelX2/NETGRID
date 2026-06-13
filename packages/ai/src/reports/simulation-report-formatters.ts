import { DOCTRINE_QUALITY_METRIC_NAMES } from "../simulation/simulation-metric-aggregation";

export type DoctrineQualityCaseAnalysisReportInput = {
  version: string;
  maxExamplesPerMetric: number;
  totals: Record<(typeof DOCTRINE_QUALITY_METRIC_NAMES)[number], number>;
  examples: Record<
    (typeof DOCTRINE_QUALITY_METRIC_NAMES)[number],
    {
      metric?: string;
      seed: string;
      actionIndex: number;
      stateVersionBefore?: number;
      side: string;
      actionType: string;
      reasonCode: string;
      targetServerId?: string;
      qualityTags: string[];
    }[]
  >;
  redactionSafe: boolean;
};

// Pure report formatting only. Simulation, randomness, and action selection stay
// in their dedicated runtime and harness modules.
export function formatDoctrineQualityCaseAnalysisReport(
  analysis: DoctrineQualityCaseAnalysisReportInput,
  title = "AI Deck Doctrine Quality Case Analysis",
): string {
  const lines = [
    `# ${title}`,
    "",
    `Version: ${analysis.version}`,
    `Max examples per metric: ${analysis.maxExamplesPerMetric}`,
    `Redaction safe: ${analysis.redactionSafe ? "yes" : "no"}`,
    "",
    "## Totals",
    "",
    "| Metric | Count | Examples |",
    "| --- | ---: | ---: |",
    ...DOCTRINE_QUALITY_METRIC_NAMES.map(
      (metric) =>
        `| ${metric} | ${analysis.totals[metric]} | ${analysis.examples[metric].length} |`,
    ),
    "",
    "## Examples",
    "",
  ];
  for (const metric of DOCTRINE_QUALITY_METRIC_NAMES) {
    lines.push(`### ${metric}`, "");
    const examples = analysis.examples[metric];
    if (examples.length === 0) {
      lines.push("Keine Beispiele im analysierten Lauf.", "");
      continue;
    }
    lines.push(
      "| Seed | Action | Side | Type | Reason | Server | Tags |",
      "| --- | ---: | --- | --- | --- | --- | --- |",
    );
    for (const example of examples) {
      lines.push(
        `| ${example.seed} | ${example.actionIndex} | ${example.side} | ${example.actionType} | ${example.reasonCode} | ${example.targetServerId ?? "none"} | ${example.qualityTags.join(", ")} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

import type {
  AiDoctrineQualityCaseAnalysis,
  AiDoctrineQualityMetricName,
} from "../index";

const DOCTRINE_QUALITY_METRICS: AiDoctrineQualityMetricName[] = [
  "nakedAgendaInstalls",
  "agendaFloodExposure",
  "scoreWindowMissed",
  "remoteOverbuild",
  "economyStall",
  "repeatedLowValueCentralRun",
  "rigStall",
  "assetTrashNeglect",
];

// Pure report formatting only. Simulation, randomness, and action selection stay
// in their dedicated runtime and harness modules.
export function formatDoctrineQualityCaseAnalysisReport(
  analysis: AiDoctrineQualityCaseAnalysis,
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
    ...DOCTRINE_QUALITY_METRICS.map(
      (metric) =>
        `| ${metric} | ${analysis.totals[metric]} | ${analysis.examples[metric].length} |`,
    ),
    "",
    "## Examples",
    "",
  ];
  for (const metric of DOCTRINE_QUALITY_METRICS) {
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

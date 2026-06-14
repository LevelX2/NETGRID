import type { SemanticShadowLeagueDeltaReport } from "../evaluation/semantic-shadow-league-delta";
import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";

export function formatSemanticShadowLeagueDeltaDashboard(
  report: SemanticShadowLeagueDeltaReport,
  title = "Semantic Shadow League Delta",
): string {
  const markdown = [
    `# ${title}`,
    "",
    `Baseline: \`${report.baselineReference}\``,
    `Current: \`${report.currentReference}\``,
    "",
    "## Summary",
    "",
    `Scenario delta: ${signed(report.dashboardSummary.scenarioCountDelta)}`,
    `Agreement: ${report.dashboardSummary.agreementDirection}`,
    `Mistakes: ${report.dashboardSummary.mistakeDirection}`,
    `Follow-ups: ${report.dashboardSummary.followupDirection}`,
    "",
    "## Metrics",
    "",
    "| Metric | Baseline | Current | Delta | Direction |",
    "| --- | ---: | ---: | ---: | --- |",
    metricRow("Agreement rate", report.agreementRateDelta),
    metricRow("Mistake count", report.mistakeCountDelta),
    metricRow("Pilot eligibility", report.pilotEligibilityDelta),
    metricRow("Follow-up candidates", report.followupCandidateCountDelta),
    "",
    "## Pilot Readiness",
    "",
    "| Scope | Candidate Delta | Allowed Delta | Would Override Delta | Recommendation Changed |",
    "| --- | ---: | ---: | ---: | --- |",
    ...Object.entries(report.pilotReadinessDelta).map(
      ([scope, delta]) =>
        `| ${scope} | ${signed(delta.candidateDelta)} | ${signed(delta.allowedDelta)} | ${signed(delta.wouldOverrideDelta)} | ${delta.recommendationChanged ? "yes" : "no"} |`,
    ),
    "",
    "## Evidence",
    "",
    ...report.dashboardSummary.evidence.map((entry) => `- \`${entry}\``),
    "",
    "Runtime consumer: `none`",
  ].join("\n");
  assertSemanticObjectSideSafe(markdown, "SemanticShadowLeagueDeltaDashboard");
  return markdown;
}

function metricRow(
  label: string,
  delta: SemanticShadowLeagueDeltaReport["agreementRateDelta"],
): string {
  return `| ${label} | ${formatMetric(delta.baseline)} | ${formatMetric(delta.current)} | ${formatMetric(delta.delta, true)} | ${delta.direction} |`;
}

function formatMetric(value: number | null, signedValue = false): string {
  if (value === null) return "n/a";
  return signedValue ? signed(value) : String(value);
}

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

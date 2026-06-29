import type { AiDecisionDebug } from "@netgrid/shared";
import { assertSemanticObjectSideSafe } from "./semantic-redaction";

export const SEMANTIC_RUNTIME_WHY_COVERAGE_SCHEMA_VERSION =
  "semantic-runtime-why-coverage-v1" as const;

export type SemanticRuntimeWhyCoverageReport = {
  schemaVersion: typeof SEMANTIC_RUNTIME_WHY_COVERAGE_SCHEMA_VERSION;
  scope: "semantic_runtime_why_coverage_report_only";
  sampleCount: number;
  decisionsWithTopLevelWhyNot: number;
  decisionsMissingTopLevelWhyNot: number;
  decisionsWithRuntimeWhyNotSection: number;
  decisionsMissingRuntimeWhyNotSection: number;
  actionAlternativeCount: number;
  selectedActionAlternativeCount: number;
  selectedActionAlternativesWithWhyChosen: number;
  selectedActionAlternativesMissingWhyChosen: number;
  nonSelectedActionAlternativeCount: number;
  nonSelectedActionAlternativesWithWhyNot: number;
  nonSelectedActionAlternativesMissingWhyNot: number;
  actionAlternativesWithWhyChosen: number;
  actionAlternativesMissingWhyChosen: number;
  actionAlternativesWithWhyNot: number;
  actionAlternativesMissingWhyNot: number;
  rankedAlternativeCount: number;
  rankedAlternativesWithWhyNot: number;
  rankedAlternativesMissingWhyNot: number;
  redactionStatus: "passed";
  productiveUseAllowed: false;
  noRuntimeEffect: true;
  evidence: string[];
};

export function buildSemanticRuntimeWhyCoverageReport(
  decisions: readonly AiDecisionDebug[],
): SemanticRuntimeWhyCoverageReport {
  const actionAlternatives = decisions.flatMap(
    (decision) => decision.actionAlternatives ?? [],
  );
  const selectedActionAlternatives = actionAlternatives.filter(
    (alternative) => alternative.selected,
  );
  const nonSelectedActionAlternatives = actionAlternatives.filter(
    (alternative) => !alternative.selected,
  );
  const rankedAlternatives = decisions.flatMap(
    (decision) => decision.rankedAlternatives ?? [],
  );
  const report: SemanticRuntimeWhyCoverageReport = {
    schemaVersion: SEMANTIC_RUNTIME_WHY_COVERAGE_SCHEMA_VERSION,
    scope: "semantic_runtime_why_coverage_report_only",
    sampleCount: decisions.length,
    decisionsWithTopLevelWhyNot: decisions.filter(
      (decision) => (decision.whyNot?.length ?? 0) > 0,
    ).length,
    decisionsMissingTopLevelWhyNot: decisions.filter(
      (decision) => (decision.whyNot?.length ?? 0) === 0,
    ).length,
    decisionsWithRuntimeWhyNotSection: decisions.filter((decision) =>
      (decision.detailSections ?? []).some(
        (section) => section.id === "runtime_why_not",
      ),
    ).length,
    decisionsMissingRuntimeWhyNotSection: decisions.filter(
      (decision) =>
        !(decision.detailSections ?? []).some(
          (section) => section.id === "runtime_why_not",
        ),
    ).length,
    actionAlternativeCount: actionAlternatives.length,
    selectedActionAlternativeCount: selectedActionAlternatives.length,
    selectedActionAlternativesWithWhyChosen: selectedActionAlternatives.filter(
      (alternative) => (alternative.whyChosen?.length ?? 0) > 0,
    ).length,
    selectedActionAlternativesMissingWhyChosen:
      selectedActionAlternatives.filter(
        (alternative) => (alternative.whyChosen?.length ?? 0) === 0,
      ).length,
    nonSelectedActionAlternativeCount: nonSelectedActionAlternatives.length,
    nonSelectedActionAlternativesWithWhyNot:
      nonSelectedActionAlternatives.filter(
        (alternative) => (alternative.whyNot?.length ?? 0) > 0,
      ).length,
    nonSelectedActionAlternativesMissingWhyNot:
      nonSelectedActionAlternatives.filter(
        (alternative) => (alternative.whyNot?.length ?? 0) === 0,
      ).length,
    actionAlternativesWithWhyChosen: actionAlternatives.filter(
      (alternative) => (alternative.whyChosen?.length ?? 0) > 0,
    ).length,
    actionAlternativesMissingWhyChosen: actionAlternatives.filter(
      (alternative) => (alternative.whyChosen?.length ?? 0) === 0,
    ).length,
    actionAlternativesWithWhyNot: actionAlternatives.filter(
      (alternative) => (alternative.whyNot?.length ?? 0) > 0,
    ).length,
    actionAlternativesMissingWhyNot: actionAlternatives.filter(
      (alternative) => (alternative.whyNot?.length ?? 0) === 0,
    ).length,
    rankedAlternativeCount: rankedAlternatives.length,
    rankedAlternativesWithWhyNot: rankedAlternatives.filter(
      (alternative) => (alternative.whyNot?.length ?? 0) > 0,
    ).length,
    rankedAlternativesMissingWhyNot: rankedAlternatives.filter(
      (alternative) => (alternative.whyNot?.length ?? 0) === 0,
    ).length,
    redactionStatus: "passed",
    productiveUseAllowed: false,
    noRuntimeEffect: true,
    evidence: [
      "semantic_runtime_why_coverage:report_only",
      `sample_count:${decisions.length}`,
      `decision_top_level_why_not_count:${
        decisions.filter((decision) => (decision.whyNot?.length ?? 0) > 0)
          .length
      }`,
      `action_alternative_count:${actionAlternatives.length}`,
      `selected_action_alternative_count:${selectedActionAlternatives.length}`,
      `non_selected_action_alternative_count:${nonSelectedActionAlternatives.length}`,
      `ranked_alternative_count:${rankedAlternatives.length}`,
    ],
  };
  assertSemanticObjectSideSafe(report, "SemanticRuntimeWhyCoverageReport");
  return report;
}

export function renderSemanticRuntimeWhyCoverageMarkdown(
  report: SemanticRuntimeWhyCoverageReport,
): string {
  return `# Semantic Runtime Why Coverage

Scope: \`${report.scope}\`

## Summary

| Metric | Count |
| --- | ---: |
| Samples | ${report.sampleCount} |
| Decisions with top-level WhyNot | ${report.decisionsWithTopLevelWhyNot} |
| Decisions missing top-level WhyNot | ${report.decisionsMissingTopLevelWhyNot} |
| Decisions with Runtime WhyNot section | ${report.decisionsWithRuntimeWhyNotSection} |
| Decisions missing Runtime WhyNot section | ${report.decisionsMissingRuntimeWhyNotSection} |
| ActionAlternatives | ${report.actionAlternativeCount} |
| Selected ActionAlternatives | ${report.selectedActionAlternativeCount} |
| Selected ActionAlternatives with WhyChosen | ${report.selectedActionAlternativesWithWhyChosen} |
| Selected ActionAlternatives missing WhyChosen | ${report.selectedActionAlternativesMissingWhyChosen} |
| Non-selected ActionAlternatives | ${report.nonSelectedActionAlternativeCount} |
| Non-selected ActionAlternatives with WhyNot | ${report.nonSelectedActionAlternativesWithWhyNot} |
| Non-selected ActionAlternatives missing WhyNot | ${report.nonSelectedActionAlternativesMissingWhyNot} |
| ActionAlternatives with WhyChosen | ${report.actionAlternativesWithWhyChosen} |
| ActionAlternatives missing WhyChosen | ${report.actionAlternativesMissingWhyChosen} |
| ActionAlternatives with WhyNot | ${report.actionAlternativesWithWhyNot} |
| ActionAlternatives missing WhyNot | ${report.actionAlternativesMissingWhyNot} |
| RankedAlternatives | ${report.rankedAlternativeCount} |
| RankedAlternatives with WhyNot | ${report.rankedAlternativesWithWhyNot} |
| RankedAlternatives missing WhyNot | ${report.rankedAlternativesMissingWhyNot} |

## Gates

| Gate | Value |
| --- | --- |
| Redaction status | \`${report.redactionStatus}\` |
| Productive use allowed | \`${report.productiveUseAllowed}\` |
| Runtime effect | \`${!report.noRuntimeEffect}\` |

## Evidence

${report.evidence.map((entry) => `- \`${entry}\``).join("\n")}
`;
}

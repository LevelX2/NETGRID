import type { AiDecisionDebug } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "./semantic-redaction";
import {
  buildSemanticRuntimeWhyCoverageReport,
  renderSemanticRuntimeWhyCoverageMarkdown,
  SEMANTIC_RUNTIME_WHY_COVERAGE_SCHEMA_VERSION,
} from "./semantic-runtime-why-coverage";

describe("SemanticRuntimeWhyCoverage", () => {
  it("summarizes why coverage without becoming a runtime consumer", () => {
    const report = buildSemanticRuntimeWhyCoverageReport([
      decisionDebug({
        whyNot: ["alternative:draw_card:semantic_score_below_selected"],
        detailSections: [
          {
            id: "runtime_why_not",
            title: "Runtime Why Not",
            items: ["alternative:draw_card:semantic_score_below_selected"],
          },
        ],
        actionAlternatives: [
          {
            rank: 1,
            actionId: "gain",
            actionType: "gain_credit",
            selected: true,
            whyChosen: ["semantic_runtime_actual"],
          },
          {
            rank: 2,
            actionId: "draw",
            actionType: "draw_card",
            selected: false,
            whyNot: ["semantic_score_below_selected"],
          },
        ],
        rankedAlternatives: [
          {
            rank: 1,
            selectedActionType: "gain_credit",
            whyNot: ["selected_action"],
          },
          {
            rank: 2,
            selectedActionType: "draw_card",
            whyNot: ["semantic_score_below_selected"],
          },
        ],
      }),
      decisionDebug(),
    ]);

    expect(report).toMatchObject({
      schemaVersion: SEMANTIC_RUNTIME_WHY_COVERAGE_SCHEMA_VERSION,
      scope: "semantic_runtime_why_coverage_report_only",
      auditStatus: "incomplete",
      sampleCount: 2,
      decisionsWithTopLevelWhyNot: 1,
      decisionsMissingTopLevelWhyNot: 1,
      decisionsWithRuntimeWhyNotSection: 1,
      decisionsMissingRuntimeWhyNotSection: 1,
      actionAlternativeCount: 2,
      selectedActionAlternativeCount: 1,
      selectedActionAlternativesWithWhyChosen: 1,
      selectedActionAlternativesMissingWhyChosen: 0,
      nonSelectedActionAlternativeCount: 1,
      nonSelectedActionAlternativesWithWhyNot: 1,
      nonSelectedActionAlternativesMissingWhyNot: 0,
      actionAlternativesWithWhyChosen: 1,
      actionAlternativesMissingWhyChosen: 1,
      actionAlternativesWithWhyNot: 1,
      actionAlternativesMissingWhyNot: 1,
      rankedAlternativeCount: 2,
      rankedAlternativesWithWhyNot: 2,
      rankedAlternativesMissingWhyNot: 0,
      redactionStatus: "passed",
      productiveUseAllowed: false,
      noRuntimeEffect: true,
      missingCoverageSignals: [
        "decisions_missing_top_level_why_not:1",
        "decisions_missing_runtime_why_not_section:1",
      ],
    });
    expect(report.evidence).toEqual(
      expect.arrayContaining([
        "semantic_runtime_why_coverage:report_only",
        "audit_status:incomplete",
        "sample_count:2",
        "decision_top_level_why_not_count:1",
        "selected_action_alternative_count:1",
        "non_selected_action_alternative_count:1",
      ]),
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);

    const markdown = renderSemanticRuntimeWhyCoverageMarkdown(report);
    expect(markdown).toContain("# Semantic Runtime Why Coverage");
    expect(markdown).toContain("| Decisions missing top-level WhyNot | 1 |");
    expect(markdown).toContain("| Audit status | `incomplete` |");
    expect(markdown).toContain(
      "- `decisions_missing_runtime_why_not_section:1`",
    );
    expect(markdown).toContain(
      "| Selected ActionAlternatives with WhyChosen | 1 |",
    );
    expect(markdown).toContain(
      "| Non-selected ActionAlternatives with WhyNot | 1 |",
    );
    expect(markdown).toContain("| Runtime effect | `false` |");
    expect(containsForbiddenSemanticMarker(markdown)).toBe(false);
  });
});

function decisionDebug(
  overrides: Partial<AiDecisionDebug> = {},
): AiDecisionDebug {
  return {
    schemaVersion: "ai-decision-debug-v1",
    aiLevel: 2,
    ...overrides,
  };
}

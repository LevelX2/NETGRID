import type { AiDecisionDebug } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "./semantic-redaction";
import {
  buildSemanticRuntimeWhyCoverageReport,
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
      sampleCount: 2,
      decisionsWithTopLevelWhyNot: 1,
      decisionsWithRuntimeWhyNotSection: 1,
      actionAlternativeCount: 2,
      actionAlternativesWithWhyChosen: 1,
      actionAlternativesWithWhyNot: 1,
      rankedAlternativeCount: 2,
      rankedAlternativesWithWhyNot: 2,
      redactionStatus: "passed",
      productiveUseAllowed: false,
      noRuntimeEffect: true,
    });
    expect(report.evidence).toEqual(
      expect.arrayContaining([
        "semantic_runtime_why_coverage:report_only",
        "sample_count:2",
        "decision_top_level_why_not_count:1",
      ]),
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
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

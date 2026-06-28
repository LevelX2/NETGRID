import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import { semanticRuntimeCoverageSelectionDebug } from "./coverage-selection-debug";

describe("semanticRuntimeCoverageSelectionDebug", () => {
  it("matches Mantis source identities by bounded token", () => {
    const mantisDebug = debugForSource("mantis-card");
    const noiseDebug = debugForSource("romantis-card");
    const suffixNoiseDebug = debugForSource("mantisish-card");

    expect(mantisDebug?.evidence).toEqual(
      expect.arrayContaining([
        "why_mantis_selected:searches_for_required_breaker_coverage",
      ]),
    );
    expect(noiseDebug?.evidence).not.toContain(
      "why_mantis_selected:searches_for_required_breaker_coverage",
    );
    expect(suffixNoiseDebug?.evidence).not.toContain(
      "why_mantis_selected:searches_for_required_breaker_coverage",
    );
  });

  it("reads coverage answer roles from exact rationale entries", () => {
    const searchDebug = debugForSource("search-card", [
      "coverageAnswerRoleish:direct_breaker_install",
      "coverageAnswerRole:program_search",
    ]);
    const snakeDebug = debugForSource("draw-card", [
      "coverage_answer_role:draw_for_answer",
    ]);
    const noiseDebug = debugForSource("noise-card", [
      "coverageAnswerRoleish:program_search",
      "coverage_answer_role_suffix:draw_for_answer",
    ]);

    expect(searchDebug?.answerFit).toBe("direct_card_search");
    expect(searchDebug?.evidence).toContain("coverageAnswerRole:program_search");
    expect(snakeDebug?.answerFit).toBe("draw_for_answer");
    expect(snakeDebug?.evidence).toContain("coverageAnswerRole:draw_for_answer");
    expect(noiseDebug?.answerFit).toBe("direct_card_search");
    expect(noiseDebug?.evidence).toContain("coverageAnswerRole:unknown");
  });
});

function debugForSource(
  source: string,
  rationale: readonly string[] = ["coverageAnswerRole:program_search"],
) {
  const action: LegalAction = {
    actionId: "search",
    side: "runner",
    type: "play_event",
    label: "Search",
    source,
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
  return semanticRuntimeCoverageSelectionDebug(
    {} as AiDecisionInput,
    action,
    {
      selectedPlan: { type: "runner.obtain_breaker_coverage" },
      selectedStep: {
        kind: "search_for_answer",
        requiredCapabilities: [{ kind: "breaker_code_gate" }],
      },
      selectedMapping: {
        legalActions: [action],
        rationale,
      },
    } as unknown as TacticalPlanRuntimeResult,
    {
      visibleSourceCard: () => ({
        title: "Search",
        definitionId: source,
      }),
    },
  );
}

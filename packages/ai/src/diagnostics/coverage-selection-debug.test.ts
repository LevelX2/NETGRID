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
});

function debugForSource(source: string) {
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
        rationale: ["coverageAnswerRole:program_search"],
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

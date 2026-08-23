import type { VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { structuredBreakerAssessment } from "./visible-run-breaker-path";

describe("visible run breaker path", () => {
  it("carries a current-turn Psychic Friend pump across later ICE", () => {
    const assessment = structuredBreakerAssessment({
      breakerCard: {
        instanceId: "psychic-friend",
        definitionId: "onr_classic_030_psychic-friend",
      } as VisibleCard,
      breakerDefinition:
        CARD_DEFINITIONS_BY_ID["onr_classic_030_psychic-friend"],
      ice: {
        instanceId: "code-gate",
        definitionId: "simple_code_gate_ice",
        subtypes: ["code_gate"],
        strength: 3,
      },
      subroutineCount: 1,
      subroutines: [{ id: "code-gate.etr", type: "end_the_run" }],
      currentBreakerStrength: 1,
      additionalBreakCostPerSubroutine: 0,
    });

    expect(assessment).toMatchObject({
      cost: 5,
      endingStrength: 3,
      carriesStrengthAcrossIce: true,
    });
  });
});

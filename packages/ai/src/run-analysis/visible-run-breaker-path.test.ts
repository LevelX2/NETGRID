import type { VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  effectiveIceForQuote,
  projectIceForRunPathEffects,
  structuredBreakerAssessment,
} from "./visible-run-breaker-path";

describe("visible run breaker path", () => {
  it("uses encounter modifiers once and carries later strength increases onto that quote", () => {
    const ice = {
      instanceId: "wall",
      definitionId: "onr_v1_279_wall-of-static",
      known: true,
      rezzed: true,
      strength: 2,
      effectiveRunQuote: {
        iceInstanceId: "wall",
        iceDefinitionId: "onr_v1_279_wall-of-static",
        effectiveStrength: 2,
        encounterStrength: 0,
        subroutines: [],
      },
    } as VisibleCard;
    expect(effectiveIceForQuote(ice, ice.effectiveRunQuote).strength).toBe(0);
    const projected = projectIceForRunPathEffects(
      ice,
      [{ increasesFutureIceStrength: 3 }],
      0,
    );
    expect(projected.effectiveRunQuote?.effectiveStrength).toBe(5);
    expect(
      effectiveIceForQuote(projected, projected.effectiveRunQuote).strength,
    ).toBe(3);
  });
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

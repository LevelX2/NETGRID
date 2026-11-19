import type { VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";
import {
  carryProjectedBreakerStrength,
  effectiveIceForQuote,
  projectIceForRunPathEffects,
  structuredBreakerAssessment,
} from "./visible-run-breaker-path";

describe("visible run breaker path", () => {
  it("uses encounter modifiers once and carries later strength increases onto that quote", () => {
    const ice = {
      instanceId: "wall",
      definitionId: 491,
      known: true,
      rezzed: true,
      strength: 2,
      effectiveRunQuote: {
        iceInstanceId: "wall",
        iceDefinitionId: 491,
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
        definitionId: 34,
      } as VisibleCard,
      breakerDefinition:
        planningCardFactsByDefinitionId(34),
      ice: {
        instanceId: "code-gate",
        definitionId: 590,
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
      strengthGainAfterEncounter: 2,
    });
    const strengths = new Map([["psychic-friend", 1]]);
    carryProjectedBreakerStrength(assessment!, strengths);
    expect(strengths.get("psychic-friend")).toBe(3);
  });
});

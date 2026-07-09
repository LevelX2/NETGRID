import scenarioData from "../../../../data/scenarios/proteus-ai-family-decision-smokes-v1.json";
import inventoryData from "../../../../data/ai/proteus-ai-readiness-inventory-v1.json";
import { describe, expect, it } from "vitest";

describe("Proteus family decision scenarios", () => {
  it("covers every pilot-deck card exactly once through its readiness family", () => {
    const pilotCards = inventoryData.cards
      .filter((card) => card.pilotDeckIds.length > 0)
      .map((card) => card.cardId)
      .sort();
    const coveredCards = scenarioData.scenarios
      .flatMap((scenario) => scenario.cards)
      .sort();

    expect(scenarioData.schemaVersion).toBe(
      "netgrid.proteus-ai-family-scenarios.v1",
    );
    expect(scenarioData.scenarios).toHaveLength(11);
    expect(coveredCards).toHaveLength(114);
    expect(new Set(coveredCards).size).toBe(coveredCards.length);
    expect(coveredCards).toEqual(pilotCards);
  });

  it("binds every scenario to positive, negative, AI and real-engine evidence", () => {
    for (const scenario of scenarioData.scenarios) {
      expect(scenario.positiveDecisionAssertions.length).toBeGreaterThan(0);
      expect(scenario.negativeDecisionAssertions).toEqual(
        expect.arrayContaining([
          "never_submit_non_legal_action",
          "never_cross_hidden_info_boundary",
        ]),
      );
      expect(scenario.aiEvidence.length).toBeGreaterThan(0);
      expect(scenario.engineEvidence.length).toBeGreaterThan(0);
    }
  });

  it("adds family-specific evidence refs and clears that removal condition", () => {
    for (const card of inventoryData.cards.filter(
      (entry) => entry.pilotDeckIds.length > 0,
    )) {
      expect(card.evidence.scenarioRefs).toContain(
        `data/scenarios/proteus-ai-family-decision-smokes-v1.json#proteus_${card.primaryFamily}`,
      );
      expect(card.removalConditions).not.toContain(
        `${card.primaryFamily}_decision_smoke_green`,
      );
    }
  });

  it("locks the safety and determinism gates", () => {
    expect(scenarioData.invariants).toEqual({
      rulesEngineOnlyLegalActions: true,
      hiddenStateInvariance: true,
      deterministicReplayAndStateHash: true,
      futureRandomOutcomeAccess: false,
      cardTextParsingAllowed: false,
    });
  });
});

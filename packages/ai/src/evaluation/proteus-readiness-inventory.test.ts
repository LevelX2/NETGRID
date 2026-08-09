import inventoryData from "../../../../data/ai/proteus-ai-readiness-inventory-v1.json";
import { describe, expect, it } from "vitest";
import { RUNTIME_CARDS } from "../ai-hints";

const allowedFamilies = new Set([
  "baseline",
  "target_choice",
  "run_modification",
  "access_ambush",
  "x_cost",
  "temporary_action",
  "random_outcome",
  "bad_publicity",
  "hidden_resource",
  "virus_counter",
  "complex_multi_ability",
]);

describe("Proteus AI readiness inventory", () => {
  it("classifies every effective Proteus card exactly once", () => {
    const inventoryIds = inventoryData.cards.map((entry) => entry.cardId);
    const effectiveProteusIds = Object.values(RUNTIME_CARDS)
      .filter((card) => card.setId === "proteus")
      .map((card) => card.catalogCardId)
      .sort();

    expect(inventoryData.schemaVersion).toBe(
      "netgrid.proteus-ai-readiness-inventory.v1",
    );
    expect(inventoryIds).toHaveLength(154);
    expect(new Set(inventoryIds).size).toBe(154);
    expect([...inventoryIds].sort()).toEqual(effectiveProteusIds);
    expect(
      inventoryData.cards.every((entry) =>
        allowedFamilies.has(entry.primaryFamily),
      ),
    ).toBe(true);
  });

  it("keeps pilot deck cards attached to readiness evidence", () => {
    const pilotCards = inventoryData.cards.filter(
      (entry) => entry.pilotDeckIds.length > 0,
    );

    expect(pilotCards.length).toBe(inventoryData.summary.pilotDeckCardCount);
    expect(pilotCards.length).toBeGreaterThan(0);
    expect(
      pilotCards.every(
        (entry) =>
          entry.removalConditions.includes("pilot_benchmark_coverage") ||
          entry.evidence.benchmarkCovered,
      ),
    ).toBe(true);
  });

  it("uses curated AI semantics rather than card text parsing", () => {
    expect(inventoryData.classificationPolicy).toMatchObject({
      source: "curated_ai_hint_semantics_only",
      cardTextParsingAllowed: false,
      exactlyOnePrimaryFamily: true,
    });
  });
});

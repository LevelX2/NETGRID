import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";

import { enrichVisibleCard, iceStrengthBadgeValue } from "../features/cards/card-view-model";

type CardDetailsById = Parameters<typeof enrichVisibleCard>[1];
type CardDetail = CardDetailsById[string];

const emptyNumeric = {
  cost: null,
  installCost: null,
  memoryCost: null,
  strength: null,
  rezCost: null,
  trashCost: null,
  advancementRequirement: null,
  agendaPoints: null,
};

function detail(cardId: string, strength: number | null): CardDetail {
  return {
    catalogCardId: cardId,
    title: cardId,
    side: "corp",
    type: "ice",
    subtypes: ["wall"],
    text: "",
    setId: "test",
    setName: "Test",
    collectorNumber: "1",
    numeric: {
      ...emptyNumeric,
      strength,
    },
  };
}

describe("card view model ICE strength badge", () => {
  it("keeps numeric printed ICE from showing a total strength badge", () => {
    const card: VisibleCard = {
      instanceId: "ice-1",
      known: true,
      definitionId: "numeric-ice",
      title: "Numeric ICE",
      type: "ice",
      strength: 5,
    };

    const enriched = enrichVisibleCard(card, {
      "numeric-ice": detail("numeric-ice", 3),
    });

    expect(enriched.printedStrength).toBe(3);
    expect(enriched.strengthModifier).toBe(2);
    expect(iceStrengthBadgeValue(enriched)).toBeNull();
  });

  it("shows the current total strength badge for variable X-strength ICE", () => {
    const card: VisibleCard = {
      instanceId: "ice-2",
      known: true,
      definitionId: "variable-ice",
      title: "Variable ICE",
      type: "ice",
      strength: 4,
    };

    const enriched = enrichVisibleCard(card, {
      "variable-ice": detail("variable-ice", null),
    });

    expect(enriched.printedStrength).toBeNull();
    expect(enriched.strengthModifier).toBeUndefined();
    expect(iceStrengthBadgeValue(enriched)).toBe(4);
  });

  it("does not expose strength badges for hidden ICE", () => {
    expect(
      iceStrengthBadgeValue({
        instanceId: "ice-3",
        known: false,
        type: "ice",
        strength: 6,
        printedStrength: null,
      }),
    ).toBeNull();
  });
});

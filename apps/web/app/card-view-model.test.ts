import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";

import {
  aiBoonRunStrengthBadgeValue,
  enrichVisibleCard,
  iceStrengthBadgeValue,
} from "../features/cards/card-view-model";

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

describe("card view model AI Boon run strength badge", () => {
  it("shows AI Boon's current run strength over its empty printed strength area", () => {
    const card: VisibleCard = {
      instanceId: "ai-boon-1",
      known: true,
      definitionId: "onr_v1_002_ai-boon",
      title: "AI Boon",
      type: "program",
      strength: 5,
    };
    const enriched = enrichVisibleCard(card, {
      "onr_v1_002_ai-boon": {
        ...detail("onr_v1_002_ai-boon", null),
        side: "runner",
        type: "program",
        subtypes: ["icebreaker", "random"],
      },
    });

    expect(enriched.printedStrength).toBeNull();
    expect(aiBoonRunStrengthBadgeValue(enriched)).toBe(5);
    expect(
      aiBoonRunStrengthBadgeValue(enriched, { preview: true }),
    ).toBeNull();
  });

  it("hides the chip when AI Boon has no active run strength", () => {
    expect(
      aiBoonRunStrengthBadgeValue({
        instanceId: "ai-boon-2",
        known: true,
        definitionId: "onr_v1_002_ai-boon",
        title: "AI Boon",
        type: "program",
        printedStrength: null,
      }),
    ).toBeNull();
  });
});
